import type { TurnDTO } from "@/lib/turn-dto";
import { LocalTime } from "./LocalTime";

const INPUT_LABEL = { VOICE: "🎙 voice", VOICE_EDITED: "🎙 voice, edited", TEXT: "⌨ typed" } as const;

export function formatSeconds(ms: number): string {
  const s = ms / 1000;
  return `${s < 0 ? "−" : ""}${Math.abs(s).toFixed(1)}s`;
}

interface Props {
  turn: Pick<TurnDTO, "speaker" | "text"> & Partial<TurnDTO>;
  streaming?: boolean;
  pending?: boolean;
  showDetails?: boolean;
}

export function TurnBubble({ turn, streaming, pending, showDetails }: Props) {
  const isUser = turn.speaker === "USER";
  const edited = turn.inputMethod === "VOICE_EDITED" && turn.rawTranscript && turn.rawTranscript !== turn.text;
  return (
    <div className={`turn ${isUser ? "user" : "ai"} ${pending ? "pending" : ""}`}>
      <div className="turn-meta">
        <span>{isUser ? "You" : "👽 Opponent"}</span>
        {showDetails && turn.startedAt && (
          <span>
            <LocalTime iso={turn.startedAt} mode="time" />
          </span>
        )}
        {showDetails && isUser && turn.inputMethod && <span>{INPUT_LABEL[turn.inputMethod]}</span>}
        {showDetails && isUser && turn.responseTimeMs != null && (
          <span title="Time between the AI finishing and you starting">
            responded in {formatSeconds(turn.responseTimeMs)}
          </span>
        )}
        {showDetails && isUser && turn.interruptedAi && <span>cut in</span>}
      </div>
      <div className={`bubble ${streaming ? "streaming" : ""}`}>{turn.text}</div>
      {showDetails && edited && <div className="heard muted small">Heard: “{turn.rawTranscript}”</div>}
    </div>
  );
}
