import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { streamReply } from "@/lib/ai/reply";
import { configFromSession } from "@/lib/session-config";
import type { StreamEvent, TurnDTO } from "@/lib/turn-dto";
import { toTurnDTO } from "@/lib/turn-dto";

export const maxDuration = 60;

const userTurnSchema = z.object({
  text: z.string().trim().min(1).max(10000),
  startedAt: z.iso.datetime().nullable(),
  endedAt: z.iso.datetime(),
  responseTimeMs: z.number().int().nullable(),
  interruptedAi: z.boolean(),
  inputMethod: z.enum(["VOICE", "VOICE_EDITED", "TEXT"]),
  rawTranscript: z.string().max(10000).nullable(),
});

// Omit userTurn to retry the AI's reply after a failure.
const bodySchema = z.object({ userTurn: userTurnSchema.optional() });

// Saves the user's turn (verbatim), then streams the AI's reply back as
// newline-delimited JSON and saves it too once it's complete.
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid turn" }, { status: 400 });

  const session = await prisma.session.findUnique({
    where: { id },
    include: { turns: { orderBy: { index: "asc" } } },
  });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.status !== "ACTIVE") return NextResponse.json({ error: "This session has ended" }, { status: 409 });

  const turns = [...session.turns];
  let savedUserTurn: TurnDTO | null = null;

  const u = parsed.data.userTurn;
  if (u) {
    const turn = await prisma.turn.create({
      data: {
        sessionId: id,
        index: turns.length,
        speaker: "USER",
        text: u.text,
        startedAt: u.startedAt ? new Date(u.startedAt) : null,
        endedAt: new Date(u.endedAt),
        responseTimeMs: u.responseTimeMs,
        interruptedAi: u.interruptedAi,
        inputMethod: u.inputMethod,
        rawTranscript: u.rawTranscript,
      },
    });
    turns.push(turn);
    savedUserTurn = toTurnDTO(turn);
  }

  if (turns.length === 0 || turns[turns.length - 1].speaker !== "USER") {
    return NextResponse.json({ error: "Nothing to reply to" }, { status: 400 });
  }

  const config = configFromSession(session);
  const encoder = new TextEncoder();

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true;
      const send = (e: StreamEvent) => {
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
        } catch {
          open = false; // the phone disconnected; keep going so the turn still gets saved
        }
      };

      if (savedUserTurn) send({ type: "user_turn", turn: savedUserTurn });

      const startedAt = new Date();
      try {
        const result = await streamReply(config, turns, (text) => send({ type: "delta", text }));

        if (!result.text.trim()) {
          send({
            type: "error",
            message:
              result.stopReason === "refusal"
                ? "The AI declined to respond to that. Try rephrasing your point."
                : "The AI returned an empty reply. Tap retry.",
          });
        } else {
          const aiTurn = await prisma.turn.create({
            data: {
              sessionId: id,
              index: turns.length,
              speaker: "AI",
              text: result.text,
              startedAt,
              endedAt: new Date(),
              model: result.model,
              stopReason: result.stopReason,
              inputTokens: result.inputTokens,
              outputTokens: result.outputTokens,
            },
          });
          send({ type: "ai_turn", turn: toTurnDTO(aiTurn) });
        }
      } catch (err) {
        console.error("Reply failed", err);
        send({ type: "error", message: describeError(err) });
      } finally {
        if (open) controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function describeError(err: unknown): string {
  if (!process.env.ANTHROPIC_API_KEY) return "ANTHROPIC_API_KEY isn't set. Add it in Vercel → Settings → Environment Variables, then redeploy.";
  if (err instanceof Anthropic.AuthenticationError) return "The Anthropic API key is missing or invalid. Check ANTHROPIC_API_KEY in Vercel.";
  if (err instanceof Anthropic.RateLimitError) return "Rate limited by the AI provider. Wait a moment, then tap retry.";
  if (err instanceof Anthropic.APIError) return `The AI service returned an error (${err.status ?? "network"}). Tap retry.`;
  return "Something went wrong generating the reply. Tap retry.";
}
