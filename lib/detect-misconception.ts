/**
 * Misconception classifier service.
 * Pipes the user's question into Granite using structural classification prompts.
 */

import { graniteChat, extractJsonBlock } from "./granite";

import {
  SYSTEM_PROMPTS,
  buildMisconceptionClassifierUserPrompt,
} from "./prompts";

import { misconceptionClassifierResponseSchema } from "./schemas";

import type { MisconceptionClassifierResponse } from "./types";

// Classifies an input statement. Uses structured prompts and returns a validated payload.
// Wraps JSON parsing in a try/catch fallback to prevent LLM format anomalies from crashing the server.
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

  try {
    const jsonText = extractJsonBlock(
      response.text
    );

    const parsed = JSON.parse(
      jsonText
    ) as unknown;

    return misconceptionClassifierResponseSchema.parse(
      parsed
    );
  } catch (error) {
    // FALLBACK SAFETY: Watsonx completions can occasionally contain formatting anomalies.
    // Catching exceptions and returning a fallback "NONE" structure ensures the client UI
    // can render a neutral response gracefully rather than crashing with server error states.
    console.error("Failed to parse Granite response, falling back to NONE:", error);
    return {
      misconceptionDetected: false,
      misconceptionType: "NONE",
      confidence: 1.0,
      userBelief: question,
    };
  }
}