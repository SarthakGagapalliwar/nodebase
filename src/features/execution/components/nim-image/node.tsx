"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { NimImageDialog } from "./dialog";
import { UseNodeStatus } from "../../hooks/use-node-status";
import { NIM_IMAGE_CHANNEL_NAME } from "@/inngest/channels/nim-image";
import { nimImageRealtimeToken } from "./action";

type NimImageNodeData = {
  variableName?: string;
  prompt?: string;
  width?: number;
  height?: number;
  cfgScale?: number;
  steps?: number;
  seed?: number;
};

type NimImageNodeType = Node<NimImageNodeData>;

export const NimImageNode = memo((props: NodeProps<NimImageNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { setNodes } = useReactFlow();

  const handleSubmit = (values: {
    variableName: string;
    prompt: string;
    width: number;
    height: number;
    cfgScale?: number;
    steps?: number;
    seed?: number;
  }) => {
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
    channel: NIM_IMAGE_CHANNEL_NAME,
    topic: "status",
    refreshToken: nimImageRealtimeToken,
  });

  const handleOpenSetting = () => setDialogOpen(true);

  const nodeData = props.data;
  const description = nodeData?.prompt
    ? `Prompt: ${nodeData.prompt.slice(0, 50)}...`
    : "Not configured";

  return (
    <>
      <NimImageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defalutValues={nodeData}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/logos/nim.svg"
        name="NIM Image"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSetting}
        onDoubleClick={handleOpenSetting}
      />
    </>
  );
});

NimImageNode.displayName = "NimImageNode";
