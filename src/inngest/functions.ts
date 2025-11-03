import prisma from "@/lib/db";
import { inngest } from "./client";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createMistral } from "@ai-sdk/mistral";
import * as Sentry from "@sentry/nextjs";

const google = createGoogleGenerativeAI();
const mistral = createMistral();
const openai = createOpenAI();

export const execute = inngest.createFunction(
  { id: "execute-ai" },
  { event: "execute/ai" },
  async ({ event, step }) => {
    await step.sleep("pretent", "5s");

    
Sentry.logger.info('User triggered test log', { log_source: 'sentry_test' })
    console.warn("Something is missing");
    console.error("this is an error i want to track");
    

    const { steps: geminiSteps } = await step.ai.wrap(
      "gemini-generate-text",
      generateText,
      {
        model: google("gemini-2.5-flash"),
        system: "You are a helpful assistant",
        prompt: "what is 2+2?",
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      }
    );

    const { steps: mistralSteps } = await step.ai.wrap(
      "mistral-generate-text",
      generateText,
      {
        model: mistral("codestral-latest"),
        system: "You are a helpful assistant",
        prompt: "what is 2+2?",
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      }
    );
    const { steps: openaiSteps } = await step.ai.wrap(
      "openai-generate-text",
      generateText,
      {
        model: openai("gpt-4o-mini"),
        system: "You are a helpful assistant",
        prompt: "what is 2+2?",
        experimental_telemetry: {
          isEnabled: true,
          recordInputs: true,
          recordOutputs: true,
        },
      }
    );

    return {
      geminiSteps,
      openaiSteps,
      mistralSteps,
    };
  }
);
