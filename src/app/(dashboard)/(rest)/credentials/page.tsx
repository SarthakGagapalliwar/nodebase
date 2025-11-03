import { requireAuth } from "@/lib/auth-utils";


const Page = async()=>{
    await requireAuth();
    return (
       <p>Credentail</p> 
    );
}
export default Page;