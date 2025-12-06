import { InitialNode } from "@/components/inital-node";
import { HttpRequestNode } from "@/features/execution/components/http-request/node";
import { GoogleFormTrigger } from "@/features/triggers/components/googl-form-trigger/node";
import { ManualTriggerNode } from "@/features/triggers/components/manual-trigger/node";
import { StripeTriggerNode } from "@/features/triggers/components/stripe-trigger/node";
import { NodeType } from "@prisma/client";
import type { NodeTypes } from "@xyflow/react";

export const nodeComponents = {
    [NodeType.INITIAL]: InitialNode,
    [NodeType.HTTP_REQUEST]:HttpRequestNode,
    [NodeType.MANUAL_TRIGGER]:ManualTriggerNode,
    [NodeType.GOOGLE_FORM_TRIGGER]: GoogleFormTrigger,
    [NodeType.STRIPE_TRIGGER]: StripeTriggerNode,
} as const satisfies NodeTypes

export type RegisteredNodeType = keyof typeof nodeComponents;

