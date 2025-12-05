import { NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { GoogleFormTriggerDialog } from "./dialog";
import { UseNodeStatus } from "@/features/execution/hooks/use-node-status";
import { GOOGLE_FROM_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/google-from-trigger";
import { fetchGoogleFormTriggerRealtimeToekn } from "./action";

export const GoogleFormTrigger = memo((props : NodeProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);

     const nodeStatus = UseNodeStatus({
            nodeId:props.id,
            channel: GOOGLE_FROM_TRIGGER_CHANNEL_NAME,
            topic :"status",
            refreshToken: fetchGoogleFormTriggerRealtimeToekn,
          });
    const handleOpenSetting = () => setDialogOpen(true);

    return(
        <>
        <GoogleFormTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen}/>
        <BaseTriggerNode
        {...props}
        icon = "/logos/googleform.svg"
        name="Google Form"
        description="When form is submitted"
        status={nodeStatus}
        onSettings={handleOpenSetting}
        onDoubleClick={handleOpenSetting}
        >
        </BaseTriggerNode>
        </>
    )
});