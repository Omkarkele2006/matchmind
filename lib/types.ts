
// Match Domain Types
export type ConfidenceLevel =
  | "HIGH"
  | "MEDIUM"
  | "LOW";
export type PressingLevel =
    | "LOW"
    | "MEDIUM"
    | "HIGH";
export interface MatchResult {
    homeGoals: number;
    awayGoals: number;
    winner: "home" | "away" | "draw";
    method?: "regular_time" | "extra_time" | "penalties";
}

export interface MatchStats {
    possession: {
        home: number;
        away: number;
    };

    shots: {
        home: number;
        away: number;
    };

    shotsOnTarget: {
        home: number;
        away: number;
    };

    xg: {
        home: number;
        away: number;
    };

    passes: {
        home: number;
        away: number;
    };

    passAccuracy: {
        home: number;
        away: number;
    };

    pressingIntensity?: {
        home: PressingLevel;
        away: PressingLevel;
    };

    defensiveLine?: {
        home: string;
        away: string;
    };
}

export interface TimelineEvent {
    minute: number;

    event:
    | "goal"
    | "yellow_card"
    | "red_card"
    | "substitution"
    | "penalty"
    | "var_review";

    team: string;

    description?: string;

    player?: string;
}

export interface VarIncident {
    id: string;

    minute: number;

    type:
    | "offside"
    | "handball"
    | "foul"
    | "penalty_awarded"
    | "goal_disallowed"
    | "penalty_review"
    | "red_card_review";

    decision: string;

    ruleApplied: string;

    overturned: boolean;

    explanationContext: string;
}

export interface Match {
  id: string;

  title: string;

  // ISO format YYYY-MM-DD
  date: string;

  competition: string;

  stage?: string;

  venue?: string;

  homeTeam: string;

  awayTeam: string;

  result: MatchResult;

  stats: MatchStats;

  timeline: TimelineEvent[];

  varIncidents: VarIncident[];
}


// Misconception Types


export type MisconceptionType =
    | "POSSESSION_EQUALS_CONTROL"
    | "MORE_SHOTS_EQUALS_BETTER_TEAM"
    | "HIGH_XG_GUARANTEES_WIN"
    | "LOSING_TEAM_IS_ALWAYS_WORSE"
    | "SUBSTITUTION_CAUSED_LOSS"
    | "OFFSIDE_IS_JUST_BEING_AHEAD"
    | "MORE_PASSES_EQUALS_BETTER_PLAY"
    | "HIGH_PRESS_ALWAYS_WINS"
    | "NONE";

export interface MisconceptionClassifierResponse {
    misconceptionDetected: boolean;

    misconceptionType: MisconceptionType;

    // 0.0 - 1.0
    confidence: number;

    userBelief: string;
}


// Tactical Explainer Output


export interface TacticalExplanation {
    verdict: string;

    causalFactors: string[];

    hiddenInsight: string;
}


// VAR Explainer Output


export interface VarExplanation {
    lawApplied: string;

    decisionLogic: string[];

    reviewReason: string;

    confidenceLevel: ConfidenceLevel;

    confidenceReason: string;
}


// Future VAR Consistency


export interface VarComparison {
    firstIncident: VarIncident;

    secondIncident: VarIncident;

    consistencyVerdict: string;

    reasoning: string;
}

//future placeholder for granite.ts
export interface GraniteMessage {
  role: "system" | "user";
  content: string;
}