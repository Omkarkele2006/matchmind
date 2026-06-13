import { z } from "zod";

import {
    CONFIDENCE_LEVELS,
    VAR_INCIDENT_TYPES,
} from "@/lib/constants";
import { MISCONCEPTION_IDS } from "@/lib/misconceptions";

// Match schemas

export const matchResultSchema = z.object({
    homeGoals: z.number().int().min(0),
    awayGoals: z.number().int().min(0),

    winner: z.enum(["home", "away", "draw"]),

    method: z
        .enum(["regular_time", "extra_time", "penalties"])
        .optional(),
});

export const pressingLevelSchema = z.enum([
    "LOW",
    "MEDIUM",
    "HIGH",
]);

export const matchStatsSchema = z.object({
    possession: z.object({
        home: z.number().min(0).max(100),
        away: z.number().min(0).max(100),
    }),

    shots: z.object({
        home: z.number().int().min(0),
        away: z.number().int().min(0),
    }),

    shotsOnTarget: z.object({
        home: z.number().int().min(0),
        away: z.number().int().min(0),
    }),

    xg: z.object({
        home: z.number().min(0),
        away: z.number().min(0),
    }),

    passes: z.object({
        home: z.number().int().min(0),
        away: z.number().int().min(0),
    }),

    passAccuracy: z.object({
        home: z.number().min(0).max(100),
        away: z.number().min(0).max(100),
    }),

    pressingIntensity: z
        .object({
            home: pressingLevelSchema,
            away: pressingLevelSchema,
        })
        .optional(),

    defensiveLine: z
        .object({
            home: z.string(),
            away: z.string(),
        })
        .optional(),
});

export const timelineEventSchema = z.object({
    minute: z.number().int().min(0).max(130),

    event: z.enum([
        "goal",
        "yellow_card",
        "red_card",
        "substitution",
        "penalty",
        "var_review",
    ]),

    team: z.string().min(1),

    description: z.string().optional(),

    player: z.string().optional(),
});

export const varIncidentSchema = z.object({
    id: z.string().min(1),

    minute: z.number().int().min(0).max(130),

    type: z.enum(VAR_INCIDENT_TYPES),
    decision: z.string().min(1),

    ruleApplied: z.string().min(1),

    overturned: z.boolean(),

    explanationContext: z.string().min(1),
});

export const matchSchema = z.object({
    id: z.string().min(1),

    title: z.string().min(1),

    date: z
        .string()
        .regex(
            /^\d{4}-\d{2}-\d{2}$/,
            "Date must use YYYY-MM-DD format"
        ),

    competition: z.string().min(1),

    stage: z.string().min(1).optional(),

    venue: z.string().min(1).optional(),

    homeTeam: z.string().min(1),

    awayTeam: z.string().min(1),

    result: matchResultSchema,

    stats: matchStatsSchema,

    timeline: z.array(timelineEventSchema),

    varIncidents: z.array(varIncidentSchema),
});

// Granite output schemas

export const misconceptionClassifierResponseSchema =
    z.object({
        misconceptionDetected: z.boolean(),

        misconceptionType: z.enum(MISCONCEPTION_IDS),

        confidence: z.number().min(0).max(1),

        userBelief: z.string().min(1),
    });

export const tacticalExplanationSchema = z.object({
    verdict: z.string().min(1),

    causalFactors: z
        .array(z.string().min(1))
        .length(3),

    hiddenInsight: z.string().min(1),
});

export const varExplanationSchema = z.object({
    lawApplied: z.string().min(1),

    decisionLogic: z
        .array(z.string().min(1))
        .min(1),

    reviewReason: z.string().min(1),

    confidenceLevel: z.enum(
        CONFIDENCE_LEVELS
    ),

    confidenceReason: z.string().min(1),
});

// Inferred types

export type MatchResultSchema =
    z.infer<typeof matchResultSchema>;

export type MatchStatsSchema =
    z.infer<typeof matchStatsSchema>;

export type TimelineEventSchema =
    z.infer<typeof timelineEventSchema>;

export type VarIncidentSchema =
    z.infer<typeof varIncidentSchema>;

export type MatchSchema =
    z.infer<typeof matchSchema>;

export type TacticalExplanationSchema =
    z.infer<typeof tacticalExplanationSchema>;

export type VarExplanationSchema =
    z.infer<typeof varExplanationSchema>;

export type MisconceptionClassifierResponseSchema =
    z.infer<
        typeof misconceptionClassifierResponseSchema
    >;