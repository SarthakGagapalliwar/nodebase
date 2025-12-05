"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { GlobeIcon } from "lucide-react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { HttpRequestFormValues, HttpRequestDialog } from "./dialog";
import { UseNodeStatus } from "../../hooks/use-node-status";
import { fetchHttpRequestRealtimeToekn } from "./action";
import { HTTP_REQUEST_CHANNEL_NAME } from "@/inngest/channels/http-request";

type HttpRequestNodeData = {
  variableName? :string;
  endpoint?: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: string;
};

type HttpRequestNodeType = Node<HttpRequestNodeData>;

export const HttpRequestNode = memo((props: NodeProps<HttpRequestNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { setNodes } = useReactFlow();

  const handleSubmit = (values: HttpRequestFormValues) => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === props.id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...values
            },
          };
        }
        return node;
      })
    );
  };

  const nodeStatus = UseNodeStatus({
    nodeId:props.id,
    channel: HTTP_REQUEST_CHANNEL_NAME,
    topic :"status",
    refreshToken: fetchHttpRequestRealtimeToekn,
  });

  const handleOpenSetting = () => setDialogOpen(true);

  const nodeData = props.data;
  const description = nodeData?.endpoint
    ? `${nodeData.method || "GET"} : ${nodeData.endpoint}`
    : "Not configured";

  return (
    <>
      <HttpRequestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defalutValues={nodeData}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={GlobeIcon}
        name="HTTP Request"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSetting}
        onDoubleClick={handleOpenSetting}
      />
    </>
  );
});

HttpRequestNode.displayName = "HttpRequestNode";
