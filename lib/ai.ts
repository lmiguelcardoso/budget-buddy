import { generateText, type LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";

export type AiProvider = "OPENAI" | "GEMINI" | "ANTHROPIC";

const DEFAULT_MODELS: Record<AiProvider, string> = {
  OPENAI: "gpt-4o-mini",
  GEMINI: "gemini-2.0-flash",
  ANTHROPIC: "claude-3-5-haiku-20241022",
};

export function getModel(provider: AiProvider, apiKey: string): LanguageModel {
  const model = DEFAULT_MODELS[provider];
  if (provider === "OPENAI")    return createOpenAI({ apiKey })(model);
  if (provider === "GEMINI")    return createGoogleGenerativeAI({ apiKey })(model);
  return createAnthropic({ apiKey })(model);
}

export { generateText };
