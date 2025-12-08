import { credentialRouter } from "@/features/credentials/server/routers";
import { createTRPCRouter } from "../init";
import { workflowsRouter } from "@/features/workflows/server/routers";
import { executionsRouter } from "@/features/execution/server/routers";

export const appRouter = createTRPCRouter({
  Workflow: workflowsRouter,
  credentials: credentialRouter,
  executions:executionsRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
