import { channel, topic } from "@inngest/realtime";

export const DATA_FILTER_CHANNEL_NAME = "data-filter-execution";

export const dataFilterChannel = channel(DATA_FILTER_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>()
);
