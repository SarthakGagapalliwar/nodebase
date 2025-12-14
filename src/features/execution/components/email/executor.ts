import Handlebars from "handlebars";
import type { NodeExecutor } from "@/features/execution/types";
import { NonRetriableError } from "inngest";
import { emailChannel } from "@/inngest/channels/email";
import prisma from "@/lib/db";
import { decrypy } from "@/lib/encryption";
import { Resend } from "resend";

Handlebars.registerHelper("json", (context) => {
  const jsonString = JSON.stringify(context, null, 2);
  return new Handlebars.SafeString(jsonString);
});

type EmailData = {
  variableName?: string;
  credentialId?: string;
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
  isHtml?: boolean;
};

export const emailExecutor: NodeExecutor<EmailData> = async ({
  data,
  nodeId,
  userId,
  context,
  step,
  publish,
}) => {
  await publish(
    emailChannel().status({
      nodeId,
      status: "loading",
    })
  );

  if (!data.variableName) {
    await publish(
      emailChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Email node: variable name is missing");
  }

  if (!data.credentialId) {
    await publish(
      emailChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Email node: credential is missing");
  }

  if (!data.from) {
    await publish(
      emailChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Email node: from address is missing");
  }

  if (!data.to) {
    await publish(
      emailChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Email node: to address is missing");
  }

  if (!data.subject) {
    await publish(
      emailChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Email node: subject is missing");
  }

  if (!data.body) {
    await publish(
      emailChannel().status({
        nodeId,
        status: "error",
      })
    );
    throw new NonRetriableError("Email node: body is missing");
  }

  try {
    // Get credential from database
    const credential = await prisma.credential.findFirst({
      where: {
        id: data.credentialId,
        userId,
      },
    });

    if (!credential) {
      await publish(
        emailChannel().status({
          nodeId,
          status: "error",
        })
      );
      throw new NonRetriableError("Email node: credential not found");
    }

    // Decrypt API key
    const apiKey = decrypy(credential.value);
    const resend = new Resend(apiKey);

    // Process handlebars templates
    const from = Handlebars.compile(data.from)(context);
    const toTemplate = Handlebars.compile(data.to)(context);
    const subject = Handlebars.compile(data.subject)(context);
    const body = Handlebars.compile(data.body)(context);

    // Parse to addresses (comma-separated)
    const toAddresses = toTemplate.split(",").map((email) => email.trim());

    // Send email with proper content type
    const emailOptions = {
      from,
      to: toAddresses,
      subject,
      ...(data.isHtml ? { html: body } : { text: body }),
    };

    const response = await resend.emails.send(
      emailOptions as Parameters<typeof resend.emails.send>[0]
    );

    if (response.error) {
      await publish(
        emailChannel().status({
          nodeId,
          status: "error",
        })
      );
      throw new NonRetriableError(`Email node: ${response.error.message}`);
    }

    await publish(
      emailChannel().status({
        nodeId,
        status: "success",
      })
    );

    return {
      ...context,
      [data.variableName]: {
        id: response.data?.id,
        from,
        to: toAddresses,
        subject,
        sent: true,
      },
    };
  } catch (error) {
    await publish(
      emailChannel().status({
        nodeId,
        status: "error",
      })
    );
    if (error instanceof NonRetriableError) {
      throw error;
    }
    throw new NonRetriableError(
      `Email node: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};
