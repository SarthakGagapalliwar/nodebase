"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { AutonomeDialog, AutonomeFormValues } from "./dialog";
import { UseNodeStatus } from "../../hooks/use-node-status";
import { AUTONOME_CHANNEL_NAME } from "@/inngest/channels/autonome";
import { fetchAutonomeRealtimeToken } from "./action";

type AutonomeNodeData = {
  variableName?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

type AutonomeNodeType = Node<AutonomeNodeData>;

export const AutonomeNode = memo((props: NodeProps<AutonomeNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { setNodes } = useReactFlow();

  const handleSubmit = (values: AutonomeFormValues) => {
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
    channel: AUTONOME_CHANNEL_NAME,
    topic: "status",
    refreshToken: fetchAutonomeRealtimeToken,
  });

  const handleOpenSetting = () => setDialogOpen(true);

  const nodeData = props.data;
  const description = nodeData?.userPrompt
    ? `Prompt: ${nodeData.userPrompt.slice(0, 50)}${
        nodeData.userPrompt.length > 50 ? "..." : ""
      }`
    : "Not configured";

  return (
    <>
      <AutonomeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defalutValues={nodeData}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/logos/autonome.png"
        name="Autonome"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSetting}
        onDoubleClick={handleOpenSetting}
      />
    </>
  );
});

AutonomeNode.displayName = "AutonomeNode";
