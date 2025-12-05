import type { NodeExecutor } from "@/features/execution/types";
import { googleFormTriggerChannel } from "@/inngest/channels/google-from-trigger"; 

type GoogleFormTriggerData = Record<string, unknown>;

export const googleFormTriggerExecutor: NodeExecutor<GoogleFormTriggerData> = async({
    nodeId,
    context,
    step,
    publish
})=>{
    await publish(
        googleFormTriggerChannel().status({
            nodeId,
            status: "loading",
        })
    )

    const result = await step.run("google-from-trigger", async () =>context);

    await publish(
        googleFormTriggerChannel().status({
            nodeId,
            status: "success",
        })
    )

    return result;

}