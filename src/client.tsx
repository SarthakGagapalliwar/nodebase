"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "./trpc/client";
import { Suspense } from "react";

export const Client = ()=>{
    const trpc=useTRPC()
    const {data:users} = useSuspenseQuery(trpc.getUsers.queryOptions())
    return(
        <div>
            Client component:{JSON.stringify(users)}
        </div>
    )
}