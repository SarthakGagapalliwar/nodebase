import Handlebars from "handlebars";
import type { NodeExecutor } from "@/features/execution/types";
import { NonRetriableError } from "inngest";
import { nimImageChannel } from "@/inngest/channels/nim-image";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const SafeString = new Handlebars.SafeString(jsonString);
  return SafeString;
});

type NimImageData = {
  variableName?: string;
  prompt?: string;
  width?: number;
  height?: number;
  cfgScale?: number;
  steps?: number;
  seed?: number;
};

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

  const nimImageApiKey = process.env.NIM_IMAGE_API_KEY;

  if (!nimImageApiKey) {
    await publish(
      nimImageChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("NIM Image node: missing NIM_API_KEY");
  }

  // Process prompt with Handlebars template
  const processedPrompt = Handlebars.compile(data.prompt)(context);

  try {
    const result = await step.run("nim-image-generate", async () => {
      const invokeUrl =
        "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev";

      const payload = {
        prompt: processedPrompt,
        mode: "base",
        cfg_scale: data.cfgScale ?? 3.5,
        width: data.width ?? 1024,
        height: data.height ?? 1024,
        seed: data.seed ?? 0,
        steps: data.steps ?? 50,
      };

      const response = await fetch(invokeUrl, {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${nimImageApiKey}`,
          Accept: "application/json",
        },
      });

      if (response.status !== 200) {
        const errBody = await response.text();
        throw new NonRetriableError(
          `NIM Image API failed with status ${response.status}: ${errBody}`
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
