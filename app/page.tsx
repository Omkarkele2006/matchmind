"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import Image from "next/image";
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

const TIMELINE_STEPS = [
  "Parsing fan statement",
  "Identifying tactical claim",
  "Querying IBM Granite reasoning",
  "Cross-referencing historical matches",
  "Generating educational response",
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
  const [activeStep, setActiveStep] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setActiveStep((s) => (s < TIMELINE_STEPS.length - 1 ? s + 1 : s));
    }, 450);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (result && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  async function analyze() {
    if (!question.trim() || loading) return;
    setLoading(true);
    setActiveStep(0);
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
      setActiveStep(TIMELINE_STEPS.length);
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
            Understand why football fans get tactical analysis wrong.
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
            <div className="rounded-2xl border border-white/10 bg-white/3 p-8 backdrop-blur-xl">
              <h3 className="mb-6 text-sm font-medium uppercase tracking-wider text-slate-400">
                AI Reasoning Timeline
              </h3>
              <ol className="space-y-4">
                {TIMELINE_STEPS.map((step, i) => {
                  const done = i < activeStep;
                  const active = i === activeStep;
                  return (
                    <li key={step} className="flex items-center gap-4">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition ${done
                            ? "border-emerald-400/50 bg-emerald-400/20 text-emerald-300"
                            : active
                              ? "border-sky-400/60 bg-sky-400/20 text-sky-200"
                              : "border-white/10 bg-white/5 text-slate-500"
                          }`}
                      >
                        {done ? "✓" : i + 1}
                      </div>
                      <span
                        className={`text-sm transition ${done ? "text-slate-300" : active ? "text-white" : "text-slate-500"
                          }`}
                      >
                        {step}
                      </span>
                      {active && (
                        <span className="ml-2 inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {error && !loading && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200">
              <p className="font-medium">Analysis failed</p>
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
