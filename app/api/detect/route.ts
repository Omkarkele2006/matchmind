import { NextResponse } from "next/server";

import { detectMisconception } from "@/lib/detect-misconception";

interface DetectRequestBody {
  question?: unknown;
}

export async function POST(
  request: Request
) {
  try {
    const body =
      (await request.json()) as DetectRequestBody;

    const question = body.question;

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
    console.error(
      "Detect API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to analyze question.",
      },
      {
        status: 500,
      }
    );
  }
}