import { NodeType } from "@prisma/client";
import { NodeExecutor } from "../types";
import { manualTriggerExecutor } from "@/features/triggers/components/manual-trigger/executor";
import { httpReqestExecutor } from "../components/http-request/executor";
import { googleFormTriggerExecutor } from "@/features/triggers/components/googl-form-trigger/executor";
import { StripeTriggerExecutor } from "@/features/triggers/components/stripe-trigger/executor";

export const executorRegistry : Record<NodeType, NodeExecutor> ={
    [NodeType.INITIAL]: manualTriggerExecutor,
    [NodeType.MANUAL_TRIGGER]: manualTriggerExecutor,
    [NodeType.HTTP_REQUEST]: httpReqestExecutor,
    [NodeType.GOOGLE_FORM_TRIGGER]:googleFormTriggerExecutor,
    [NodeType.STRIPE_TRIGGER]:StripeTriggerExecutor,
};

export const getExector = (type: NodeType): NodeExecutor =>{
    const execute = executorRegistry[type];
    if(!execute){
        throw new Error(`No execute found for node type: ${type}`);
    }
    return execute;
}
