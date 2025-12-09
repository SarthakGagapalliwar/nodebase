"use server";

import { inngest } from "@/inngest/client";
import { NIM_IMAGE_CHANNEL_NAME } from "@/inngest/channels/nim-image";

export const nimImageRealtimeToken = async () => {
  const token = await inngest.realtimeToken([NIM_IMAGE_CHANNEL_NAME]);
  return token;
};
