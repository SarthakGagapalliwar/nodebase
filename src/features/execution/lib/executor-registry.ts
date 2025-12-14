import { NodeType } from "@prisma/client";
import { NodeExecutor } from "../types";
import { manualTriggerExecutor } from "@/features/triggers/components/manual-trigger/executor";
import { httpReqestExecutor } from "../components/http-request/executor";
import { googleFormTriggerExecutor } from "@/features/triggers/components/googl-form-trigger/executor";
import { StripeTriggerExecutor } from "@/features/triggers/components/stripe-trigger/executor";
import { geminiExecutor } from "../components/gemini/executor";
import { OpenAiExecutor } from "@/features/execution/components/openai/executor";
import { anthropicExecutor } from "@/features/execution/components/anthropic/executor";
import { autonomeExecutor } from "@/features/execution/components/autonome/executor";
import { nimImageExecutor } from "@/features/execution/components/nim-image/executor";
import { discordExecutor } from "../components/discord/executor";
import { slackExecutor } from "../components/slack/executor";
import { whatsappExecutor } from "../components/whatsapp/executor";
import { googleSheetsExecutor } from "../components/google-sheets/executor";
import { emailExecutor } from "../components/email/executor";
import { dataFilterExecutor } from "../components/data-filter/executor";

export const executorRegistry: Record<NodeType, NodeExecutor> = {
  [NodeType.INITIAL]: manualTriggerExecutor,
  [NodeType.MANUAL_TRIGGER]: manualTriggerExecutor,
  [NodeType.HTTP_REQUEST]: httpReqestExecutor,
  [NodeType.GOOGLE_FORM_TRIGGER]: googleFormTriggerExecutor,
  [NodeType.STRIPE_TRIGGER]: StripeTriggerExecutor,
  [NodeType.GEMINI]: geminiExecutor,
  [NodeType.ANTHROPIC]: anthropicExecutor,
  [NodeType.OPENAI]: OpenAiExecutor,
  [NodeType.NIM]: geminiExecutor,
  [NodeType.NIM_IMAGE]: nimImageExecutor,
  [NodeType.AUTONOME]: autonomeExecutor,
  [NodeType.DISCORD]: discordExecutor,
  [NodeType.SLACK]: slackExecutor,
  [NodeType.WHATSAPP]: whatsappExecutor,
  [NodeType.GOOGLE_SHEETS]: googleSheetsExecutor,
  [NodeType.EMAIL]: emailExecutor,
  [NodeType.DATA_FILTER]: dataFilterExecutor,
};

export const getExector = (type: NodeType): NodeExecutor => {
  const execute = executorRegistry[type];
  if (!execute) {
    throw new Error(`No execute found for node type: ${type}`);
  }
  return execute;
};
