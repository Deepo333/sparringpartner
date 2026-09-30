import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// End a session. Its transcript is already saved turn by turn; this just
// marks it finished. (Stage 2's coach report will hook in here.)
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const result = await prisma.session.updateMany({
    where: { id, status: "ACTIVE" },
    data: { status: "ENDED", endedAt: new Date() },
  });
  if (result.count === 0) {
    const exists = await prisma.session.count({ where: { id } });
    if (!exists) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
