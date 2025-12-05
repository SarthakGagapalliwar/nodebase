import { NodeProps } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseTriggerNode } from "../base-trigger-node";
import { MousePointerIcon } from "lucide-react";
import { ManualTriggerDialog } from "./dialog";
import { UseNodeStatus } from "@/features/execution/hooks/use-node-status";
import { MANUAL_TRIGGER_CHANNEL_NAME } from "@/inngest/channels/manual-trigger";
import { fetchManualTriggerRealtimeToekn } from "./action";

export const ManualTriggerNode = memo((props : NodeProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const nodeStatus = UseNodeStatus({
        nodeId:props.id,
        channel: MANUAL_TRIGGER_CHANNEL_NAME,
        topic :"status",
        refreshToken: fetchManualTriggerRealtimeToekn,
      });

    const handleOpenSetting = () => setDialogOpen(true);

    return(
        <>
        <ManualTriggerDialog open={dialogOpen} onOpenChange={setDialogOpen}/>
        <BaseTriggerNode
        {...props}
        icon = {MousePointerIcon}
        name="When clicking 'Execution workflow'"
        status={nodeStatus}
        onSettings={handleOpenSetting}
        onDoubleClick={handleOpenSetting}
        >
        </BaseTriggerNode>
        </>
    )
});