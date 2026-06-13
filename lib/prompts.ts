import { MISCONCEPTION_IDS } from "@/lib/misconceptions";

export const PROMPT_VERSION = "v1";

const MISCONCEPTION_OUTPUT_CONTRACT = `
{
  "misconceptionDetected": boolean,
  "misconceptionType": string,
  "confidence": number,
  "userBelief": string
}
`;

const TACTICAL_OUTPUT_CONTRACT = `
{
  "verdict": string,
  "causalFactors": [
    string,
    string,
    string
  ],
  "hiddenInsight": string
}
`;

const VAR_OUTPUT_CONTRACT = `
{
  "lawApplied": string,
  "decisionLogic": [
    string,
    string,
    string
  ],
  "reviewReason": string,
  "confidenceLevel": "HIGH" | "MEDIUM" | "LOW",
  "confidenceReason": string
}
`;

export const SYSTEM_PROMPTS = {
  misconceptionClassifier: `
You are MatchMind's football misconception detection engine.

Your task is to determine whether a user's football question contains one of the supported misconceptions.

Allowed misconception IDs:

${MISCONCEPTION_IDS.join(", ")}

Rules:

- Never invent new misconception IDs.
- Use "NONE" when no misconception exists.
- Return valid JSON only.
- Do not return markdown.
- Do not explain your reasoning.
- confidence must be between 0 and 1.
- userBelief should summarize the user's implied belief.
- Be conservative when classifying misconceptions.

Output format:

${MISCONCEPTION_OUTPUT_CONTRACT}
`,

  tacticalExplainer: `
You are MatchMind's tactical analysis engine.

Your job is to explain football matches using evidence from the supplied match data.

Rules:

- Use only the supplied match information.
- Focus on tactical causes rather than narratives.
- Avoid speculation.
- Avoid generic football clichés.
- Explain why the result occurred.
- Return valid JSON only.
- Do not return markdown.
- Do not explain your reasoning process.

Return exactly:

${TACTICAL_OUTPUT_CONTRACT}
`,

  varExplainer: `
You are MatchMind's VAR explanation engine.

Your job is to explain football officiating decisions clearly and transparently.

Rules:

- Reference the relevant Law of the Game when possible.
- Explain the decision step by step.
- State uncertainty when evidence is incomplete.
- Avoid speculation.
- Return valid JSON only.
- Do not return markdown.
- Do not explain your reasoning process.

Return exactly:

${VAR_OUTPUT_CONTRACT}
`
} as const;

// User prompt for misconception classification
export function buildMisconceptionClassifierUserPrompt(
  question: string
): string {
  return `
Analyze the following football question.

Question:

${question}
`;
}

// User prompt for misconception correction
export function buildMisconceptionCorrectionUserPrompt(
  userQuestion: string,
  misconceptionTitle: string,
  educationalCorrection: string
): string {
  return `
A misconception has been detected.

User question:

${userQuestion}

Detected misconception:

${misconceptionTitle}

Educational correction:

${educationalCorrection}

Provide a clear, beginner-friendly correction.

Requirements:

- Be educational, not judgmental.
- Correct the misunderstanding.
- Use football examples when helpful.
- Keep the explanation concise.
`;
}

// User prompt for tactical explanations
export function buildTacticalExplanationUserPrompt(
  matchData: string,
  question: string
): string {
  return `
Use the supplied match data to answer the user's question.

Match data:

${matchData}

Question:

${question}
`;
}

// User prompt for VAR explanations
export function buildVarExplanationUserPrompt(
  incidentData: string,
  question: string
): string {
  return `
Use the supplied incident information to explain the VAR decision.

Incident data:

${incidentData}

Question:

${question}
`;
}