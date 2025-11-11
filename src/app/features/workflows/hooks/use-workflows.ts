/*
  Hook to fetch all workflows using React Query Suspense
*/

import { useTRPC } from "@/trpc/client";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const useSuspenseWorkflows = () => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.Workflow.getMany.queryOptions());
};

/*
hook to creatre a new workflow
*/

export const useCreateWorkflow = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.Workflow.create.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" created`);
        router.push(`/workflows/${data.id}`);
        queryClient.invalidateQueries(trpc.Workflow.getMany.queryOptions());
      },
      onError: (error) => {
        toast.error(`Failed to create workflow: ${error.message}`);
      },
    })
  );
};
