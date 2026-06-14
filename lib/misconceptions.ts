import { z } from "zod";

import {
  HIGH_CONFIDENCE_THRESHOLD,
  MEDIUM_CONFIDENCE_THRESHOLD,
  MISCONCEPTIONS
} from "@/lib/constants";

import type {
  ConfidenceLevel,
  MisconceptionClassifierResponse,
  MisconceptionType
} from "@/lib/types";

// Valid misconception IDs accepted from classifier outputs
export const MISCONCEPTION_IDS = [
  "POSSESSION_EQUALS_CONTROL",
  "MORE_SHOTS_EQUALS_BETTER_TEAM",
  "HIGH_XG_GUARANTEES_WIN",
  "LOSING_TEAM_IS_ALWAYS_WORSE",
  "SUBSTITUTION_CAUSED_LOSS",
  "OFFSIDE_IS_JUST_BEING_AHEAD",
  "MORE_PASSES_EQUALS_BETTER_PLAY",
  "HIGH_PRESS_ALWAYS_WINS",
  "CORNERS_EQUAL_DOMINANCE",
  "SHOTS_ON_TARGET_EQUALS_QUALITY",
  "STAR_PLAYER_EQUALS_VICTORY",
  "NONE"
] as const;

// Validates structured JSON returned by Granite
export const misconceptionClassifierSchema = z.object({
  misconceptionDetected: z.boolean(),

  misconceptionType: z.enum(MISCONCEPTION_IDS),

  confidence: z.number().min(0).max(1),

  userBelief: z.string().trim().min(1)
});

// Validates and parses classifier responses
export function validateClassifierResponse(
  data: unknown
): MisconceptionClassifierResponse {
  return misconceptionClassifierSchema.parse(data);
}

// Returns misconception metadata from the central registry
export function getMisconceptionById(
  id: Exclude<MisconceptionType, "NONE">
) {
  return MISCONCEPTIONS[id];
}

// Runtime type guard for safer lookups
export function isKnownMisconception(
  id: string
): id is Exclude<MisconceptionType, "NONE"> {
  return id in MISCONCEPTIONS;
}

// Converts a numeric confidence score into a UI-friendly label
export function getConfidenceLevel(
  confidence: number
): ConfidenceLevel {
  if (confidence >= HIGH_CONFIDENCE_THRESHOLD) {
    return "HIGH";
  }

  if (confidence >= MEDIUM_CONFIDENCE_THRESHOLD) {
    return "MEDIUM";
  }

  return "LOW";
}

// Convenience helper used by routing and UI logic
export function isMisconceptionDetected(
  response: MisconceptionClassifierResponse
): boolean {
  return response.misconceptionType !== "NONE";
}