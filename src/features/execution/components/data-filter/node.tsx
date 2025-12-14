"use client";

import { Node, NodeProps, useReactFlow } from "@xyflow/react";
import { memo, useState } from "react";
import { BaseExecutionNode } from "../base-execution-node";
import { DataFilterDialog, DataFilterFormValues } from "./dialog";
import { UseNodeStatus } from "../../hooks/use-node-status";
import { DATA_FILTER_CHANNEL_NAME } from "@/inngest/channels/data-filter";
import { dataFilterRealtimeToken } from "./action";
import { FilterIcon } from "lucide-react";

type DataFilterNodeData = {
  variableName?: string;
  sourceVariable?: string;
  filterType?:
    | "top_percent"
    | "top_n"
    | "bottom_percent"
    | "bottom_n"
    | "condition";
  sortField?: string;
  sortOrder?: "asc" | "desc";
  value?: string;
  conditionField?: string;
  conditionOperator?:
    | "eq"
    | "neq"
    | "gt"
    | "gte"
    | "lt"
    | "lte"
    | "contains"
    | "starts_with"
    | "ends_with";
  conditionValue?: string;
};

type DataFilterNodeType = Node<DataFilterNodeData>;

export const DataFilterNode = memo((props: NodeProps<DataFilterNodeType>) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { setNodes } = useReactFlow();

  const handleSubmit = (values: DataFilterFormValues) => {
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
    channel: DATA_FILTER_CHANNEL_NAME,
    topic: "status",
    refreshToken: dataFilterRealtimeToken,
  });

  const handleOpenSetting = () => setDialogOpen(true);

  const nodeData = props.data;

  const getFilterLabel = () => {
    if (!nodeData?.filterType) return "Not configured";

    switch (nodeData.filterType) {
      case "top_percent":
        return `Top ${nodeData.value || 10}%`;
      case "top_n":
        return `Top ${nodeData.value || 5} items`;
      case "bottom_percent":
        return `Bottom ${nodeData.value || 10}%`;
      case "bottom_n":
        return `Bottom ${nodeData.value || 5} items`;
      case "condition":
        return `${nodeData.conditionField} ${nodeData.conditionOperator} ${nodeData.conditionValue}`;
      default:
        return "Not configured";
    }
  };

  return (
    <>
      <DataFilterDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
        defaultValues={nodeData}
      />
      <BaseExecutionNode
        {...props}
        id={props.id}
        icon={FilterIcon}
        name="Data Filter"
        status={nodeStatus}
        description={getFilterLabel()}
        onSettings={handleOpenSetting}
        onDoubleClick={handleOpenSetting}
      />
    </>
  );
});

DataFilterNode.displayName = "DataFilterNode";
