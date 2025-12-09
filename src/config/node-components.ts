import { InitialNode } from "@/components/inital-node";
import { GeminiNode } from "@/features/execution/components/gemini/node";
import { HttpRequestNode } from "@/features/execution/components/http-request/node";
import { AnthropicNode } from "@/features/execution/components/anthropic/node";
import { OpenAiNode } from "@/features/execution/components/openai/node";
import { AutonomeNode } from "@/features/execution/components/autonome/node";
import { NimImageNode } from "@/features/execution/components/nim-image/node";
import { GoogleFormTrigger } from "@/features/triggers/components/googl-form-trigger/node";
import { ManualTriggerNode } from "@/features/triggers/components/manual-trigger/node";
import { StripeTriggerNode } from "@/features/triggers/components/stripe-trigger/node";
import { NodeType } from "@prisma/client";
import type { NodeTypes } from "@xyflow/react";
import { DiscordNode } from "@/features/execution/components/discord/node";
import { SlackNode } from "@/features/execution/components/slack/node";
import { WhatsAppNode } from "@/features/execution/components/whatsapp/node";

export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
  [NodeType.HTTP_REQUEST]: HttpRequestNode,
  [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
  [NodeType.GOOGLE_FORM_TRIGGER]: GoogleFormTrigger,
  [NodeType.STRIPE_TRIGGER]: StripeTriggerNode,
  [NodeType.ANTHROPIC]: AnthropicNode,
  [NodeType.GEMINI]: GeminiNode,
  [NodeType.OPENAI]: OpenAiNode,
  [NodeType.AUTONOME]: AutonomeNode,
  [NodeType.NIM_IMAGE]: NimImageNode,
  [NodeType.DISCORD]: DiscordNode,
  [NodeType.SLACK]: SlackNode,
  [NodeType.WHATSAPP]: WhatsAppNode,
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof nodeComponents;
