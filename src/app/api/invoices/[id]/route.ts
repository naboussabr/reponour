import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

const schema = z.object({
  status: z.enum(["BROUILLON", "ENVOYEE", "PAYEE"]),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Statut invalide." }, { status: 400 });

  const invoice = await prisma.invoice.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json({ invoice });
}
