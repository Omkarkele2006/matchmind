"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import Image from "next/image";
import type { TacticalExplanation, VarExplanation } from "@/lib/types";

type DetectResponse = {
  misconceptionDetected: boolean;
  misconceptionType: string | null;
  confidence: number;
  userBelief: string;
};

const MISCONCEPTION_CONTENT: Record<
  string,
  {
    title: string;
    whyMisleading: string;
    deeperReality: string;
    examples: { match: string; year: string; insight: string; relevance: string }[];
  }
> = {
  POSSESSION_EQUALS_CONTROL: {
    title: "Possession Does Not Equal Control",
    whyMisleading:
      "High possession often reflects the opponent's defensive choice, not dominance. Teams can cede the ball deliberately to invite pressure and counter through transitions.",
    deeperReality:
      "Modern tactics measure control through xG, field tilt, progressive passes into the final third, and shot quality — not raw ball-time. A team with 35% possession can still generate the better chances.",
    examples: [
      {
        match: "Portugal 0–1 Morocco",
        year: "2022 World Cup QF",
        insight:
          "Portugal had 65% possession but Morocco's compact mid-block produced the higher xG and the decisive set-piece goal.",
        relevance:
          "Possession without penetration into Zone 14 is sterile circulation, not control.",
      },
      {
        match: "Leicester City Title Run",
        year: "2015/16 Premier League",
        insight:
          "Leicester averaged just 42.4% possession yet won the league via vertical transitions and Vardy's runs in behind.",
        relevance:
          "Champions can be built on counter-attacking identity, not ball monopoly.",
      },
    ],
  },
  HIGH_XG_GUARANTEES_WIN: {
    title: "High xG Doesn't Always Mean the Better Team",
    whyMisleading:
      "xG measures shot quality, not match management. A team can rack up speculative chances while losing the territorial and tactical battle.",
    deeperReality:
      "Context matters: game state, opponent's defensive shape, and chance creation patterns. xG inflates when chasing a deficit against a low block.",
    examples: [
      {
        match: "Man City vs Tottenham",
        year: "Premier League 2022",
        insight:
          "City posted 3.0+ xG but Spurs won via two clinical counters — a recurring pattern against deep defenses.",
        relevance: "Volume xG against parked buses overstates true dominance.",
      },
    ],
  },
  CORNERS_EQUAL_DOMINANCE: {
    title: "Corner Count Isn't a Dominance Metric",
    whyMisleading:
      "Corners often come from blocked crosses and deflected shots — signs of defensive resistance, not attacking superiority.",
    deeperReality:
      "Conversion rate from corners hovers near 2–3% league-wide. Volume rarely correlates with winning probability.",
    examples: [
      {
        match: "Arsenal vs Brighton",
        year: "Premier League 2023",
        insight:
          "Arsenal had 11 corners to Brighton's 2 but lost — corners reflected Brighton's smart shot-blocking scheme.",
        relevance: "Corners are a byproduct of defensive structure, not offensive control.",
      },
    ],
  },
  SHOTS_ON_TARGET_EQUALS_QUALITY: {
    title: "Shots on Target ≠ Chance Quality",
    whyMisleading:
      "A tame header straight at the keeper counts the same as a one-on-one. The metric ignores location, pressure, and shot type.",
    deeperReality:
      "xG per shot and shot location maps reveal true chance quality. Ten low-xG shots from outside the box rarely beat two high-xG box entries.",
    examples: [
      {
        match: "Bayern vs Villarreal",
        year: "UCL QF 2022",
        insight:
          "Bayern had double-digit shots on target across the tie but Villarreal's two high-quality chances proved decisive.",
        relevance: "Where and how you shoot matters more than how often.",
      },
    ],
  },
  STAR_PLAYER_EQUALS_VICTORY: {
    title: "A Star Player Doesn't Guarantee Victory",
    whyMisleading:
      "Football is an 11-vs-11 system game. Individual brilliance can be neutralized by tactical preparation, double-marking, and team cohesion.",
    deeperReality:
      "Structure, pressing triggers, and collective movement outweigh individual quality across a 90-minute match.",
    examples: [
      {
        match: "Argentina vs Saudi Arabia",
        year: "2022 World Cup",
        insight:
          "Messi scored but Saudi Arabia's coordinated high line and offside trap caught Argentina seven times to win 2–1.",
        relevance: "Team systems beat stars when the system is well-drilled.",
      },
    ],
  },
  MORE_SHOTS_EQUALS_BETTER_TEAM: {
    title: "More Shots Does Not Equal Better Play",
    whyMisleading:
      "A team can take many low-quality shots from difficult positions while another team creates fewer but more dangerous opportunities.",
    deeperReality:
      "Shot quality (xG per shot) matters more than shot quantity. Ten low-xG shots from outside the box rarely beat two high-xG box entries.",
    examples: [
      {
        match: "Argentina vs France",
        year: "2022 World Cup Final",
        insight:
          "Argentina had 20 shots to France's 10, but the actual high-quality chances were closer, leading to a 3-3 draw.",
        relevance: "Shot quantity overstates dominance; clinical chance conversion is key.",
      },
    ],
  },
  LOSING_TEAM_IS_ALWAYS_WORSE: {
    title: "The Losing Team Was Not Necessarily Inferior",
    whyMisleading:
      "Football contains significant randomness and low scoring margins. A superior team can dominate play but lose to a single deflection or refereeing error.",
    deeperReality:
      "Performance evaluation should be based on chance quality, tactical control, and structural execution rather than the final scoreline alone.",
    examples: [
      {
        match: "Argentina vs Saudi Arabia",
        year: "2022 World Cup",
        insight:
          "Argentina dominated the statistics and xG but lost due to clinical finishing from Saudi Arabia and a well-drilled offside trap.",
        relevance: "Results don't always match performance metrics in low-scoring sports.",
      },
    ],
  },
  SUBSTITUTION_CAUSED_LOSS: {
    title: "One Substitution Rarely Explains an Entire Result",
    whyMisleading:
      "Blaming a single sub oversimplifies the dynamic nature of football, ignoring structural fatigue, system shifts, and opponent adjustments.",
    deeperReality:
      "Tactical changes interact with player exhaustion and momentum. A single player entry or exit is part of a complex system of 22 players.",
    examples: [
      {
        match: "Brazil vs Germany",
        year: "2014 World Cup SF",
        insight:
          "Brazil's collapse was a systemic tactical failure rather than the result of any single player replacement.",
        relevance: "Systemic collapse cannot be reduced to a single personnel change.",
      },
    ],
  },
  OFFSIDE_IS_JUST_BEING_AHEAD: {
    title: "Offside Depends on Timing and Position",
    whyMisleading:
      "Fans think any player closer to the goal line than the ball/defenders is offside, ignoring the moment the pass is played.",
    deeperReality:
      "Offside is judged strictly at the point of ball contact, and requires the player to be actively involved in play or gaining an advantage.",
    examples: [
      {
        match: "Argentina vs France",
        year: "2022 World Cup Final",
        insight:
          "Several close offside decisions were reviewed by VAR, illustrating how precise timing of the pass determines legality, not static position.",
        relevance: "Offside is a dynamic spatial rule, not a static position.",
      },
    ],
  },
  MORE_PASSES_EQUALS_BETTER_PLAY: {
    title: "More Passes Does Not Mean Better Football",
    whyMisleading:
      "High passing numbers can represent passive possession in defensive areas, circulation without penetration, or a lack of forward ideas.",
    deeperReality:
      "Passing effectiveness is measured by progression, line-breaking passes, and key passes, rather than the raw quantity of side-to-side transfers.",
    examples: [
      {
        match: "Spain vs Morocco",
        year: "2022 World Cup R16",
        insight:
          "Spain completed over 1,000 passes but failed to break down Morocco's organized low block and was eliminated.",
        relevance: "Possession without penetration is sterile circulation.",
      },
    ],
  },
  HIGH_PRESS_ALWAYS_WINS: {
    title: "High Pressing Is Not Always the Best Strategy",
    whyMisleading:
      "High pressing is highly active and visually dominant, leading fans to believe it is inherently superior to sitting in a mid or low block.",
    deeperReality:
      "Aggressive pressing is physically exhausting and exposes space behind the defensive line that clinical teams can exploit.",
    examples: [
      {
        match: "Germany vs Brazil",
        year: "2014 World Cup SF",
        insight:
          "Germany easily bypassed Brazil's disorganized high press, exploiting the massive open spaces behind them.",
        relevance: "Pressing without synchronization creates space for the opponent.",
      },
    ],
  },
  NONE: {
    title: "Tactically Sound Perspective",
    whyMisleading:
      "No major tactical misconception was detected in your statement. Your reasoning aligns well with deep tactical indicators rather than surface-level statistical biases.",
    deeperReality:
      "Sound football analysis focuses on match context, chance quality, pressing coordination, and spatial control rather than drawing conclusions from raw numbers alone.",
    examples: [],
  },
};

