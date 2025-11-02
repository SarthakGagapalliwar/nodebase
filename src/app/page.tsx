import { requireAuth } from "@/lib/auth-utils";
import { caller } from "@/trpc/server";
import { LogoutButton } from "./logout";


const page= async () => {

  await requireAuth();

  const data = await caller.getUsers();
  return (
    <div className="min-h-screen min-w-screen flex flex-col items-center justify-center gap-y-6">
     Protected server component
     {JSON.stringify(data,null,2)}
     <LogoutButton/>
    </div>
  );
};

export default page;
