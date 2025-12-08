import Handlebars from "handlebars";
import type { NodeExecutor } from "@/features/execution/types";
import { NonRetriableError } from "inngest";
import { generateText } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { anthropicChannel } from "@/inngest/channels/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { FREE_CREDENTIAL_ID } from "@/config/ai-models";
import prisma from "@/lib/db";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const SafeString = new Handlebars.SafeString(jsonString);
  return SafeString;
});

type AnthropicData = {
  variableName?: string;
  credentialId?: string;
  model?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

export const anthropicExecutor: NodeExecutor<AnthropicData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
}) => {
  await publish(
    anthropicChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.variableName) {
    await publish(
      anthropicChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Anthropic node: variable name is missing");
  }

  if (!data.credentialId) {
    await publish(
      anthropicChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Anthropic node: credential is missing");
  }

  if (!data.userPrompt) {
    await publish(
      anthropicChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Anthropic node: user prompt is missing");
  }

  const systemPrompt = data.systemPrompt
    ? Handlebars.compile(data.systemPrompt)(context)
    : "You are a helpful assistant.";

  const userPrompt = Handlebars.compile(data.userPrompt)(context);

  const isFreeTier = data.credentialId === FREE_CREDENTIAL_ID;

  try {
    let model;

    if (isFreeTier) {
      // Use NIM for free tier
      const nimApiKey = process.env.NIM_API_KEY;
      if (!nimApiKey) {
        await publish(
          anthropicChannel().status({
            nodeId,
            status: "error",
          })
        );
        throw new NonRetriableError(
          "Anthropic node: missing NIM_API_KEY for free tier"
        );
      }

      const nim = createOpenAICompatible({
        name: "nim",
        baseURL: "https://integrate.api.nvidia.com/v1",
        headers: {
          Authorization: `Bearer ${nimApiKey}`,
        },
      });

      model = nim.chatModel('moonshotai/kimi-k2-instruct-0905');
    } else {
      // Fetch user's credential and use Anthropic
      const credential = await step.run("get-credential", () => {
        return prisma.credential.findUniqueOrThrow({
          where: { id: data.credentialId, userId},
        });
      });

      if (!credential) {
        throw new NonRetriableError("Anthropic node: credential not found");
      }

      const anthropic = createAnthropic({
        apiKey: credential.value,
      });

      model = anthropic(data.model || "claude-3-5-sonnet-latest");
    }

    const result = await step.ai.wrap("anthropic-generate-text", generateText, {
      model,
      system: systemPrompt,
      prompt: userPrompt,
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: true,
        recordOutputs: true,
      },
    });

    const text = result.text ?? "";

    await publish(
      anthropicChannel().status({
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
      anthropicChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw error;
  }
};
