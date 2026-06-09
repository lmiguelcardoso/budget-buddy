import OpenAI from "openai";

export const CHAT_MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export function createOpenAIClient(apiKey: string): OpenAI {
  return new OpenAI({ apiKey });
}
