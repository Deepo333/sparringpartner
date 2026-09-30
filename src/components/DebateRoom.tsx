"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeaker } from "@/hooks/useSpeaker";
import type { StreamEvent, TurnDTO } from "@/lib/turn-dto";
import { TurnBubble } from "./TurnBubble";

interface Props {
  sessionId: string;
  topic: string;
  userPosition: string;
  aiRole: string;
  difficultyLabel: string;
  initialTurns: TurnDTO[];
}

const MUTE_KEY = "sp_muted";

export function DebateRoom({ sessionId, topic, userPosition, aiRole, difficultyLabel, initialTurns }: Props) {
  const router = useRouter();
  const [turns, setTurns] = useState<TurnDTO[]>(initialTurns);
  const [streaming, setStreaming] = useState<string | null>(null);
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [muted, setMuted] = useState(false);

  // Timing and input-method bookkeeping for the turn being composed.
  const draftStartedAt = useRef<number | null>(null);
  const usedVoice = useRef(false);
  const recognizedDraft = useRef<string | null>(null);
  const voiceBase = useRef("");
  const interrupted = useRef(false);
  // When the AI's latest turn finished (voice ended, or text ended if muted).
  const aiFinishedAt = useRef<number | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setMuted(localStorage.getItem(MUTE_KEY) === "1");
    } catch {
      /* private browsing: default to sound on */
    }
  }, []);

  const speaker = useSpeaker({
    muted,
    onFinished: () => {
      aiFinishedAt.current = Date.now();
    },
  });

  const markStart = () => {
    if (draftStartedAt.current === null) draftStartedAt.current = Date.now();
  };

  // If the AI is still talking, stop it and record that the user cut in.
  const cutOffAi = () => {
    if (speaker.cancel()) {
      aiFinishedAt.current = Date.now();
      interrupted.current = true;
    }
  };

  const mic = useSpeechRecognition((text) => {
    const next = voiceBase.current ? `${voiceBase.current} ${text}` : text;
    recognizedDraft.current = next;
    setDraft(next);
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, streaming, pendingUser]);

  const requestReply = useCallback(
    async (userTurn?: Record<string, unknown> & { text: string }) => {
      setBusy(true);
      setError(null);
      if (userTurn) setPendingUser(userTurn.text);
      let gotUserTurn = !userTurn;
      let gotReply = false;

      try {
        const res = await fetch(`/api/sessions/${sessionId}/turns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userTurn ? { userTurn } : {}),
        });
        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error ?? `Request failed (${res.status})`);
        }

        aiFinishedAt.current = null;
        speaker.begin();
        if (!userTurn) setStreaming("");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffered = "";

        const handle = (e: StreamEvent) => {
          if (e.type === "user_turn") {
            gotUserTurn = true;
            setPendingUser(null);
            setTurns((t) => [...t, e.turn]);
            setStreaming("");
          } else if (e.type === "delta") {
            setStreaming((s) => (s ?? "") + e.text);
            speaker.feed(e.text);
          } else if (e.type === "ai_turn") {
            gotReply = true;
            setStreaming(null);
            setTurns((t) => [...t, e.turn]);
            speaker.end();
          } else if (e.type === "error") {
            setStreaming(null);
            speaker.cancel();
            setError(e.message);
          }
        };

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffered += decoder.decode(value, { stream: true });
          const lines = buffered.split("\n");
          buffered = lines.pop() ?? "";
          for (const line of lines) if (line.trim()) handle(JSON.parse(line) as StreamEvent);
        }
        if (buffered.trim()) handle(JSON.parse(buffered) as StreamEvent);

        if (!gotReply) {
          setStreaming(null);
          setError((prev) => prev ?? "The connection dropped. Reload the page to see if the reply was saved.");
        }
      } catch (err) {
        setStreaming(null);
        speaker.cancel();
        setError(err instanceof Error ? err.message : "Something went wrong.");
      } finally {
        // If the user's words never reached the server, give them back.
        if (!gotUserTurn && userTurn) setDraft(userTurn.text);
        setPendingUser(null);
        setBusy(false);
      }
    },
    [sessionId, speaker],
  );

  const onMic = () => {
    if (mic.listening) {
      mic.stop();
      return;
    }
    markStart();
    cutOffAi();
    voiceBase.current = draft.trim();
    usedVoice.current = true;
    mic.start();
  };

  const onSend = () => {
    const text = draft.trim();
    if (!text || busy) return;
    if (mic.listening) mic.stop();
    cutOffAi();
    speaker.prime(); // must run inside the tap so iPhone lets the reply speak

    const now = Date.now();
    const startedAt = draftStartedAt.current ?? now;
    const finished = aiFinishedAt.current;
    const inputMethod = !usedVoice.current
      ? "TEXT"
      : text === recognizedDraft.current?.trim()
        ? "VOICE"
        : "VOICE_EDITED";

    const userTurn = {
      text,
      startedAt: new Date(startedAt).toISOString(),
      endedAt: new Date(now).toISOString(),
      responseTimeMs: finished === null ? null : startedAt - finished,
      interruptedAi: interrupted.current,
      inputMethod,
      rawTranscript: usedVoice.current ? recognizedDraft.current : null,
    };

    setDraft("");
    draftStartedAt.current = null;
    usedVoice.current = false;
    recognizedDraft.current = null;
    voiceBase.current = "";
    interrupted.current = false;
    void requestReply(userTurn);
  };

  const onRetry = () => {
    speaker.prime();
    void requestReply();
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    try {
      localStorage.setItem(MUTE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
    if (next) speaker.silence();
  };

  const onEnd = async () => {
    if (!confirm("End this session? The full transcript is saved and you can read it in History.")) return;
    setEnding(true);
    if (mic.listening) mic.stop();
    speaker.cancel();
    const res = await fetch(`/api/sessions/${sessionId}/end`, { method: "POST" });
    if (res.ok) {
      router.push(`/history/${sessionId}`);
    } else {
      setEnding(false);
      setError("Couldn't end the session. Check your connection and try again.");
    }
  };

  const lastTurn = turns[turns.length - 1];
  const canRetry = !busy && pendingUser === null && lastTurn?.speaker === "USER";

  return (
    <div className="room">
      <header className="room-header">
        <div className="room-title">
          <h1>{topic}</h1>
          <p className="muted small">
            vs. {aiRole} · {difficultyLabel}
          </p>
        </div>
        <div className="room-actions">
          <button
            className="btn icon"
            onClick={toggleMute}
            aria-pressed={muted}
            aria-label={muted ? "Unmute AI voice" : "Mute AI voice"}
            title={muted ? "Unmute AI voice" : "Mute AI voice"}
          >
            {muted ? "🔇" : "🔊"}
          </button>
          <button className="btn danger small-btn" onClick={onEnd} disabled={ending || busy}>
            {ending ? "Saving…" : "End"}
          </button>
        </div>
      </header>

      <section className="transcript" aria-live="polite">
        {turns.length === 0 && pendingUser === null && (
          <div className="card opener">
            <div className="alien small-alien" aria-hidden>
              👽
            </div>
            <p>
              <strong>You open.</strong> Make your case for:
            </p>
            <blockquote>{userPosition}</blockquote>
            <p className="muted small">
              Tap the mic and speak, or type below. Your opponent ({aiRole}) will respond.
            </p>
          </div>
        )}

        {turns.map((t) => (
          <TurnBubble key={t.id} turn={t} />
        ))}
        {pendingUser !== null && <TurnBubble pending turn={{ speaker: "USER", text: pendingUser }} />}
        {streaming !== null && (
          <TurnBubble streaming turn={{ speaker: "AI", text: streaming || "…" }} />
        )}

        {error && (
          <div className="error-box" role="alert">
            <p>{error}</p>
            {canRetry && (
              <button className="btn small-btn" onClick={onRetry}>
                Retry reply
              </button>
            )}
          </div>
        )}
        {!error && canRetry && (
          <div className="center">
            <button className="btn small-btn" onClick={onRetry}>
              Get the AI&apos;s reply
            </button>
          </div>
        )}
        <div ref={bottomRef} />
      </section>

      <footer className="composer">
        {mic.error && <p className="error small">{mic.error}</p>}
        <textarea
          value={draft}
          onChange={(e) => {
            if (e.target.value) markStart();
            setDraft(e.target.value);
          }}
          placeholder={mic.listening ? "Listening… your words appear here" : "Type, or tap the mic to talk"}
          rows={3}
          aria-label="Your turn"
        />
        <div className="composer-row">
          {mic.supported ? (
            <button
              className={`btn mic ${mic.listening ? "listening" : ""}`}
              onClick={onMic}
              disabled={busy}
              aria-pressed={mic.listening}
            >
              {mic.listening ? "■ Stop" : "🎙 Talk"}
            </button>
          ) : (
            <span className="muted small">Voice input isn&apos;t available in this browser. Typing works.</span>
          )}
          <button className="btn primary" onClick={onSend} disabled={busy || !draft.trim()}>
            {busy ? "…" : "Send"}
          </button>
        </div>
        {mic.listening && <p className="muted small center">Tap Stop, check the text, then Send.</p>}
      </footer>
    </div>
  );
}
