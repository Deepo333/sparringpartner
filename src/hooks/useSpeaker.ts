"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Browser text-to-speech. Text arrives in pieces while the AI is still
// generating; we speak each sentence as soon as it's complete so you hear the
// reply sooner. Short utterances also avoid iOS/Chrome cutting long ones off.

const SENTENCE_END = /[^.!?]+[.!?]+["')\]]*\s+/g;

export function useSpeaker(options: { muted: boolean; onFinished: () => void }) {
  const [speaking, setSpeaking] = useState(false);
  const bufferRef = useRef("");
  const pendingRef = useRef(0);
  const flushedRef = useRef(true);
  const activeRef = useRef(false); // false once a reply is finished or cut off
  // Bumped whenever queued audio is thrown away, so late "ended" events from
  // cancelled utterances are ignored.
  const genRef = useRef(0);
  const mutedRef = useRef(options.muted);
  const onFinishedRef = useRef(options.onFinished);
  mutedRef.current = options.muted;
  onFinishedRef.current = options.onFinished;

  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const checkDone = useCallback(() => {
    if (activeRef.current && flushedRef.current && pendingRef.current === 0) {
      activeRef.current = false;
      setSpeaking(false);
      onFinishedRef.current();
    }
  }, []);

  const say = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean || !supported || mutedRef.current) return;
      const u = new SpeechSynthesisUtterance(clean);
      u.rate = 1.05;
      pendingRef.current += 1;
      setSpeaking(true);
      const gen = genRef.current;
      const done = () => {
        if (gen !== genRef.current) return;
        pendingRef.current = Math.max(0, pendingRef.current - 1);
        checkDone();
      };
      u.onend = done;
      u.onerror = done;
      window.speechSynthesis.speak(u);
    },
    [supported, checkDone],
  );

  // iOS only allows speech that starts from a tap. Call this inside a tap
  // handler (e.g. Send) so replies that arrive a few seconds later can play.
  const prime = useCallback(() => {
    if (!supported || mutedRef.current) return;
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    window.speechSynthesis.speak(u);
  }, [supported]);

  // Start of a new AI reply.
  const begin = useCallback(() => {
    bufferRef.current = "";
    flushedRef.current = false;
    activeRef.current = true;
    genRef.current += 1;
  }, []);

  // A new piece of reply text arrived.
  const feed = useCallback(
    (delta: string) => {
      if (!activeRef.current) return;
      bufferRef.current += delta;
      let lastEnd = 0;
      for (const m of bufferRef.current.matchAll(SENTENCE_END)) {
        say(m[0]);
        lastEnd = (m.index ?? 0) + m[0].length;
      }
      bufferRef.current = bufferRef.current.slice(lastEnd);
    },
    [say],
  );

  // The reply is complete: speak whatever is left.
  const end = useCallback(() => {
    if (!activeRef.current) return;
    say(bufferRef.current);
    bufferRef.current = "";
    flushedRef.current = true;
    checkDone();
  }, [say, checkDone]);

  // Stop this reply for good (the user cut in). Returns true if the AI was
  // still mid-reply. onFinished is NOT called; the caller records the time.
  const cancel = useCallback((): boolean => {
    const wasActive = activeRef.current;
    activeRef.current = false;
    genRef.current += 1;
    bufferRef.current = "";
    pendingRef.current = 0;
    flushedRef.current = true;
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
    return wasActive;
  }, [supported]);

  // Stop the audio but let the reply keep streaming silently (used by mute).
  // onFinished still fires when the text finishes.
  const silence = useCallback(() => {
    genRef.current += 1;
    pendingRef.current = 0;
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
    checkDone();
  }, [supported, checkDone]);

  useEffect(() => () => {
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  return { supported, speaking, prime, begin, feed, end, cancel, silence };
}
