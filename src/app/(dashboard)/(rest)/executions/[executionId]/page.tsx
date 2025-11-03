import { requireAuth } from "@/lib/auth-utils";

interface PageProps {
    params: Promise<{
        executionId:string
    }>
};


//http://localhost:3000/executions/1223

const Page = async ({params}:  PageProps)=>{
    await requireAuth();
    const {executionId}=await params;
    return (
       <p>execution id: {executionId}</p> 
    );
}
export default Page;