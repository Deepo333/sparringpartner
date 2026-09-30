"use client";

import { useEffect, useState } from "react";

// Shows a timestamp in the phone's own time zone (the server runs on UTC).
export function LocalTime({ iso, mode = "datetime" }: { iso: string; mode?: "datetime" | "time" }) {
  const [text, setText] = useState("");
  useEffect(() => {
    const d = new Date(iso);
    setText(
      mode === "time"
        ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })
        : d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
    );
  }, [iso, mode]);
  return <time dateTime={iso}>{text}</time>;
}
