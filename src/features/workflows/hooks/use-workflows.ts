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
import { useWorkflowsParams } from "./use-workflows-params";

export const useSuspenseWorkflows = () => {
  const trpc = useTRPC();
  const [params] = useWorkflowsParams();
  return useSuspenseQuery(trpc.Workflow.getMany.queryOptions(params));
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
        queryClient.invalidateQueries(trpc.Workflow.getMany.queryOptions({}));
      },
      onError: (error) => {
        toast.error(`Failed to create workflow: ${error.message}`);
      },
    })
  );
};

/**
 * Hook to remove a workflow
 */

export const useRemoveWorkflow = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  return useMutation(
    trpc.Workflow.remove.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" remove`);
        queryClient.invalidateQueries(trpc.Workflow.getMany.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.Workflow.getOne.queryFilter({ id: data.id })
        );
      },
    })
  );
};

/**
 * Hook to fetch a single workflw using susupnse
 */

export const useSuspenseWorkflow = (id: string) => {
  const trpc = useTRPC();
  return useSuspenseQuery(trpc.Workflow.getOne.queryOptions({ id }));
};

/*
hook to a update workflow name
*/

export const useUpdateWorkflowName = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.Workflow.updateName.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" updated`);
        router.push(`/workflows/${data.id}`);
        queryClient.invalidateQueries(trpc.Workflow.getMany.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.Workflow.getOne.queryOptions({ id: data.id })
        );
      },
      onError: (error) => {
        toast.error(`Failed to update workflow: ${error.message}`);
      },
    })
  );
};

/*
hook to a update workflow 
*/

export const useUpdateWorkflow = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const trpc = useTRPC();

  return useMutation(
    trpc.Workflow.update.mutationOptions({
      onSuccess: (data) => {
        toast.success(`Workflow "${data.name}" saved`);
        queryClient.invalidateQueries(trpc.Workflow.getMany.queryOptions({}));
        queryClient.invalidateQueries(
          trpc.Workflow.getOne.queryOptions({ id: data.id })
        );
      },
      onError: (error) => {
        toast.error(`Failed to save workflow: ${error.message}`);
      },
    })
  );
};
