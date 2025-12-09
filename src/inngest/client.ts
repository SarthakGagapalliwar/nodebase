import { Inngest } from "inngest";
import { realtimeMiddleware } from "@inngest/realtime/middleware";

const eventKey = process.env.INNGEST_EVENT_KEY;

if (!eventKey) {
  throw new Error(
    "INNGEST_EVENT_KEY is missing. Set it in your environment before sending events."
  );
}

// Create a client to send and receive events
export const inngest = new Inngest({
  id: "nodebase",
  eventKey,
  middleware: [realtimeMiddleware()],
});
