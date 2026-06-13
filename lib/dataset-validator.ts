import { z } from "zod";

import { matchSchema } from "@/lib/schemas";
import type { Match } from "@/lib/types";

const matchesSchema = z.array(matchSchema);

export function validateMatch(data: unknown): Match {
  return matchSchema.parse(data);
}

export function validateMatches(data: unknown): Match[] {
  return matchesSchema.parse(data);
}

export function safeValidateMatches(data: unknown) {
  const result = matchesSchema.safeParse(data);

  if (result.success) {
    return {
      success: true as const,
      data: result.data,
    };
  }

  return {
    success: false as const,
    errors: result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}

export function validateMatchesOrThrow(data: unknown): Match[] {
  const result = matchesSchema.safeParse(data);

  if (result.success) {
    return result.data;
  }

  const formattedErrors = result.error.issues
    .map(
      (issue) =>
        `${issue.path.join(".") || "root"}: ${issue.message}`
    )
    .join("\n");

  throw new Error(
    `Dataset validation failed:\n${formattedErrors}`
  );
}

export function getMatchById(
  matches: Match[],
  matchId: string
): Match | undefined {
  return matches.find((match) => match.id === matchId);
}

export function requireMatchById(
  matches: Match[],
  matchId: string
): Match {
  const match = getMatchById(matches, matchId);

  if (!match) {
    throw new Error(
      `Match not found: ${matchId}`
    );
  }

  return match;
}