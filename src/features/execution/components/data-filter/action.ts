"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { dataFilterChannel } from "@/inngest/channels/data-filter";

export type DataFilterToken = Realtime.Token<
  typeof dataFilterChannel,
  ["status"]
>;

export async function dataFilterRealtimeToken(): Promise<DataFilterToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: dataFilterChannel(),
    topics: ["status"],
  });
  return token;
}
