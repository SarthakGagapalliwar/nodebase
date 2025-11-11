import { prefetch, trpc } from "@/trpc/server";
import type {inferInput} from "@trpc/tanstack-react-query"


type Input = inferInput<typeof trpc.Workflow.getMany>;


/*
PreFectch all workflows
*/

export const prefetchWorkflows = (params :Input)=>{
    return prefetch(trpc.Workflow.getMany.queryOptions(params));
}