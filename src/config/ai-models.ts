// Model configuration for AI providers
export const ANTHROPIC_MODELS = [
  { id: "claude-4-5-opus-latest", name: "Claude 4.5 Opus" },
  { id: "claude-4-5-sonnet-latest", name: "Claude 4.5 Sonnet" },
  { id: "claude-4-5-haiku-latest", name: "Claude 4.5 Haiku" },
] as const;

export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
  { id: "gemini-3-pro-preview", name: "Gemini 3.0 Pro" },
] as const;

export const OPENAI_MODELS = [
  { id: "gpt-5.1-2025-11-13", name: "GPT 5.1" },
  { id: "gpt-5-pro-2025-10-06", name: "GPT 5 Pro" },
  { id: "gpt-5.1-codex-max", name: "GPT 5.1 Codex Max" },
  { id: "o3-pro-2025-06-10", name: "GPT o3 Pro" },
] as const;

// FLUX Image Generation Models
export const FLUX_MODELS = [
  {
    id: "flux-schnell",
    name: "FLUX.1-schnell",
    description: "Fast generation, 4 steps",
    url: "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell",
    envKey: "FLUX_SCHNELL_API",
    defaultSteps: 4,
    supportsCfgScale: false,
    supportsInputImage: false,
  },
  {
    id: "flux-dev",
    name: "FLUX.1-dev",
    description: "High quality, 50 steps",
    url: "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-dev",
    envKey: "FLUX_DEV_API",
    defaultSteps: 50,
    supportsCfgScale: true,
    supportsInputImage: false,
  },
  {
    id: "flux-kontext",
    name: "FLUX.1-Kontext-dev",
    description: "Image editing with context",
    url: "https://ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-kontext-dev",
    envKey: "FLUX_KONTEXT_API",
    defaultSteps: 30,
    supportsCfgScale: true,
    supportsInputImage: true,
  },
] as const;

export type FluxModelId = (typeof FLUX_MODELS)[number]["id"];

// Special credential ID for free tier
export const FREE_CREDENTIAL_ID = "__FREE_TRIAL__";
