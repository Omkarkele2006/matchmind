import { graniteChat, extractJsonBlock } from "./granite";

import {
  SYSTEM_PROMPTS,
  buildMisconceptionClassifierUserPrompt,
} from "./prompts";

import { misconceptionClassifierResponseSchema } from "./schemas";

import type { MisconceptionClassifierResponse } from "./types";

export async function detectMisconception(
  question: string
): Promise<MisconceptionClassifierResponse> {
  const response = await graniteChat(
    [
      {
        role: "system",
        content:
          SYSTEM_PROMPTS.misconceptionClassifier,
      },
      {
        role: "user",
        content:
          buildMisconceptionClassifierUserPrompt(
            question
          ),
      },
    ],
    {
      temperature: 0.1,
      maxTokens: 300,
    }
  );

  const jsonText = extractJsonBlock(
    response.text
  );

  const parsed = JSON.parse(
    jsonText
  ) as unknown;

  return misconceptionClassifierResponseSchema.parse(
    parsed
  );
}