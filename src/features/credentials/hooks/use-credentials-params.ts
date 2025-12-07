import {useQueryStates} from "nuqs";
import { credentailsParams } from "../params";


export const useCredentialsParams = ()=>{
    return useQueryStates(credentailsParams);
};

