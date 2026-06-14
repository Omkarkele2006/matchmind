import { MisconceptionType } from "@/lib/types";


// IBM Granite Configuration


export const GRANITE_MODEL_ID = "ibm/granite-3-8b-instruct";

export const MAX_GENERATION_TOKENS = 600;


// Confidence Thresholds


export const HIGH_CONFIDENCE_THRESHOLD = 0.85;

export const MEDIUM_CONFIDENCE_THRESHOLD = 0.6;

export const CONFIDENCE_LEVELS = [
  "HIGH",
  "MEDIUM",
  "LOW",
] as const;
// Misconception Registry


export interface MisconceptionDefinition {
  id: MisconceptionType;

  title: string;

  shortDescription: string;

  educationalCorrection: string;
}

export const MISCONCEPTIONS: Record<
  Exclude<MisconceptionType, "NONE">,
  MisconceptionDefinition
> = {
  POSSESSION_EQUALS_CONTROL: {
    id: "POSSESSION_EQUALS_CONTROL",
    title: "Possession Equals Control",
    shortDescription:
      "Having more possession does not automatically mean controlling the match.",
    educationalCorrection:
      "Possession is only one metric. Teams can control matches through defensive shape, transitions, and chance quality."
  },

  MORE_SHOTS_EQUALS_BETTER_TEAM: {
    id: "MORE_SHOTS_EQUALS_BETTER_TEAM",
    title: "More Shots Equals Better Team",
    shortDescription:
      "Taking more shots does not necessarily mean playing better football.",
    educationalCorrection:
      "Shot quality matters more than shot quantity. A few high-quality chances can be more valuable than many poor shots."
  },

  HIGH_XG_GUARANTEES_WIN: {
    id: "HIGH_XG_GUARANTEES_WIN",
    title: "High xG Guarantees Victory",
    shortDescription:
      "Expected Goals (xG) measures probability, not certainty.",
    educationalCorrection:
      "A team with higher xG is statistically more likely to score, but football outcomes are never guaranteed."
  },

  LOSING_TEAM_IS_ALWAYS_WORSE: {
    id: "LOSING_TEAM_IS_ALWAYS_WORSE",
    title: "Losing Team Is Always Inferior",
    shortDescription:
      "The final score does not always reflect overall performance.",
    educationalCorrection:
      "Football contains randomness. Strong performances can still result in defeat."
  },

  SUBSTITUTION_CAUSED_LOSS: {
    id: "SUBSTITUTION_CAUSED_LOSS",
    title: "Substitution Caused The Loss",
    shortDescription:
      "A substitution may correlate with a result without causing it.",
    educationalCorrection:
      "Football outcomes are usually influenced by multiple tactical and contextual factors."
  },

  OFFSIDE_IS_JUST_BEING_AHEAD: {
    id: "OFFSIDE_IS_JUST_BEING_AHEAD",
    title: "Offside Is Just Being Ahead",
    shortDescription:
      "Offside depends on timing, positioning, and involvement in play.",
    educationalCorrection:
      "A player is judged relative to the moment the ball is played and whether they gain an advantage from their position."
  },

  MORE_PASSES_EQUALS_BETTER_PLAY: {
    id: "MORE_PASSES_EQUALS_BETTER_PLAY",
    title: "More Passes Equals Better Football",
    shortDescription:
      "Passing volume alone does not determine effectiveness.",
    educationalCorrection:
      "The purpose and effectiveness of passes matter more than the total number completed."
  },

  HIGH_PRESS_ALWAYS_WINS: {
    id: "HIGH_PRESS_ALWAYS_WINS",
    title: "High Press Always Wins",
    shortDescription:
      "Aggressive pressing is only one tactical approach.",
    educationalCorrection:
      "Successful teams balance pressing, defensive structure, transitions, and game-state management."
  },

  CORNERS_EQUAL_DOMINANCE: {
    id: "CORNERS_EQUAL_DOMINANCE",
    title: "Corner Count Isn't a Dominance Metric",
    shortDescription:
      "Corners often reflect defensive resistance, not offensive dominance.",
    educationalCorrection:
      "Corner volume rarely correlates with winning probability. The conversion rate of corners is low (around 2–3%)."
  },

  SHOTS_ON_TARGET_EQUALS_QUALITY: {
    id: "SHOTS_ON_TARGET_EQUALS_QUALITY",
    title: "Shots on Target Are Not Always High Quality",
    shortDescription:
      "A shot on target can be low-quality and easily saved.",
    educationalCorrection:
      "Shot quality (xG) is a better predictor of goals than shot volume or shots on target, which ignores goalkeeper pressure and shot difficulty."
  },

  STAR_PLAYER_EQUALS_VICTORY: {
    id: "STAR_PLAYER_EQUALS_VICTORY",
    title: "A Star Player Does Not Guarantee Success",
    shortDescription:
      "Football is an 11-vs-11 system game.",
    educationalCorrection:
      "Cohesion, tactical alignment, and pressing systems can neutralize individual stars."
  }
};


// VAR Incident Types


export const VAR_INCIDENT_TYPES = [
  "offside",
  "handball",
  "foul",
  "penalty_awarded",
  "goal_disallowed",
  "penalty_review",
  "red_card_review",
] as const;


// Demo Dataset IDs


export const FEATURED_MATCH_IDS = [
  "argentina-france-2022",
  "germany-brazil-2014",
  "morocco-portugal-2022",
  "spain-morocco-2022",
  "japan-germany-2022"
] as const;