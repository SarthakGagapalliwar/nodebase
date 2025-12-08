import Handlebars from "handlebars";
import type { NodeExecutor } from "@/features/execution/types";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import ky from "ky";
import { whatsappChannel } from "@/inngest/channels/whatsapp";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  const SafeString = new Handlebars.SafeString(jsonString);

  return SafeString;
});

export type WhatsAppData = {
  variableName?: string;
  webhookUrl?: string;
  content?: string;
};

export const whatsappExecutor: NodeExecutor<WhatsAppData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(
    whatsappChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.content) {
    await publish(
      whatsappChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("WhatsApp node: Message content is missing");
  }

  const template = Handlebars.compile(data.content);
  const rawContent = template(context);
  const content = decode(rawContent);

  try {
    const result = await step.run("whatsapp-webhook", async () => {
      if (!data.webhookUrl) {
        await publish(
          whatsappChannel().status({
            nodeId,
            status: "error",
          })
        );
        throw new NonRetriableError("WhatsApp node: webhookUrl is missing");
      }

      await ky.post(data.webhookUrl, {
        json: {
          content: content.slice(0, 2000), // adjust payload keys to match your WhatsApp provider
        },
      });

      if (!data.variableName) {
        await publish(
          whatsappChannel().status({
            nodeId,
            status: "error",
          })
        );
        throw new NonRetriableError("WhatsApp node: variable name is missing");
      }

      return {
        ...context,
        [data.variableName]: {
          messageContent: content.slice(0, 2000),
        },
      };
    });

    await publish(
      whatsappChannel().status({
        nodeId,
        status: "success",
      })
    );

    return result;
  } catch (error) {
    await publish(
      whatsappChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw error;
  }
};
