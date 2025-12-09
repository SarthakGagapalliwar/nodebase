import Handlebars from "handlebars";
import type { NodeExecutor } from "@/features/execution/types";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import { discordChannel } from "@/inngest/channels/discord";

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

type DiscordData = {
  variableName?: string;
  webhookUrl?: string;
  content?: string;
  username?: string;
};

export const discordExecutor: NodeExecutor<DiscordData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    discordChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.content) {
    await publish(
      discordChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Discord node: Message content is missing");
  }

  const contentTemplate = Handlebars.compile(data.content);
  const rawContent = contentTemplate(context);
  const content = decode(rawContent);

  const username = data.username
    ? decode(Handlebars.compile(data.username)(context))
    : undefined;

  // Check if there's a base64 image to send
  const imageBase64 = extractBase64Image(
    data.content,
    context as Record<string, unknown>
  );

  try {
    const result = await step.run("discord-webhook", async () => {
      if (!data.webhookUrl) {
        await publish(
          discordChannel().status({
            nodeId,
            status: "error",
          })
        );
        throw new NonRetriableError("Discord node: webhookUrl is missing");
      }

      // If there's a base64 image, send it as a file attachment
      if (imageBase64) {
        // Remove the {{varName.imageBase64}} from the content since we're sending the image as attachment
        const textContent = content
          .replace(/\{\{\w+\.imageBase64\}\}/g, "")
          .trim();

        // Convert base64 to Buffer
        const imageBuffer = Buffer.from(imageBase64, "base64");

        // Create FormData for multipart upload
        const formData = new FormData();

        // Add the payload JSON
        const payload: { content?: string; username?: string } = {};
        if (textContent) {
          payload.content = textContent.slice(0, 2000);
        }
        if (username) {
          payload.username = username;
        }
        formData.append("payload_json", JSON.stringify(payload));

        // Add the image file
        const blob = new Blob([imageBuffer], { type: "image/png" });
        formData.append("files[0]", blob, "image.png");

        const response = await fetch(data.webhookUrl, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new NonRetriableError(
            `Discord webhook failed with status ${response.status}: ${errBody}`
          );
        }
      } else {
        // No image, send as regular JSON
        const response = await fetch(data.webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: content.slice(0, 2000),
            username,
          }),
        });

        if (!response.ok) {
          const errBody = await response.text();
          throw new NonRetriableError(
            `Discord webhook failed with status ${response.status}: ${errBody}`
          );
        }
      }

      if (!data.variableName) {
        await publish(
          discordChannel().status({
            nodeId,
            status: "error",
          })
        );
        throw new NonRetriableError("Discord node: variable name is missing");
      }

      return {
        ...context,
        [data.variableName]: {
          messageContent: content.slice(0, 2000),
          imageAttached: !!imageBase64,
        },
      };
    });

    await publish(
      discordChannel().status({
        nodeId,
        status: "success",
      })
    );
    return result;
  } catch (error) {
    await publish(
      discordChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw error;
  }
};
