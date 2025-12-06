import { NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { StriperiggerDialog } from "./dialog";
import { UseNodeStatus } from "@/features/execution/hooks/use-node-status";
import { fetchStripeTriggerRealtimeToekn } from "./action";
import { STRIPE_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/sttripe-trigger";

export const StripeTriggerNode = memo((props : NodeProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);

     const nodeStatus = UseNodeStatus({
            nodeId:props.id,
            channel: STRIPE_TRIGGER_CHANNEL_NAME,
            topic :"status",
            refreshToken: fetchStripeTriggerRealtimeToekn,
          });
    const handleOpenSetting = () => setDialogOpen(true);

    return(
        <>
        <StriperiggerDialog open={dialogOpen} onOpenChange={setDialogOpen}/>
        <BaseTriggerNode
        {...props}
        icon = "/logos/stripe.svg"
        name="Stripe"
        description="When stripe event is captured"
        status={nodeStatus}
        onSettings={handleOpenSetting}
        onDoubleClick={handleOpenSetting}
        >
        </BaseTriggerNode>
        </>
    )
});