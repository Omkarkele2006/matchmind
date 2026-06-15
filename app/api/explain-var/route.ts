/**
 * API Route: POST /api/explain-var
 * Entry point for explaining historic VAR decisions in detail.
 */

import { NextResponse } from "next/server";
import { explainVar } from "@/lib/explain-var";

interface ExplainVarRequestBody {
  matchId?: unknown;
  incidentId?: unknown;
}

const ALLOWED_MATCH_IDS = [
  "argentina-france-2022-final",
  "germany-brazil-2014-semi",
  "morocco-portugal-2022-quarter",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExplainVarRequestBody;
    const matchId = body.matchId;
    const incidentId = body.incidentId;

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

    if (typeof incidentId !== "string" || incidentId.trim().length === 0) {
      return NextResponse.json(
        {
          error: "incidentId must be a non-empty string.",
        },
        {
          status: 400,
        }
      );
    }

    const trimmedMatchId = matchId.trim();
    const trimmedIncidentId = incidentId.trim();

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

    const result = await explainVar(trimmedMatchId, trimmedIncidentId);

    return NextResponse.json(result, {
      status: 200,
    });
  } catch (error) {
    console.error("Explain VAR API error:", error);

    const errorMessage = error instanceof Error ? error.message : "Failed to explain VAR decision.";

    if (errorMessage.includes("Incident not found") || errorMessage.includes("Match not found")) {
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
