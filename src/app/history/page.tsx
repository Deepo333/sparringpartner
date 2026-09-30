import Link from "next/link";
import { LocalTime } from "@/components/LocalTime";
import { prisma } from "@/lib/db";
import { DIFFICULTY_LABELS } from "@/lib/session-config";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      topic: true,
      aiRole: true,
      difficulty: true,
      status: true,
      createdAt: true,
      _count: { select: { turns: true } },
    },
  });

  return (
    <main className="page narrow">
      <h1>History</h1>
      {sessions.length === 0 ? (
        <div className="card center">
          <p className="muted">No sessions yet.</p>
          <Link href="/new" className="btn primary">Start your first</Link>
        </div>
      ) : (
        <ul className="list">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link href={s.status === "ACTIVE" ? `/session/${s.id}` : `/history/${s.id}`} className="card list-item">
                <div className="list-top">
                  <strong>{s.topic}</strong>
                  {s.status === "ACTIVE" && <span className="badge">In progress</span>}
                </div>
                <span className="muted small">
                  vs. {s.aiRole} · {DIFFICULTY_LABELS[s.difficulty].label} · {s._count.turns} turns
                </span>
                <span className="muted small">
                  <LocalTime iso={s.createdAt.toISOString()} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
