import { ExecutionView } from "@/features/execution/components/execution";
import {
  ExecutionsError,
  ExecutionsLoading,
} from "@/features/execution/components/executions";
import { prefetchExecution } from "@/features/execution/server/prefetch";
import { requireAuth } from "@/lib/auth-utils";
import { HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface PageProps {
  params: Promise<{
    executionId: string;
  }>;
}

//http://localhost:3000/executions/1223

const Page = async ({ params }: PageProps) => {
  await requireAuth();
  const { executionId } = await params;
  await prefetchExecution(executionId);
  return (
    <div className="p-4 md-px-10 md:py-6 h-full">
      <div className="mx-auto max-w-screen-md w-full flex flex-col gap-y-8 h-full">
        <HydrateClient>
          <ErrorBoundary fallback={<ExecutionsError />}>
            <Suspense fallback={<ExecutionsLoading />}>
              <ExecutionView executionId={executionId} />
            </Suspense>
          </ErrorBoundary>
        </HydrateClient>
      </div>
    </div>
  );
};
export default Page;
