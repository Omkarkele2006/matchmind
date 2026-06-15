/**
 * API Route: POST /api/explain-match
 * Entry point for explaining a specific match's tactical outcome.
 */

import { NextResponse } from "next/server";
import { explainTactics } from "@/lib/explain-tactics";

interface ExplainMatchRequestBody {
  matchId?: unknown;
}

const ALLOWED_MATCH_IDS = [
  "argentina-france-2022-final",
  "germany-brazil-2014-semi",
  "morocco-portugal-2022-quarter",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExplainMatchRequestBody;
    const matchId = body.matchId;

    // VALIDATION GATEWAY: Performing structural checks on incoming parameters in the controller layer
    // prevents sending malformed text payloads to Watsonx, minimizing token costs and latency.
    if (typeof matchId !== "string" || matchId.trim().length === 0) {
      return NextResponse.json(
        {
          error: "matchId must be a non-empty string.",
        },
        {
          status: 400,
        }
      );
    }

    const trimmedMatchId = matchId.trim();

    // ID SANITIZATION: Restricting model inference strictly to historic matches in the dataset.
    if (!ALLOWED_MATCH_IDS.includes(trimmedMatchId)) {
      return NextResponse.json(
        {
          error: `Invalid matchId. Must be one of: ${ALLOWED_MATCH_IDS.join(", ")}`,
        },
        {
          status: 400,
        }
      );
    }

    const result = await explainTactics(trimmedMatchId);

    return NextResponse.json(result, {
      status: 200,
    });
  } catch (error) {
    console.error("Explain Match API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to generate tactical explanation.";

    // If it's a match-not-found error, return 404
    if (errorMessage.includes("Match not found")) {
      return NextResponse.json(
        {
          error: errorMessage,
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        error: errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}
