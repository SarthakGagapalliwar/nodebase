import { Client } from "@/client";
import { getQueryClient, trpc } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";

const page = async () => {
  // const users =await prisma.user.findMany();  cheky ehy we use caller nre method use trcp

  // const users = await caller.getUsers(); //this is by server component

  // const trpc =useTRPC();
  // const {data : users} = useQuery(trpc.getUsers.queryOptions())  //this is by  client componet

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(trpc.getUsers.queryOptions());

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<p>loading...</p>}>
        <Client />
      </Suspense>
    </HydrationBoundary>
  );
};

export default page;
