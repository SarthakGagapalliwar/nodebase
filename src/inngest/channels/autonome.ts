import { channel, topic } from "@inngest/realtime";

export const AUTONOME_CHANNEL_NAME = "autonome-execution";

export const autonomeChannel = channel(AUTONOME_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>()
);
