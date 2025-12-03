import type { NodeExecutor } from "@/features/execution/types";

type ManualTriggerData = Record<string, unknown>;

export const manualTriggerExecutor: NodeExecutor<ManualTriggerData> = async({
    nodeId,
    context,
    step,
})=>{
    //Todo :pubish  "loading" state for manual trigger ;

    const result = await step.run("manual-trigger", async () =>context);

    //Todo: Publish "success" state for manual trigger

    return result;

}