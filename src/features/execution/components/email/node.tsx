"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { EmailDialog, EmailFormValues } from "./dialog";
import { UseNodeStatus } from "../../hooks/use-node-status";
import { EMAIL_CHANNEL_NAME } from "@/inngest/channels/email";
import { emailRealtimeToken } from "./action";

type EmailNodeData = {
  variableName?: string;
  credentialId?: string;
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
  isHtml?: boolean;
};

type EmailNodeType = Node<EmailNodeData>;

export const EmailNode = memo((props: NodeProps<EmailNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { setNodes } = useReactFlow();

  const handleSubmit = (values: EmailFormValues) => {
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
    channel: EMAIL_CHANNEL_NAME,
    topic: "status",
    refreshToken: emailRealtimeToken,
  });

  const handleOpenSetting = () => setDialogOpen(true);

  const nodeData = props.data;
  const description = nodeData?.to
    ? `To: ${nodeData.to.slice(0, 30)}${nodeData.to.length > 30 ? "..." : ""}`
    : "Not configured";

  return (
    <>
      <EmailDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon="/logos/resend.svg"
        name="Email"
        status={nodeStatus}
        description={description}
        onSettings={handleOpenSetting}
        onDoubleClick={handleOpenSetting}
      />
    </>
  );
});

EmailNode.displayName = "EmailNode";
