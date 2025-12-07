import Handlebars from "handlebars";
import type { NodeExecutor } from "@/features/execution/types";
import { NonRetriableError } from "inngest";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { geminiChannel } from "@/inngest/channels/gemini";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { FREE_CREDENTIAL_ID } from "@/config/ai-models";
import prisma from "@/lib/db";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const SafeString = new Handlebars.SafeString(jsonString);

  return SafeString;
});

type GeminiData = {
  variableName?: string;
  credentialId?: string;
  model?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

export const geminiExecutor: NodeExecutor<GeminiData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    geminiChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.variableName) {
    await publish(
      geminiChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Gemini node: variable name is missing");
  }

  if (!data.credentialId) {
    await publish(
      geminiChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Gemini node: credential is missing");
  }

  if (!data.userPrompt) {
    await publish(
      geminiChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Gemini node: user prompt is missing");
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
          geminiChannel().status({
            nodeId,
            status: "error",
          })
        );
        throw new NonRetriableError(
          "Gemini node: missing NIM_API_KEY for free tier"
        );
      }

      const nim = createOpenAICompatible({
        name: "nim",
        baseURL: "https://integrate.api.nvidia.com/v1",
        headers: {
          Authorization: `Bearer ${nimApiKey}`,
        },
      });

      model = nim.chatModel("qwen/qwen3-coder-480b-a35b-instruct");
    } else {
      // Fetch user's credential and use Google Gemini
      const credential = await step.run("get-credential", () => {
        return prisma.credential.findUniqueOrThrow({
          where: { id: data.credentialId },
        });
      });

      if (!credential) {
        throw new NonRetriableError("Gemini node: credential not found");
      }

      const google = createGoogleGenerativeAI({
        apiKey: credential.value,
      });

      model = google(data.model || "gemini-2.0-flash");
    }

    const { steps } = await step.ai.wrap("gemini-generate-text", generateText, {
      model,
      system: systemPrompt,
      prompt: userPrompt,
      experimental_telemetry: {
        isEnabled: true,
        recordInputs: true,
        recordOutputs: true,
      },
    });

    const text =
      steps[0]?.content[0]?.type === "text" ? steps[0].content[0].text : "";

    await publish(
      geminiChannel().status({
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
      geminiChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw error;
  }
};
