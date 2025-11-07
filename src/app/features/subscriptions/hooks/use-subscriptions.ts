import { authClient } from "@/lib/auth-client"
import { useQuery } from "@tanstack/react-query"


export const useSubscritions = () =>{
    return useQuery({
        queryKey:["subscription"],
        queryFn:async()=>{
            const {data} = await authClient.customer.state();
            return data;
        },
    });
};

export const useHashActiveSubscription = ()=>{
    const {data: customerState, isLoading, ...rest}=useSubscritions();


    const HashActiveSubscription = customerState?.activeSubscriptions && 
    customerState.activeSubscriptions.length > 0;

    return{
        HashActiveSubscription,
        subscription:customerState?.activeSubscriptions?.[0],
        isLoading,
        ...rest,
    }
}