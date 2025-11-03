import { requireAuth } from "@/lib/auth-utils";


const Page = async()=>{
    await requireAuth();
    return (
       <p>Exections</p> 
    );
}
export default Page;