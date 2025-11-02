"use client"

import { requireAuth } from "@/lib/auth-utils";
import { caller } from "@/trpc/server";
import { LogoutButton } from "./logout";
import { useTRPC } from "@/trpc/client";
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";


const page = () => {

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const {data} = useQuery(trpc.getWorkflows.queryOptions())
  const create =useMutation(trpc.createWorkflow.mutationOptions({
    onSuccess:()=>{
     toast.success("Job queued");
    }
  }))

  return (
    <div className="min-h-screen min-w-screen flex flex-col items-center justify-center gap-y-6">
     Protected server component
     <div>
     {JSON.stringify(data,null,2)}
     </div>

     <Button disabled={create.isPending} onClick={()=>create.mutate()}>
      Create workflow
     </Button>

     <LogoutButton/>
    </div>
  );
};

export default page;
