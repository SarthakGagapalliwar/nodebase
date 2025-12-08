import Handlebars from "handlebars";
import type { NodeExecutor } from "@/features/execution/types";
import { NonRetriableError } from "inngest";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { openAiChannel } from "@/inngest/channels/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { FREE_CREDENTIAL_ID } from "@/config/ai-models";
import prisma from "@/lib/db";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const SafeString = new Handlebars.SafeString(jsonString);
  return SafeString;
});

type OpenAiData = {
  variableName?: string;
  credentialId?: string;
  model?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

export const OpenAiExecutor: NodeExecutor<OpenAiData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
}) => {
  await publish(
    openAiChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.variableName) {
    await publish(
      openAiChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("OpenAI node: variable name is missing");
  }

  if (!data.credentialId) {
    await publish(
      openAiChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("OpenAI node: credential is missing");
  }

  if (!data.userPrompt) {
    await publish(
      openAiChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("OpenAI node: user prompt is missing");
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
          openAiChannel().status({
            nodeId,
            status: "error",
          })
        );
        throw new NonRetriableError(
          "OpenAI node: missing NIM_API_KEY for free tier"
        );
      }

      const nim = createOpenAICompatible({
        name: "nim",
        baseURL: "https://integrate.api.nvidia.com/v1",
        headers: {
          Authorization: `Bearer ${nimApiKey}`,
        },
      });

      model = nim.chatModel('deepseek-ai/deepseek-v3.1-terminus');
    } else {
      // Fetch user's credential and use OpenAI
      const credential = await step.run("get-credential", () => {
        return prisma.credential.findUniqueOrThrow({
          where: { id: data.credentialId, userId },
        });
      });

      if (!credential) {
        throw new NonRetriableError("OpenAI node: credential not found");
      }

      const openai = createOpenAI({
        apiKey: credential.value,
      });

      model = openai(data.model || "gpt-4o");
    }

    const result = await step.ai.wrap("openai-generate-text", generateText, {
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
      openAiChannel().status({
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
      openAiChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw error;
  }
};
