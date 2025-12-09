import { channel, topic } from "@inngest/realtime";

export const NIM_IMAGE_CHANNEL_NAME = "nim-image-execution";

export const nimImageChannel = channel(NIM_IMAGE_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>()
);
