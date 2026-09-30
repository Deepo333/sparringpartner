import type { Turn } from "@prisma/client";

// The shape of a turn sent to the browser (dates as ISO strings).
export interface TurnDTO {
  id: string;
  index: number;
  speaker: "USER" | "AI";
  text: string;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  responseTimeMs: number | null;
  interruptedAi: boolean | null;
  rawTranscript: string | null;
  inputMethod: "VOICE" | "VOICE_EDITED" | "TEXT" | null;
}

export function toTurnDTO(t: Turn): TurnDTO {
  return {
    id: t.id,
    index: t.index,
    speaker: t.speaker,
    text: t.text,
    createdAt: t.createdAt.toISOString(),
    startedAt: t.startedAt?.toISOString() ?? null,
    endedAt: t.endedAt?.toISOString() ?? null,
    responseTimeMs: t.responseTimeMs,
    interruptedAi: t.interruptedAi,
    rawTranscript: t.rawTranscript,
    inputMethod: t.inputMethod,
  };
}

// Events streamed from POST /api/sessions/[id]/turns, one JSON object per line.
export type StreamEvent =
  | { type: "user_turn"; turn: TurnDTO }
  | { type: "delta"; text: string }
  | { type: "ai_turn"; turn: TurnDTO }
  | { type: "error"; message: string };
