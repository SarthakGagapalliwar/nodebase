"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { inngest } from "@/inngest/client";
import { autonomeChannel } from "@/inngest/channels/autonome";

export type AutonomeToken = Realtime.Token<typeof autonomeChannel, ["status"]>;

export async function fetchAutonomeRealtimeToken(): Promise<AutonomeToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: autonomeChannel(),
    topics: ["status"],
  });

  return token;
}
