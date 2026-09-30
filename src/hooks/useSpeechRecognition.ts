"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Browser speech-to-text (Web Speech API). Works in iPhone Safari (iOS 14.5+,
// needs Siri & Dictation turned on) and Chrome. It can be unreliable, which is
// why the text box is always there as a fallback.

// Minimal typings: the Web Speech API isn't in TypeScript's DOM library.
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type RecognitionCtor = new () => Recognition;

function getCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone or speech recognition is blocked. In iPhone Settings → Safari → Microphone, allow access, and make sure Siri & Dictation is on.",
  "service-not-allowed": "Speech recognition isn't available. On iPhone, turn on Settings → Siri → Dictation (or Siri & Dictation).",
  "audio-capture": "No microphone was found.",
  network: "Speech recognition needs an internet connection.",
};

// onText receives the full text recognized in this listening session so far.
export function useSpeechRecognition(onText: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => setSupported(getCtor() !== null), []);
  useEffect(() => () => recRef.current?.abort(), []);

  const start = useCallback(() => {
    const Ctor = getCtor();
    if (!Ctor || recRef.current) return;
    setError(null);
    const rec = new Ctor();
    rec.lang = navigator.language || "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      // Rebuild from all results every time; appending causes duplicates on iOS.
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      onTextRef.current(text.replace(/\s+/g, " ").trim());
    };
    rec.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setError(ERROR_MESSAGES[e.error] ?? `Speech recognition error: ${e.error}`);
      }
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      recRef.current = null;
      setError("Couldn't start the microphone. Try again, or type instead.");
    }
  }, []);

  const stop = useCallback(() => recRef.current?.stop(), []);

  return { supported, listening, error, start, stop };
}
