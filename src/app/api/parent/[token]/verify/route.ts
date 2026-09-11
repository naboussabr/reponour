import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createParentSession } from "@/lib/auth";

const schema = z.object({ pin: z.string().min(4).max(6) });

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Code invalide." }, { status: 400 });
  }

  const child = await prisma.child.findUnique({ where: { accessToken: params.token } });
  if (!child || !child.active) {
    return NextResponse.json({ error: "Lien invalide." }, { status: 404 });
  }

  if (child.accessPin !== parsed.data.pin) {
    return NextResponse.json({ error: "Code PIN incorrect." }, { status: 401 });
  }

  await createParentSession(child.id);
  return NextResponse.json({ ok: true });
}
