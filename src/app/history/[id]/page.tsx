import Link from "next/link";
import { notFound } from "next/navigation";
import { LocalTime } from "@/components/LocalTime";
import { TurnBubble } from "@/components/TurnBubble";
import { prisma } from "@/lib/db";
import { DIFFICULTY_LABELS } from "@/lib/session-config";
import { toTurnDTO } from "@/lib/turn-dto";

export const dynamic = "force-dynamic";

export default async function TranscriptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await prisma.session.findUnique({
    where: { id },
    include: { turns: { orderBy: { index: "asc" } } },
  });
  if (!session) notFound();

  const durationMin =
    session.endedAt ? Math.max(1, Math.round((session.endedAt.getTime() - session.createdAt.getTime()) / 60000)) : null;

  return (
    <main className="page narrow">
      <Link href="/history" className="back">← History</Link>
      <h1>{session.topic}</h1>

      <dl className="card setup-summary">
        <dt>Your position</dt>
        <dd>{session.userPosition}</dd>
        <dt>AI played</dt>
        <dd>{session.aiRole}</dd>
        <dt>Difficulty</dt>
        <dd>{DIFFICULTY_LABELS[session.difficulty].label}</dd>
        <dt>Started</dt>
        <dd>
          <LocalTime iso={session.createdAt.toISOString()} />
          {durationMin && ` · ${durationMin} min`}
        </dd>
      </dl>

      {session.status === "ACTIVE" && (
        <Link href={`/session/${session.id}`} className="btn primary">Continue this session</Link>
      )}

      {/* Stage 2: the coach report for this session will appear here. */}

      <h2>Transcript</h2>
      {session.turns.length === 0 ? (
        <p className="muted">No turns were recorded.</p>
      ) : (
        <section className="transcript static">
          {session.turns.map((t) => (
            <TurnBubble key={t.id} turn={toTurnDTO(t)} showDetails />
          ))}
        </section>
      )}
    </main>
  );
}
