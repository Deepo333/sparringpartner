import { notFound, redirect } from "next/navigation";
import { DebateRoom } from "@/components/DebateRoom";
import { prisma } from "@/lib/db";
import { DIFFICULTY_LABELS } from "@/lib/session-config";
import { toTurnDTO } from "@/lib/turn-dto";

export const dynamic = "force-dynamic";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await prisma.session.findUnique({
    where: { id },
    include: { turns: { orderBy: { index: "asc" } } },
  });
  if (!session) notFound();
  if (session.status === "ENDED") redirect(`/history/${id}`);

  return (
    <DebateRoom
      sessionId={session.id}
      topic={session.topic}
      userPosition={session.userPosition}
      aiRole={session.aiRole}
      difficultyLabel={DIFFICULTY_LABELS[session.difficulty].label}
      initialTurns={session.turns.map(toTurnDTO)}
    />
  );
}
