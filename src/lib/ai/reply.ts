import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { Turn } from "@prisma/client";
import { anthropic } from "./client";
import { MODELS } from "./models";
import { buildSystemPrompt, getMode } from "@/lib/prompts/build";
import type { SessionConfig } from "@/lib/session-config";

export interface ReplyResult {
  text: string;
  model: string;
  stopReason: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
}

// The transcript is sent back as plain text each turn. It only ever grows at
// the end, so the prompt cache can reuse everything before the newest turn.
function toMessages(turns: Pick<Turn, "speaker" | "text">[]): Anthropic.Beta.BetaMessageParam[] {
  return turns.map((t) => ({
    role: t.speaker === "USER" ? "user" : "assistant",
    content: t.text,
  }));
}

// Streams the AI's next turn, calling onText with each new piece of text.
export async function streamReply(
  config: SessionConfig,
  turns: Pick<Turn, "speaker" | "text">[],
  onText: (delta: string) => void,
): Promise<ReplyResult> {
  const job = MODELS[getMode(config.activity).modelJob(config)];

  const stream = anthropic.beta.messages.stream({
    model: job.model,
    max_tokens: job.maxTokens,
    system: buildSystemPrompt(config).map((text) => ({ type: "text" as const, text })),
    messages: toMessages(turns),
    thinking: { type: "adaptive" },
    output_config: { effort: job.effort },
    // Cache the conversation so far; each new turn only pays full price for itself.
    cache_control: { type: "ephemeral" },
    // If the model's safety filters decline (possible on sensitive debate
    // topics), the API retries on Anthropic's recommended fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
  });

  let text = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      text += event.delta.text;
      onText(event.delta.text);
    }
  }
  const final = await stream.finalMessage();

  return {
    text,
    model: final.model,
    stopReason: final.stop_reason,
    inputTokens:
      final.usage.input_tokens +
      (final.usage.cache_read_input_tokens ?? 0) +
      (final.usage.cache_creation_input_tokens ?? 0),
    outputTokens: final.usage.output_tokens,
  };
}
