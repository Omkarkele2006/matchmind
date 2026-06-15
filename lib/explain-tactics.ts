import { graniteChat, extractJsonBlock } from "./granite";
import { SYSTEM_PROMPTS, buildTacticalExplanationUserPrompt } from "./prompts";
import { tacticalExplanationSchema } from "./schemas";
import type { TacticalExplanation } from "./types";
import { requireMatchById, validateMatchesOrThrow } from "./dataset-validator";
import matchesData from "@/data/matches.json";

// Validate matches dataset once on module load
const validatedMatches = validateMatchesOrThrow(matchesData);

/**
 * Service to analyze a match's tactics using IBM Granite.
 * Focuses on explaining why the winner won and the deeper tactical lesson most fans miss.
 */
export async function explainTactics(matchId: string): Promise<TacticalExplanation> {
  const match = requireMatchById(validatedMatches, matchId);

  // Specific query instructions enforcing tactical focus and misconception education
  const question = `Explain why the winning team succeeded and identify the deeper tactical lesson most fans miss.
Specifically answer:
1. Why did the winning team win?
2. What deeper tactical lesson would most fans miss (specifically correcting common football misconceptions such as possession bias, shot volume over chance quality, or home advantage)?

Focus strictly on:
- Tactical causes and match structure
- Pressing patterns and defensive shape
- Transition phases
- Chance quality (xG vs shot volume)

Avoid narrative storytelling, emotional explanations, and generic football clichés. Ensure the response format matches the required contract exactly.`;

  const matchDataText = JSON.stringify(match, null, 2);

  const response = await graniteChat(
    [
      {
        role: "system",
        content: SYSTEM_PROMPTS.tacticalExplainer,
      },
      {
        role: "user",
        content: buildTacticalExplanationUserPrompt(matchDataText, question),
      },
    ],
    {
      temperature: 0.1, // low temperature for precise factual reasoning
      maxTokens: 512,
    }
  );

  console.log(`\n========================================`);
  console.log(`[TACTICAL EXPLAINER] Raw response for match: ${matchId}`);
  console.log(`========================================`);
  console.log(response.text);

  try {
    const jsonText = extractJsonBlock(response.text);
    console.log(`\n========================================`);
    console.log(`[TACTICAL EXPLAINER] Extracted JSON`);
    console.log(`========================================`);
    console.log(jsonText);

    const parsed = JSON.parse(jsonText);
    return tacticalExplanationSchema.parse(parsed);
  } catch (error) {
    console.error(`Tactical Explainer failed for match ${matchId}:`, error);
    throw new Error(`Failed to parse tactical explanation from model: ${error instanceof Error ? error.message : String(error)}`);
  }
}
