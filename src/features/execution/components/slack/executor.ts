import Handlebars from "handlebars";
import type { NodeExecutor } from "@/features/execution/types";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import { slackChannel } from "@/inngest/channels/slack";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const SafeString = new Handlebars.SafeString(jsonString);

  return SafeString;
});

// Helper to extract base64 image from context using Handlebars syntax like {{myImage.imageBase64}}
function extractBase64Image(
  content: string,
  context: Record<string, unknown>
): string | null {
  const imageBase64Regex = /\{\{(\w+)\.imageBase64\}\}/;
  const match = content.match(imageBase64Regex);
  if (match) {
    const varName = match[1];
    const varData = context[varName] as { imageBase64?: string } | undefined;
    if (varData?.imageBase64) {
      return varData.imageBase64;
    }
  }
  return null;
}

type SlackData = {
  variableName?: string;
  webhookUrl?: string;
  content?: string;
};

export const slackExecutor: NodeExecutor<SlackData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    slackChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.content) {
    await publish(
      slackChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Slack node: Message content is missing");
  }

  const contentTemplate = Handlebars.compile(data.content);
  const rawContent = contentTemplate(context);
  const content = decode(rawContent);

  // Check if there's a base64 image or image URL to send
  const imageBase64 = extractBase64Image(
    data.content,
    context as Record<string, unknown>
  );

  // Also check for imageUrl from NIM Image node
  const imageUrlMatch = data.content.match(/\{\{(\w+)\.imageUrl\}\}/);
  let imageUrl: string | null = null;
  if (imageUrlMatch) {
    const varName = imageUrlMatch[1];
    const varData = context[varName] as { imageUrl?: string } | undefined;
    if (varData?.imageUrl) {
      imageUrl = varData.imageUrl;
    }
  }

  try {
    const result = await step.run("slack-webhook", async () => {
      if (!data.webhookUrl) {
        await publish(
          slackChannel().status({
            nodeId,
            status: "error",
          })
        );
        throw new NonRetriableError("Slack node: webhookUrl is missing");
      }

      // Clean content by removing image template references
      let textContent = content
        .replace(/\{\{\w+\.imageBase64\}\}/g, "")
        .replace(/\{\{\w+\.imageUrl\}\}/g, "")
        .trim();

      // Build Slack payload with blocks for better formatting
      type SlackBlock =
        | { type: "section"; text: { type: "mrkdwn"; text: string } }
        | {
            type: "image";
            image_url: string;
            alt_text: string;
          };

      const blocks: SlackBlock[] = [];

      // Add text block if there's content
      if (textContent) {
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: textContent,
          },
        });
      }

      // If we have an image URL, add it as an image block
      if (imageUrl) {
        blocks.push({
          type: "image",
          image_url: imageUrl,
          alt_text: "Generated image",
        });
      } else if (imageBase64) {
        // Slack webhooks don't support base64 images directly
        // Add a note that an image was generated
        blocks.push({
          type: "section",
          text: {
            type: "mrkdwn",
            text: "_🖼️ An image was generated (base64 format - view in execution details)_",
          },
        });
      }

      const payload: { text: string; blocks?: SlackBlock[] } = {
        text: textContent || "Image generated",
      };

      if (blocks.length > 0) {
        payload.blocks = blocks;
      }

      const response = await fetch(data.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new NonRetriableError(
          `Slack webhook failed with status ${response.status}: ${errBody}`
        );
      }

      if (!data.variableName) {
        await publish(
          slackChannel().status({
            nodeId,
            status: "error",
          })
        );
        throw new NonRetriableError("Slack node: variable name is missing");
      }

      return {
        ...context,
        [data.variableName]: {
          messageContent: textContent,
          imageAttached: !!imageUrl,
          imageBase64Included: !!imageBase64,
        },
      };
    });

    await publish(
      slackChannel().status({
        nodeId,
        status: "success",
      })
    );
    return result;
  } catch (error) {
    await publish(
      slackChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw error;
  }
};
