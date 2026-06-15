import { graniteChat, extractJsonBlock } from "./granite";
import { SYSTEM_PROMPTS, buildVarExplanationUserPrompt } from "./prompts";
import { varExplanationSchema } from "./schemas";
import type { VarExplanation } from "./types";
import { requireMatchById, validateMatchesOrThrow } from "./dataset-validator";
import matchesData from "@/data/matches.json";

const validatedMatches = validateMatchesOrThrow(matchesData);

/**
 * Service to analyze and explain a VAR incident using IBM Granite.
 * Focuses on explaining the applied law, decision logic, controversy factors, common misconceptions, and educational takeaways.
 */
export async function explainVar(matchId: string, incidentId: string): Promise<VarExplanation> {
  const match = requireMatchById(validatedMatches, matchId);
  const incident = match.varIncidents.find((inc) => inc.id === incidentId);

  if (!incident) {
    throw new Error(`Incident not found: ${incidentId} in match ${matchId}`);
  }

  // Enforce structured instructions highlighting controversy, misconceptions, and takeaways.
  // Instructs Granite to place them clearly inside the confidenceReason field.
  const question = `Explain the VAR decision for the selected incident and identify the relevant rule, step-by-step logic, and why fans often misunderstand it.

Specifically address:
1. Which Law of the Game was applied?
2. Why was the decision made?
3. Why was the decision controversial?
4. What misconception do fans commonly have about this decision?
5. What is the educational takeaway?

CRITICAL: In the output JSON, the "confidenceReason" field MUST be a single string containing the exact text prefix "COMMON MISUNDERSTANDING:" followed by the fan misconception, and "EDUCATIONAL TAKEAWAY:" followed by the key lesson. Example: "COMMON MISUNDERSTANDING: Fans believe X. EDUCATIONAL TAKEAWAY: The rule is Y."
This is mandatory under all circumstances, even if the decision is simple.

Focus strictly on rules, tactical structure, and objective parameters. Avoid narrative storytelling and generic clichés. Ensure the output strictly conforms to the JSON schema.`;

  const incidentDataText = JSON.stringify(incident, null, 2);

  const response = await graniteChat(
    [
      {
        role: "system",
        content: SYSTEM_PROMPTS.varExplainer,
      },
      {
        role: "user",
        content: buildVarExplanationUserPrompt(incidentDataText, question),
      },
    ],
    {
      temperature: 0.1, // low temperature for absolute rule compliance
      maxTokens: 512,
    }
  );

  console.log(`\n========================================`);
  console.log(`[VAR EXPLAINER] Raw response for incident: ${incidentId}`);
  console.log(`========================================`);
  console.log(response.text);

  try {
    const jsonText = extractJsonBlock(response.text);
    console.log(`\n========================================`);
    console.log(`[VAR EXPLAINER] Extracted JSON`);
    console.log(`========================================`);
    console.log(jsonText);

    const parsed = JSON.parse(jsonText);
    return varExplanationSchema.parse(parsed);
  } catch (error) {
    // DIAGNOSTIC FAIL: Throwing parsing errors allows the routing controller to map
    // these failures to HTTP error payloads rather than swallowing them silently.
    console.error(`VAR Explainer failed for incident ${incidentId}:`, error);
    throw new Error(`Failed to parse VAR explanation from model: ${error instanceof Error ? error.message : String(error)}`);
  }
}
