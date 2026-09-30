import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { DEBATE_DEFAULTS, debateSetupSchema } from "@/lib/session-config";

// Create a new Debate session from the setup screen.
export async function POST(req: Request) {
  const parsed = debateSetupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid setup" }, { status: 400 });
  }
  const session = await prisma.session.create({
    data: { ...DEBATE_DEFAULTS, ...parsed.data },
    select: { id: true },
  });
  return NextResponse.json(session);
}
