import Handlebars from "handlebars";
import type { NodeExecutor } from "@/features/execution/types";
import { NonRetriableError } from "inngest";
import { generateText } from "ai";
import { autonomeChannel } from "@/inngest/channels/autonome";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const SafeString = new Handlebars.SafeString(jsonString);
  return SafeString;
});

type AutonomeData = {
  variableName?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

export const autonomeExecutor: NodeExecutor<AutonomeData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    autonomeChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.variableName) {
    await publish(
      autonomeChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Autonome node: variable name is missing");
  }

  if (!data.userPrompt) {
    await publish(
      autonomeChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Autonome node: user prompt is missing");
  }

  const systemPrompt = data.systemPrompt
    ? Handlebars.compile(data.systemPrompt)(context)
    : "You are a helpful assistant.";

  const userPrompt = Handlebars.compile(data.userPrompt)(context);

  const nimApiKey = process.env.NIM_API_KEY;

  if (!nimApiKey) {
    await publish(
      autonomeChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Autonome node: missing NIM_API_KEY");
  }

  const nim = createOpenAICompatible({
    name: "nim",
    baseURL: "https://integrate.api.nvidia.com/v1",
    headers: {
      Authorization: `Bearer ${nimApiKey}`,
    },
  });

  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  try {
    const { steps } = await step.ai.wrap(
      "autonome-generate-text",
      generateText,
      {
        model: nim.chatModel("moonshotai/kimi-k2-thinking"),
        system: systemPrompt,
        prompt: userPrompt,
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      }
    );

    const text =
      steps[0]?.content[0]?.type === "text" ? steps[0].content[0].text : "";

    await publish(
      autonomeChannel().status({
        nodeId,
        status: "success",
      })
    );

    return {
      ...context,
      [data.variableName]: {
        text,
      },
    };
  } catch (error) {
    await publish(
      autonomeChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw error;
  }
};
