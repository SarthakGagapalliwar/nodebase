"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { WhatsAppDialog, WhatsAppFormValues } from "./dialog";
import { UseNodeStatus } from "../../hooks/use-node-status";
import { fetchWhatsappRealtimeToken } from "./action";
import { WHATSAPP_CHANNEL_NAME } from "@/inngest/channels/whatsapp";

type WhatsAppNodeData = {
  webhookUrl?: string;
  content?: string;
};

type WhatsAppNodeType = Node<WhatsAppNodeData>;

export const WhatsAppNode = memo((props: NodeProps<WhatsAppNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { setNodes } = useReactFlow();

  const handleSubmit = (values: WhatsAppFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...values,
            },
          };
        }
        return node;
      })
    );
  };

  const nodeStatus = UseNodeStatus({
    nodeId: props.id,
    channel: WHATSAPP_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchWhatsappRealtimeToken,
  });

  const handleOpenSetting = () => setDialogOpen(true);

  const nodeData = props.data;
  const description = nodeData?.content
    ? `Send: ${nodeData.content.slice(0, 50)}...`
    : "Not configured";

  return (
    <>
      <WhatsAppDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defalutValues={nodeData}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/logos/whatsapp.svg"
        name="WhatsApp"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSetting}
        onDoubleClick={handleOpenSetting}
      />
    </>
  );
});

WhatsAppNode.displayName = "WhatsAppNode";
