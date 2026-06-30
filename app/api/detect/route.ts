/**
 * API Route: POST /api/detect
 * Entry point for frontend analysis requests to evaluate football claims.
 */

import { NextResponse } from "next/server";

import { detectMisconception } from "@/lib/detect-misconception";

interface DetectRequestBody {
  question?: unknown;
}

// Handles misconception analysis. Validates request formatting and invokes the classifier.
export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as DetectRequestBody;

    const question = body.question;

    // VALIDATION GATEWAY: Performing structural checks on incoming parameters in the controller layer
    // prevents sending malformed text payloads to Watsonx, minimizing token costs and latency.
    if (
      typeof question !== "string" ||
      question.trim().length === 0
    ) {
      return NextResponse.json(
        {
          error:
            "Question must be a non-empty string.",
        },
        {
          status: 400,
        }
      );
    }

    const result =
      await detectMisconception(
        question.trim()
      );

    return NextResponse.json(
      result,
      {
        status: 200,
      }
    );
  } catch (error) {
  console.error("Detect API error:", error);

  const errorMessage =
    error instanceof Error
      ? error.message
      : "Failed to analyze question.";

  // IBM Granite sometimes reaches temporary shared capacity limits.
  // Return a friendly message instead of a generic 500 error.
  if (
    errorMessage.includes("429") ||
    errorMessage.includes("consumption_limit_reached")
  ) {
    return NextResponse.json(
      {
        error:
          "IBM Granite is currently experiencing high demand. Please try again in a few moments.",
      },
      {
        status: 429,
      }
    );
  }

  return NextResponse.json(
    {
      error: "Failed to analyze question.",
    },
    {
      status: 500,
    }
  );
}
}
