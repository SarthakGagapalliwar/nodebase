"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { GoogleSheetsDialog, GoogleSheetsFormValues } from "./dialog";
import { UseNodeStatus } from "../../hooks/use-node-status";
import { GOOGLE_SHEETS_CHANNEL_NAME } from "@/inngest/channels/google-sheets";
import { googleSheetsRealtimeToken } from "./action";

type GoogleSheetsNodeData = {
  variableName?: string;
  credentialId?: string;
  spreadsheetId?: string;
  sheetName?: string;
  range?: string;
  operation?: "read" | "append" | "write";
  data?: string;
};

type GoogleSheetsNodeType = Node<GoogleSheetsNodeData>;

export const GoogleSheetsNode = memo(
  (props: NodeProps<GoogleSheetsNodeType>) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const { setNodes } = useReactFlow();

    const handleSubmit = (values: GoogleSheetsFormValues) => {
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
      channel: GOOGLE_SHEETS_CHANNEL_NAME,
      topic: "status",
      refreshToken: googleSheetsRealtimeToken,
    });

    const handleOpenSetting = () => setDialogOpen(true);

    const nodeData = props.data;
    const operationLabel =
      nodeData?.operation === "read"
        ? "Read"
        : nodeData?.operation === "append"
        ? "Append"
        : nodeData?.operation === "write"
        ? "Write"
        : "Not configured";

    const description = nodeData?.spreadsheetId
      ? `${operationLabel}: ${nodeData.sheetName || "Sheet1"}`
      : "Not configured";

    return (
      <>
        <GoogleSheetsDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmit}
          defaultValues={nodeData}
        />
        <BaseExecutionNode
          {...props}
          id={props.id}
          icon="/logos/google-sheets.svg"
          name="Google Sheets"
          status={nodeStatus}
          description={description}
          onSettings={handleOpenSetting}
          onDoubleClick={handleOpenSetting}
        />
      </>
    );
  }
);

GoogleSheetsNode.displayName = "GoogleSheetsNode";
