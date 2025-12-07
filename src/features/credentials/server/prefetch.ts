import { prefetch, trpc } from "@/trpc/server";
import type {inferInput} from "@trpc/tanstack-react-query"


type Input = inferInput<typeof trpc.credentials.getMany>;


/*
PreFectch all credentails
*/

export const prefetchCredentials = (params :Input)=>{
    return prefetch(trpc.credentials.getMany.queryOptions(params));
}

/*
PreFectch single credentail
*/

export const prefetchCredential = (id :string)=>{
    return prefetch(trpc.credentials.getOne.queryOptions({id}));
};

