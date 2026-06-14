import type { MisconceptionType } from "@/lib/types";

export interface MisconceptionKnowledge {
  id: Exclude<MisconceptionType, "NONE">;

  title: string;

  explanation: string;

  correction: string;

  exampleMatches: string[];
}

export const MISCONCEPTION_KNOWLEDGE: Record<
  Exclude<MisconceptionType, "NONE">,
  MisconceptionKnowledge
> = {
  POSSESSION_EQUALS_CONTROL: {
    id: "POSSESSION_EQUALS_CONTROL",

    title: "Possession Does Not Always Mean Control",

    explanation:
      "Many fans assume that the team with more possession controlled the match. Possession only measures how long a team had the ball. A team can dominate possession while creating very few dangerous chances.",

    correction:
      "Control should be evaluated using chance creation, defensive stability, territory, and match context. Teams can intentionally give up possession and still control the game through organization and counterattacks.",

    exampleMatches: [
      "Morocco vs Portugal (2022)",
      "France vs Belgium (2018)",
    ],
  },

  MORE_SHOTS_EQUALS_BETTER_TEAM: {
    id: "MORE_SHOTS_EQUALS_BETTER_TEAM",

    title: "More Shots Does Not Automatically Mean Better Performance",

    explanation:
      "A team can take many low-quality shots from difficult positions while another team creates fewer but more dangerous opportunities.",

    correction:
      "Shot quality matters more than shot quantity. Expected Goals (xG) and chance quality provide a better measure of attacking effectiveness.",

    exampleMatches: [
      "Argentina vs France (2022)",
      "Liverpool vs Real Madrid (2022 UCL Final)",
    ],
  },

  HIGH_XG_GUARANTEES_WIN: {
    id: "HIGH_XG_GUARANTEES_WIN",

    title: "High xG Does Not Guarantee Victory",

    explanation:
      "Expected Goals estimates the likelihood of scoring from chances created. It predicts probability, not certainty.",

    correction:
      "A team with higher xG usually performs better offensively, but finishing quality, goalkeeping, luck, and defensive actions still influence the final result.",

    exampleMatches: [
      "Argentina vs France (2022)",
      "Liverpool vs Real Madrid (2022 UCL Final)",
    ],
  },

  LOSING_TEAM_IS_ALWAYS_WORSE: {
    id: "LOSING_TEAM_IS_ALWAYS_WORSE",

    title: "The Losing Team Was Not Necessarily Worse",

    explanation:
      "Football often contains randomness. Strong performances do not always produce positive results.",

    correction:
      "Evaluate overall performance using chance quality, tactical execution, defensive structure, and match events rather than only the final score.",

    exampleMatches: [
      "Argentina vs Saudi Arabia (2022)",
      "France vs Argentina (2022)",
    ],
  },

  SUBSTITUTION_CAUSED_LOSS: {
    id: "SUBSTITUTION_CAUSED_LOSS",

    title: "One Substitution Rarely Explains an Entire Result",

    explanation:
      "Fans often blame a single substitution when a team loses. Match outcomes usually result from multiple interacting factors.",

    correction:
      "Analyze tactical changes, fatigue, momentum shifts, injuries, and overall match context before attributing the result to one substitution.",

    exampleMatches: [
      "France vs Argentina (2022)",
      "Germany vs Brazil (2014)",
    ],
  },

  OFFSIDE_IS_JUST_BEING_AHEAD: {
    id: "OFFSIDE_IS_JUST_BEING_AHEAD",

    title: "Offside Is More Than Being Ahead",

    explanation:
      "Many fans believe a player is offside whenever they stand closer to goal than defenders.",

    correction:
      "Offside depends on the position of both the ball and the second-last defender at the moment the pass is played. Timing is crucial.",

    exampleMatches: [
      "France vs Argentina (2022)",
      "Multiple VAR-reviewed matches",
    ],
  },

  MORE_PASSES_EQUALS_BETTER_PLAY: {
    id: "MORE_PASSES_EQUALS_BETTER_PLAY",

    title: "More Passes Does Not Mean Better Football",

    explanation:
      "A team may complete many safe passes without creating meaningful attacking opportunities.",

    correction:
      "Passing should be evaluated based on progression, chance creation, and tactical purpose rather than raw volume alone.",

    exampleMatches: [
      "Spain vs Morocco (2022)",
      "Barcelona vs Chelsea (2012)",
    ],
  },

  HIGH_PRESS_ALWAYS_WINS: {
    id: "HIGH_PRESS_ALWAYS_WINS",

    title: "High Pressing Is Not Always the Best Strategy",

    explanation:
      "High pressing can create turnovers and chances, but it also leaves space behind the defensive line.",

    correction:
      "Successful pressing depends on coordination, fitness, defensive structure, and the opponent's ability to play through pressure.",

    exampleMatches: [
      "Germany vs Brazil (2014)",
      "Manchester City vs Real Madrid (various matches)",
    ],
  },

  CORNERS_EQUAL_DOMINANCE: {
    id: "CORNERS_EQUAL_DOMINANCE",

    title: "Corner Count Isn't a Dominance Metric",

    explanation:
      "Corners often come from blocked crosses and deflected shots — signs of defensive resistance, not attacking superiority.",

    correction:
      "Corner volume rarely correlates with winning probability. The conversion rate of corners is low (around 2–3%).",

    exampleMatches: [
      "Arsenal vs Brighton (2023)",
    ],
  },

  SHOTS_ON_TARGET_EQUALS_QUALITY: {
    id: "SHOTS_ON_TARGET_EQUALS_QUALITY",

    title: "Shots on Target Are Not Always High Quality",

    explanation:
      "A shot on target can be a weak shot straight at the goalkeeper, which is easy to handle, whereas a shot off target might have been a better opportunity.",

    correction:
      "Shot quality (xG) is a better predictor of goals than shot volume or shots on target, which ignores goalkeeper pressure and shot difficulty.",

    exampleMatches: [
      "Bayern vs Villarreal (2022 UCL QF)",
    ],
  },

  STAR_PLAYER_EQUALS_VICTORY: {
    id: "STAR_PLAYER_EQUALS_VICTORY",

    title: "A Star Player Does Not Guarantee Success",

    explanation:
      "Having the best player on the pitch does not guarantee winning because football is a system game where collective coordination is more important.",

    correction:
      "Cohesion, tactical alignment, and pressing systems can neutralize individual stars.",

    exampleMatches: [
      "Argentina vs Saudi Arabia (2022)",
    ],
  },
};