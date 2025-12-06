import {channel, topic} from "@inngest/realtime"

export const GEMNI_CHANNEL_NAME = "gemini-execution";

export const geminiChannel = channel(GEMNI_CHANNEL_NAME)
.addTopic(
    topic("status").type<{
        nodeId: string;
        status:"loading" | "success" | "error";
    }>(),
);