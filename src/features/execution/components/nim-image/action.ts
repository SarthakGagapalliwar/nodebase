"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { nimImageChannel } from "@/inngest/channels/nim-image";

export type NimImageToken = Realtime.Token<typeof nimImageChannel, ["status"]>;

export async function nimImageRealtimeToken(): Promise<NimImageToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: nimImageChannel(),
    topics: ["status"],
  });
  return token;
}
