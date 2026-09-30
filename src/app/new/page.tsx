"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AI_ROLE_EXAMPLES, DIFFICULTIES, DIFFICULTY_LABELS } from "@/lib/session-config";
import type { Difficulty } from "@prisma/client";

export default function NewSessionPage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [userPosition, setUserPosition] = useState("");
  const [aiRole, setAiRole] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("INTERMEDIATE");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = topic.trim() && userPosition.trim() && aiRole.trim();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, userPosition, aiRole, difficulty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't start the session");
      router.push(`/session/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start the session");
      setSubmitting(false);
    }
  };

  return (
    <main className="page narrow">
      <h1>New debate</h1>
      <form onSubmit={onSubmit} className="stack">
        <label className="field">
          <span>Topic</span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Is free will compatible with determinism?"
            maxLength={300}
          />
        </label>

        <label className="field">
          <span>Your position</span>
          <textarea
            value={userPosition}
            onChange={(e) => setUserPosition(e.target.value)}
            placeholder="State what you believe, in your own words."
            rows={3}
            maxLength={1000}
          />
        </label>

        <div className="field">
          <label htmlFor="aiRole">Who the AI plays</label>
          <input
            id="aiRole"
            value={aiRole}
            onChange={(e) => setAiRole(e.target.value)}
            placeholder="e.g. An atheist philosopher"
            maxLength={300}
          />
          <div className="chips">
            {AI_ROLE_EXAMPLES.map((ex) => (
              <button type="button" key={ex} className="chip" onClick={() => setAiRole(ex)}>
                {ex}
              </button>
            ))}
          </div>
        </div>

        <fieldset className="field">
          <legend>Difficulty</legend>
          <div className="segmented">
            {DIFFICULTIES.map((d) => (
              <button
                type="button"
                key={d}
                className={difficulty === d ? "on" : ""}
                aria-pressed={difficulty === d}
                onClick={() => setDifficulty(d)}
              >
                {DIFFICULTY_LABELS[d].label}
              </button>
            ))}
          </div>
          <p className="muted small">{DIFFICULTY_LABELS[difficulty].blurb}</p>
        </fieldset>

        {error && <p className="error">{error}</p>}
        <button className="btn primary big" type="submit" disabled={!ready || submitting}>
          {submitting ? "Starting…" : "Start debate"}
        </button>
      </form>
    </main>
  );
}
