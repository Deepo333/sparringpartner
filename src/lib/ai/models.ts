// The ONE place model choices live. Each "job" the app asks an AI to do gets
// its own entry, so later stages can use a different model per job (e.g. a
// cheaper model for quick checks, a stronger one for the coach report) by
// editing this file only.

export type Effort = "low" | "medium" | "high" | "xhigh" | "max";

export interface ModelJob {
  model: string;
  // How hard the model thinks before answering. Higher = better reasoning,
  // slower replies, more cost. Voice conversation needs short waits.
  effort: Effort;
  // Hard ceiling on tokens per reply (includes the model's hidden thinking).
  maxTokens: number;
}

export const MODELS = {
  // Stage 1: the live debate opponent.
  debateOpponent: {
    model: "claude-opus-5-5",
    effort: "low",
    maxTokens: 8000,
  },
  // Harder opponents get more thinking time. See effortForDifficulty().
  debateOpponentDeep: {
    model: "claude-opus-5-5",
    effort: "medium",
    maxTokens: 12000,
  },

  // Future jobs (not used yet). Uncomment and wire up in their stage.
  // coachReport:   { model: "claude-opus-5-5", effort: "high", maxTokens: 32000 },   // Stage 2
  // factCheck:     { model: "claude-opus-5-5", effort: "high", maxTokens: 16000 },   // Stage 5
  // quickClassify: { model: "claude-haiku-4-5", effort: "low", maxTokens: 1000 },    // later
} satisfies Record<string, ModelJob>;

export type ModelJobName = keyof typeof MODELS;
