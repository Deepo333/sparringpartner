// Assembles the system prompt for a session:
//   [integrity core] + [mode layer]
// The mode layer reads whichever config axes it uses. Adding a mode in a
// later stage = write its layer and register it in MODES.

import type { Activity } from "@prisma/client";
import type { ModelJobName } from "@/lib/ai/models";
import type { SessionConfig } from "@/lib/session-config";
import { INTEGRITY_CORE } from "./integrity-core";
import { debateLayer } from "./modes/debate";

export interface ModeDefinition {
  label: string;
  layer: (config: SessionConfig) => string;
  modelJob: (config: SessionConfig) => ModelJobName;
}

// Only Debate exists in Stage 1. Reflective, Change My Mind, Learning, etc.
// register here in their stages (see docs/ROADMAP.md).
export const MODES: Partial<Record<Activity, ModeDefinition>> = {
  DEBATE: {
    label: "Debate",
    layer: debateLayer,
    modelJob: (c) => (c.difficulty === "ADVANCED" || c.difficulty === "EXPERT" ? "debateOpponentDeep" : "debateOpponent"),
  },
};

export function getMode(activity: Activity): ModeDefinition {
  const mode = MODES[activity];
  if (!mode) throw new Error(`Mode ${activity} isn't built yet`);
  return mode;
}

export function buildSystemPrompt(config: SessionConfig): string[] {
  return [INTEGRITY_CORE, getMode(config.activity).layer(config)];
}
