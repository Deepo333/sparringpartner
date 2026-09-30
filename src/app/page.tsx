import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  const active = await prisma.session.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, topic: true },
  });

  return (
    <main className="page narrow">
      <div className="hero">
        <div className="alien" aria-hidden>👽</div>
        <h1>Sparring Partner</h1>
        <p className="tagline">Don&apos;t just tell me what I believe. Make me defend it.</p>
      </div>

      <div className="stack">
        <Link href="/new" className="btn primary big">New Session</Link>
        <Link href="/history" className="btn big">History</Link>
        {active && (
          <Link href={`/session/${active.id}`} className="resume card">
            <span className="muted small">Resume</span>
            <span>{active.topic}</span>
          </Link>
        )}
      </div>
    </main>
  );
}
