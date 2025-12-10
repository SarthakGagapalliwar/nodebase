import Handlebars from "handlebars";
import type { NodeExecutor } from "@/features/execution/types";
import { NonRetriableError } from "inngest";
import { nimImageChannel } from "@/inngest/channels/nim-image";
import { FLUX_MODELS, type FluxModelId } from "@/config/ai-models";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const SafeString = new Handlebars.SafeString(jsonString);
  return SafeString;
});

type NimImageData = {
  variableName?: string;
  model?: FluxModelId;
  prompt?: string;
  width?: number;
  height?: number;
  aspectRatio?: string;
  inputImage?: string;
  cfgScale?: number;
  steps?: number;
  seed?: number;
};

// Get API key for the selected model
function getApiKey(model: FluxModelId): string | undefined {
  const modelConfig = FLUX_MODELS.find((m) => m.id === model);
  if (!modelConfig) return undefined;

  const envKey = modelConfig.envKey;
  return process.env[envKey];
}

export const nimImageExecutor: NodeExecutor<NimImageData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    nimImageChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.variableName) {
    await publish(
      nimImageChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("NIM Image node: variable name is missing");
  }

  if (!data.prompt) {
    await publish(
      nimImageChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("NIM Image node: prompt is missing");
  }

  const selectedModel = data.model || "flux-dev";
  const modelConfig = FLUX_MODELS.find((m) => m.id === selectedModel);

  if (!modelConfig) {
    await publish(
      nimImageChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError(
      `NIM Image node: unknown model ${selectedModel}`
    );
  }

  const apiKey = getApiKey(selectedModel);

  if (!apiKey) {
    await publish(
      nimImageChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError(
      `NIM Image node: missing API key for ${modelConfig.name}. Set ${modelConfig.envKey} environment variable.`
    );
  }

  // Process prompt with Handlebars template
  const processedPrompt = Handlebars.compile(data.prompt)(context);

  // Process input image for Kontext model
  let processedInputImage: string | undefined;
  if (modelConfig.supportsInputImage && data.inputImage) {
    processedInputImage = Handlebars.compile(data.inputImage)(context);
    // Ensure it's a proper data URL format
    if (processedInputImage && !processedInputImage.startsWith("data:")) {
      processedInputImage = `data:image/png;base64,${processedInputImage}`;
    }
  }

  try {
    const result = await step.run("nim-image-generate", async () => {
      // Build payload based on model type
      let payload: Record<string, unknown>;

      if (selectedModel === "flux-schnell") {
        // FLUX.1-schnell payload (no cfg_scale, no mode)
        payload = {
          prompt: processedPrompt,
          width: data.width ?? 1024,
          height: data.height ?? 1024,
          seed: data.seed ?? 0,
          steps: data.steps ?? modelConfig.defaultSteps,
        };
      } else if (selectedModel === "flux-kontext") {
        // FLUX.1-Kontext-dev payload (requires input image, uses aspect_ratio)
        if (!processedInputImage) {
          throw new NonRetriableError(
            "NIM Image node: Kontext model requires an input image"
          );
        }
        payload = {
          prompt: processedPrompt,
          image: processedInputImage,
          aspect_ratio: data.aspectRatio ?? "match_input_image",
          steps: data.steps ?? modelConfig.defaultSteps,
          cfg_scale: data.cfgScale ?? 3.5,
          seed: data.seed ?? 0,
        };
      } else {
        // FLUX.1-dev payload (default)
        payload = {
          prompt: processedPrompt,
          mode: "base",
          cfg_scale: data.cfgScale ?? 3.5,
          width: data.width ?? 1024,
          height: data.height ?? 1024,
          seed: data.seed ?? 0,
          steps: data.steps ?? modelConfig.defaultSteps,
        };
      }

      const response = await fetch(modelConfig.url, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
      });

      if (response.status !== 200) {
        const errBody = await response.text();
        throw new NonRetriableError(
          `NIM Image API (${modelConfig.name}) failed with status ${response.status}: ${errBody}`
        );
      }

      const responseBody = (await response.json()) as {
        image?: { url?: string };
        artifacts?: Array<{ base64?: string }>;
      };

      // Extract image URL or base64 from response
      const imageUrl = responseBody.image?.url;
      const imageBase64 = responseBody.artifacts?.[0]?.base64;

      return {
        imageUrl,
        imageBase64,
        prompt: processedPrompt,
        model: selectedModel,
        width: data.width ?? 1024,
        height: data.height ?? 1024,
      };
    });

    await publish(
      nimImageChannel().status({
        nodeId,
        status: "success",
      })
    );

    return {
      ...context,
      [data.variableName]: result,
    };
  } catch (error) {
    await publish(
      nimImageChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw error;
  }
};
