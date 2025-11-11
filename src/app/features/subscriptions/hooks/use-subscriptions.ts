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

export const useHasActiveSubscription = ()=>{
    const {data: customerState, isLoading, ...rest}=useSubscritions();


    const hasActiveSubscription = customerState?.activeSubscriptions && 
    customerState.activeSubscriptions.length > 0;

    return{
        hasActiveSubscription,
        subscription:customerState?.activeSubscriptions?.[0],
        isLoading,
        ...rest,
    }
}