const FALLBACK_CONTENT = {
  title: "Tactical Misconception Detected",
  whyMisleading:
    "Surface-level metrics often hide the tactical context that actually decided the match.",
  deeperReality:
    "Deeper indicators — pressing intensity, field tilt, shot quality, and game state — usually tell the real story.",
  examples: [] as { match: string; year: string; insight: string; relevance: string }[],
};

const EXAMPLE_PROMPTS = [
  "Portugal had more possession so they were clearly the better team.",
  "Man City had 3.0 xG, they deserved to win that match.",
  "Arsenal had 11 corners, they totally dominated.",
  "Messi was playing, Argentina had to win that game.",
];

const HOW_IT_WORKS_STEPS = [
  {
    title: "Football Opinion",
    desc: "Submit a tactical take, hot claim, or statistical belief.",
    icon: (
      <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    title: "IBM Granite 4",
    desc: "Granite 4 parses the statement's underlying tactical reasoning.",
    icon: (
      <svg className="h-5 w-5 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: "Misconception Detection",
    desc: "Identifies over-weighted metrics and superficial biases.",
    icon: (
      <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    title: "Educational Correction",
    desc: "Exposes the fallacy and explains the actual tactical reality.",
    icon: (
      <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    title: "Historical Match Evidence",
    desc: "Backs up the analysis with real-world match examples.",
    icon: (
      <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
];

function getContent(type: string | null) {
  if (!type) return FALLBACK_CONTENT;
  return MISCONCEPTION_CONTENT[type] ?? FALLBACK_CONTENT;
}

function confidenceTier(c: number) {
  if (c >= 0.8) return { label: "High Confidence", color: "text-emerald-400", bar: "bg-emerald-400" };
  if (c >= 0.5) return { label: "Medium Confidence", color: "text-amber-400", bar: "bg-amber-400" };
  return { label: "Low Confidence", color: "text-rose-400", bar: "bg-rose-400" };
}

export default function Page() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectResponse | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Tactical Explainer MVP States & Refs
  const [selectedMatchId, setSelectedMatchId] = useState("morocco-portugal-2022-quarter");
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [explainResult, setExplainResult] = useState<TacticalExplanation | null>(null);
  const explainResultsRef = useRef<HTMLDivElement>(null);

  // VAR Explainer MVP States & Refs
  const [selectedVarMatchId, setSelectedVarMatchId] = useState("argentina-france-2022-final");
  const [selectedVarIncidentId, setSelectedVarIncidentId] = useState("af2022-var-3");
  const [varLoading, setVarLoading] = useState(false);
  const [varError, setVarError] = useState<string | null>(null);
  const [varResult, setVarResult] = useState<VarExplanation | null>(null);
  const varResultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  useEffect(() => {
    if (explainResult && explainResultsRef.current) {
      explainResultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [explainResult]);

  useEffect(() => {
    if (varResult && varResultsRef.current) {
      varResultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [varResult]);

  async function explainMatch() {
    if (explainLoading) return;
    setExplainLoading(true);
    setExplainError(null);
    setExplainResult(null);
    try {
      const res = await fetch("/api/explain-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: selectedMatchId }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as TacticalExplanation;
      setExplainResult(data);
    } catch (e) {
      setExplainError(e instanceof Error ? e.message : "Something went wrong analyzing this match.");
    } finally {
      setExplainLoading(false);
    }
  }

  async function explainVarDecision() {
    if (varLoading) return;
    setVarLoading(true);
    setVarError(null);
    setVarResult(null);
    try {
      const res = await fetch("/api/explain-var", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: selectedVarMatchId,
          incidentId: selectedVarIncidentId,
        }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = (await res.json()) as VarExplanation;
      setVarResult(data);
    } catch (e) {
      setVarError(e instanceof Error ? e.message : "Something went wrong analyzing this incident.");
    } finally {
      setVarLoading(false);
    }
  }

  async function analyze() {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim() }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data: DetectResponse = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong analyzing this statement.");
    } finally {
      setLoading(false);
    }
  }

  function onKey(e: KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      analyze();
    }
  }

  const content = result ? getContent(result.misconceptionType) : null;
  const tier = result ? confidenceTier(result.confidence) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/30">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-120 w-120 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-130 w-130 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-105 w-105 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="MatchMind"
            width={40}
            height={40}
          />
          <span className="font-semibold tracking-tight">MatchMind</span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          IBM Granite Connected
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <section className="pt-12 pb-16 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 backdrop-blur">
            AI Football Misconception Detector
          </div>
          <h1 className="mx-auto max-w-3xl bg-linear-to-b from-white to-slate-400 bg-clip-text text-4xl font-bold leading-tight tracking-tight text-transparent md:text-6xl">
            Stop arguing with football stats. Start understanding them.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-400 md:text-lg">
            MatchMind uses IBM Granite to detect misleading football beliefs and explain the deeper tactical reality behind the numbers.
          </p>
        </section>

        <section className="relative rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-xl md:p-8">
          <label className="mb-3 block text-sm font-medium text-slate-300">
            Drop a football take, claim, or hot opinion
          </label>
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={onKey}
            maxLength={300}
            placeholder="e.g. Portugal had more possession so they were clearly the better team."
            className="min-h-30 w-full resize-none rounded-xl border border-white/10 bg-slate-950/60 p-4 text-base text-slate-100 placeholder:text-slate-500 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => setQuestion(p)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 transition hover:border-emerald-400/40 hover:bg-emerald-400/10 hover:text-emerald-200"
              >
                {p.length > 60 ? p.slice(0, 60) + "…" : p}
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <span className="text-xs text-slate-500">
              Tip: press <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">⌘</kbd> +{" "}
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">Enter</kbd> to analyze
            </span>
            <button
              onClick={analyze}
              disabled={loading || !question.trim()}
              className="group relative inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-emerald-400 to-sky-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Analyzing…" : "Analyze with Granite"}
              <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </section>

        <section ref={resultsRef} className="mt-10">
          {loading && (
            <div className="rounded-2xl border border-white/10 bg-white/3 p-8 backdrop-blur-xl flex flex-col items-center text-center">
              {/* Animated Spinner */}
              <div className="relative flex h-16 w-16 items-center justify-center mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-slate-800/50" />
                <div className="absolute inset-0 rounded-full border-4 border-t-emerald-400 border-r-sky-500 animate-spin" />
              </div>

              <h3 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                IBM Granite is analyzing your football belief...
              </h3>
              <p className="mt-2 max-w-md text-sm text-slate-400">
                Detecting misconceptions, validating reasoning, and searching for tactical evidence.
              </p>

              {/* Progress Steps */}
              <div className="mt-8 w-full max-w-sm text-left">
                <div className="rounded-xl border border-white/5 bg-slate-950/40 p-5 space-y-4">
                  {/* Step 1 */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-300">
                      Opinion received
                    </span>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-slate-300">
                      Sending to IBM Granite
                    </span>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 animate-pulse">
                      <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-white">
                      IBM Granite reasoning
                    </span>
                  </div>

                  {/* Step 4 */}
                  <div className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 animate-pulse">
                      <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-white">
                      Building educational feedback
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">
              <p className="font-medium">Unable to process your request</p>
              <p className="mt-1 text-sm text-rose-300/80">{error}</p>
            </div>
          )}

          {result && content && tier && !loading && (
            <div className="space-y-6">
              <article className="overflow-hidden rounded-2xl border border-white/10 bg-linear-to-br from-white/6 to-white/2 p-8 backdrop-blur-xl">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${result.misconceptionDetected
                        ? "border-amber-400/40 bg-amber-400/10 text-amber-300"
                        : "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                      }`}
                  >
                    {result.misconceptionDetected ? "Misconception Detected" : "Tactically Sound"}
                  </span>
                  <span className={`text-xs font-medium ${tier.color}`}>{tier.label}</span>
                </div>

                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{content.title}</h2>
                <p className="mt-3 text-sm text-slate-400">Your belief, as parsed by Granite:</p>
                <p className="mt-1 text-base italic text-slate-200">&ldquo;{result.userBelief}&rdquo;</p>

                <div className="mt-6">
                  <div className="mb-2 flex justify-between text-xs text-slate-400">
                    <span>Confidence</span>
                    <span>{Math.round(result.confidence * 100)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${tier.bar} transition-all duration-700`}
                      style={{ width: `${Math.round(result.confidence * 100)}%` }}
                    />
                  </div>
                </div>
              </article>

              <div className="grid gap-6 md:grid-cols-2">
                <article className="rounded-2xl border border-rose-500/20 bg-rose-500/4 p-6 backdrop-blur-xl">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-rose-300">
                    Why this is misleading
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-200">{content.whyMisleading}</p>
                </article>
                <article className="rounded-2xl border border-emerald-500/20 bg-emerald-500/4 p-6 backdrop-blur-xl">
                  <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-300">
                    The deeper tactical reality
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-200">{content.deeperReality}</p>
                </article>
              </div>

              {content.examples.length > 0 && (
                <section>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
                    Historical match evidence
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    {content.examples.map((ex) => (
                      <article
                        key={ex.match}
                        className="group rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-xl transition hover:border-sky-400/30 hover:bg-white/5"
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-semibold text-white">{ex.match}</h4>
                          <span className="text-xs text-slate-500">{ex.year}</span>
                        </div>
                        <p className="text-sm text-slate-300">{ex.insight}</p>
                        <p className="mt-3 border-t border-white/5 pt-3 text-xs italic text-sky-300/80">
                          {ex.relevance}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </section>

        {/* Tactical Explainer MVP Section */}
        <section className="mt-24 border-t border-white/10 pt-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Tactical Explainer
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-400">
              Understand the deeper tactical reasons behind famous football matches using IBM Granite.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-xl md:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end justify-between">
              <div className="flex-1">
                <label htmlFor="match-select" className="mb-3 block text-sm font-medium text-slate-300 font-sans">
                  Select a historic match to analyze
                </label>
                <select
                  id="match-select"
                  value={selectedMatchId}
                  onChange={(e) => setSelectedMatchId(e.target.value)}
                  disabled={explainLoading}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 p-4 text-base text-slate-100 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="morocco-portugal-2022-quarter">Morocco vs Portugal (2022 Quarter-final)</option>
                  <option value="germany-brazil-2014-semi">Germany vs Brazil (2014 Semi-final)</option>
                  <option value="argentina-france-2022-final">Argentina vs France (2022 Final)</option>
                </select>
              </div>

              <button
                onClick={explainMatch}
                disabled={explainLoading}
                className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-400 to-sky-500 px-8 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50 h-14.5 sm:w-50"
              >
                {explainLoading ? "Analyzing…" : "Explain Match"}
                <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          <div ref={explainResultsRef} className="mt-10">
            {explainLoading && (
              <div className="rounded-2xl border border-white/10 bg-white/3 p-8 backdrop-blur-xl flex flex-col items-center text-center">
                {/* Animated Spinner */}
                <div className="relative flex h-16 w-16 items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-800/50" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-emerald-400 border-r-sky-500 animate-spin" />
                </div>

                <h3 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                  IBM Granite is analyzing the match...
                </h3>
                <p className="mt-2 max-w-md text-sm text-slate-400">
                  Extracting tactical factors, reviewing spatial setups, and framing educational lessons.
                </p>

                {/* Progress Steps */}
                <div className="mt-8 w-full max-w-sm text-left">
                  <div className="rounded-xl border border-white/5 bg-slate-950/40 p-5 space-y-4">
                    {/* Step 1 */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-300">
                        Match selected
                      </span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-300">
                        Dataset loaded
                      </span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 animate-pulse">
                        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-white">
                        Evaluating tactical factors
                      </span>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 animate-pulse">
                        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-white">
                        Generating tactical lesson
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {explainError && !explainLoading && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">
                <p className="font-medium">Unable to process your request</p>
                <p className="mt-1 text-sm text-rose-300/80">{explainError}</p>
              </div>
            )}

            {explainResult && !explainLoading && (
              <div className="space-y-6">
                {/* Card 1: Tactical Verdict */}
                <article className="rounded-2xl border border-white/10 bg-linear-to-br from-white/6 to-white/2 p-6 backdrop-blur-xl md:p-8">
                  <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-400 font-sans">
                    Tactical Verdict
                  </h3>
                  <p className="text-lg leading-relaxed text-slate-100 font-medium">
                    {explainResult.verdict}
                  </p>
                </article>

                {/* Card 2: Key Tactical Factors */}
                <section>
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400 font-sans">
                    Key Tactical Factors
                  </h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    {explainResult.causalFactors.map((factor, idx) => (
                      <article
                        key={idx}
                        className="rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-xl flex gap-4 items-start"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 border border-white/10 text-xs font-mono font-semibold text-slate-300">
                          {idx + 1}
                        </div>
                        <p className="text-sm leading-relaxed text-slate-300">
                          {factor}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>

                {/* Card 3: Hidden Tactical Insight */}
                <article className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 backdrop-blur-xl md:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mr-6 -mt-6 h-24 w-24 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />
                  <div className="mb-3 flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-300 font-sans">
                      Hidden Tactical Insight & Lesson
                    </h3>
                  </div>
                  <p className="text-base leading-relaxed text-emerald-100 font-medium italic">
                    &ldquo;{explainResult.hiddenInsight}&rdquo;
                  </p>
                </article>
              </div>
            )}
          </div>
        </section>

        {/* VAR Decision Explainer Section */}
        <section className="mt-24 border-t border-white/10 pt-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              VAR Decision Explainer
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-slate-400">
              Understand how real football decisions are reviewed and why fans often misunderstand them.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-xl md:p-8">
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:items-end">
              <div>
                <label htmlFor="var-match-select" className="mb-3 block text-sm font-medium text-slate-300 font-sans">
                  Select historic match
                </label>
                <select
                  id="var-match-select"
                  value={selectedVarMatchId}
                  onChange={(e) => setSelectedVarMatchId(e.target.value)}
                  disabled={varLoading}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 p-4 text-base text-slate-100 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50 font-sans"
                >
                  <option value="argentina-france-2022-final">Argentina vs France (2022 Final)</option>
                </select>
              </div>

              <div>
                <label htmlFor="var-incident-select" className="mb-3 block text-sm font-medium text-slate-300 font-sans">
                  Select VAR incident
                </label>
                <select
                  id="var-incident-select"
                  value={selectedVarIncidentId}
                  onChange={(e) => setSelectedVarIncidentId(e.target.value)}
                  disabled={varLoading}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 p-4 text-base text-slate-100 focus:border-emerald-400/50 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-50 font-sans"
                >
                  <option value="af2022-var-1">Di Maria Penalty</option>
                  <option value="af2022-var-2">Kolo Muani Penalty</option>
                  <option value="af2022-var-3">Montiel Handball Penalty</option>
                </select>
              </div>

              <button
                onClick={explainVarDecision}
                disabled={varLoading}
                className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-emerald-400 to-sky-500 px-8 py-4 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:shadow-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-50 h-14.5 sm:col-span-2 md:col-span-1"
              >
                {varLoading ? "Analyzing…" : "Explain VAR Decision"}
                <svg className="h-4 w-4 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M13 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          <div ref={varResultsRef} className="mt-10">
            {varLoading && (
              <div className="rounded-2xl border border-white/10 bg-white/3 p-8 backdrop-blur-xl flex flex-col items-center text-center">
                {/* Animated Spinner */}
                <div className="relative flex h-16 w-16 items-center justify-center mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-800/50" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-emerald-400 border-r-sky-500 animate-spin" />
                </div>

                <h3 className="text-xl font-bold tracking-tight text-white md:text-2xl">
                  IBM Granite is reviewing the incident...
                </h3>
                <p className="mt-2 max-w-md text-sm text-slate-400">
                  Checking Laws of the Game, evaluating camera alignments, and formatting final decisions.
                </p>

                {/* Progress Steps */}
                <div className="mt-8 w-full max-w-sm text-left">
                  <div className="rounded-xl border border-white/5 bg-slate-950/40 p-5 space-y-4">
                    {/* Step 1 */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-300">
                        Incident selected
                      </span>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-slate-300">
                        Match data loaded
                      </span>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 animate-pulse">
                        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-white">
                        Evaluating Laws of the Game
                      </span>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 animate-pulse">
                        <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H17" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-white">
                        Building educational explanation
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {varError && !varLoading && (
              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">
                <p className="font-medium">VAR review explanation failed</p>
                <p className="mt-1 text-sm text-rose-300/80">{varError}</p>
              </div>
            )}

            {varResult && !varLoading && (
              <div className="space-y-6 font-sans">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Card 1: Rule Applied */}
                  <article className="rounded-2xl border border-white/10 bg-linear-to-br from-white/6 to-white/2 p-6 backdrop-blur-xl md:p-8">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                      Rule Applied
                    </h3>
                    <p className="text-base leading-relaxed text-slate-200 font-medium">
                      {varResult.lawApplied}
                    </p>
                  </article>

                  {/* Card 3: Review Reason */}
                  <article className="rounded-2xl border border-white/10 bg-linear-to-br from-white/6 to-white/2 p-6 backdrop-blur-xl md:p-8">
                    <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-sky-400">
                      Review Reason
                    </h3>
                    <p className="text-base leading-relaxed text-slate-200 font-medium">
                      {varResult.reviewReason}
                    </p>
                  </article>
                </div>

                {/* Card 2: Decision Logic */}
                <section>
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Decision Logic
                  </h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    {varResult.decisionLogic.map((logic, idx) => (
                      <article
                        key={idx}
                        className="rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-xl flex gap-4 items-start"
                      >
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 border border-white/10 text-xs font-mono font-semibold text-slate-300">
                          {idx + 1}
                        </div>
                        <p className="text-sm leading-relaxed text-slate-300">
                          {logic}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>

                <div className="grid gap-6 md:grid-cols-3">
                  {/* Card 4: Confidence Level */}
                  <article className="rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-xl flex flex-col justify-between h-full md:col-span-1">
                    <div>
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-amber-400">
                        Confidence Level
                      </h3>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        {varResult.confidenceLevel}
                      </span>
                    </div>
                  </article>

                  {/* Card 5: Common Fan Misunderstanding & Educational Takeaway (Strongest Visual Emphasis) */}
                  <article className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-6 backdrop-blur-xl md:p-8 relative overflow-hidden md:col-span-2 shadow-lg shadow-emerald-500/5">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 h-28 w-28 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
                    <div className="mb-4 flex items-center gap-2">
                      <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <h3 className="text-sm font-bold tracking-tight text-emerald-300">
                        Misconception & Takeaway
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {(() => {
                        const text = varResult.confidenceReason;
                        const misIdx = text.indexOf("COMMON MISUNDERSTANDING:");
                        const edIdx = text.indexOf("EDUCATIONAL TAKEAWAY:");
                        if (misIdx !== -1 && edIdx !== -1) {
                          const commonText = text.substring(misIdx + "COMMON MISUNDERSTANDING:".length, edIdx).trim();
                          const edText = text.substring(edIdx + "EDUCATIONAL TAKEAWAY:".length).trim();
                          return (
                            <>
                              <div>
                                <span className="block text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                                  Common Fan Misunderstanding
                                </span>
                                <p className="text-sm leading-relaxed text-emerald-100 font-medium">
                                  {commonText}
                                </p>
                              </div>
                              <div className="border-t border-emerald-500/20 pt-3">
                                <span className="block text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1">
                                  Educational Takeaway
                                </span>
                                <p className="text-sm leading-relaxed text-emerald-100 font-medium">
                                  {edText}
                                </p>
                              </div>
                            </>
                          );
                        }
                        return (
                          <p className="text-sm leading-relaxed text-emerald-100 font-medium">
                            {text}
                          </p>
                        );
                      })()}
                    </div>
                  </article>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mt-24">
          <div className="text-center">
            <h3 className="text-2xl font-bold tracking-tight md:text-3xl">
              How MatchMind Works
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
              MatchMind uses IBM Granite to identify misleading football beliefs and explain the deeper tactical reality behind them.
            </p>
          </div>

          <div className="relative mt-12">
            <div className="grid gap-6 grid-cols-1 md:grid-cols-5">
              {HOW_IT_WORKS_STEPS.map((step, i) => (
                <div
                  key={step.title}
                  className="relative flex flex-col items-center text-center p-5 rounded-2xl border border-white/10 bg-white/3 backdrop-blur-xl hover:border-emerald-500/20 hover:bg-white/5 transition duration-300 h-full"
                >
                  {/* Step number badge */}
                  <div className="absolute -top-3 left-4 rounded-full bg-slate-950 border border-white/10 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-400">
                    0{i + 1}
                  </div>

                  {/* Icon container */}
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-inner">
                    {step.icon}
                  </div>

                  {/* Title */}
                  <h4 className="font-semibold text-sm text-white tracking-tight">
                    {step.title}
                  </h4>

                  {/* Description */}
                  <p className="mt-2 text-xs leading-relaxed text-slate-400">
                    {step.desc}
                  </p>

                  {/* Right Arrow on Desktop */}
                  {i < HOW_IT_WORKS_STEPS.length - 1 && (
                    <div className="hidden md:flex absolute left-full top-1/2 -translate-y-1/2 w-6 h-6 z-20 items-center justify-center">
                      <svg className="h-5 w-5 text-slate-600/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}

                  {/* Down Arrow on Mobile */}
                  {i < HOW_IT_WORKS_STEPS.length - 1 && (
                    <div className="flex md:hidden absolute top-full left-1/2 -translate-x-1/2 w-6 h-6 z-20 items-center justify-center">
                      <svg className="h-5 w-5 text-slate-600/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-24">
          <h3 className="text-center text-2xl font-bold tracking-tight md:text-3xl">
            Why MatchMind
          </h3>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-400">
            Most football tools explain what happened. MatchMind explains why fans misread what happened.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              {
                t: "Detects tactical bias",
                d: "Catches the surface-level metrics fans over-weight — possession, corners, raw shots.",
              },
              {
                t: "Powered by IBM Granite",
                d: "Granite reasoning grounds every explanation in tactical context, not vibes.",
              },
              {
                t: "Educational by design",
                d: "Every detection ships with the deeper reality and historical evidence.",
              },
            ].map((f) => (
              <div
                key={t_key(f.t)}
                className="rounded-2xl border border-white/10 bg-white/3 p-6 backdrop-blur-xl"
              >
                <h4 className="font-semibold text-white">{f.t}</h4>
                <p className="mt-2 text-sm text-slate-400">{f.d}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="mt-24 border-t border-white/10 pt-8 text-center text-xs text-slate-500">
          MatchMind · Built for the IBM SkillsBuild AI Builders Challenge · By Om Karkele
        </footer>
      </main>
    </div>
  );
}

function t_key(s: string) {
  return s.toLowerCase().replace(/\s+/g, "-");
}
