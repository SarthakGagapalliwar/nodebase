import { requireAuth } from "@/lib/auth-utils";

interface PageProps {
    params: Promise<{
        workflowId:string
    }>
};

//http://localhost:3000/workflows/1223
const Page = async ({params}:  PageProps)=>{
    await requireAuth();
    const {workflowId}=await params;
    return (
       <p>workflow id: {workflowId}</p> 
    );
}
export default Page;