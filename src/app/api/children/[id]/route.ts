import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

const updateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  birthDate: z.string().optional().nullable(),
  parentName: z.string().min(1).optional(),
  parentEmail: z.string().email().optional().or(z.literal("")).nullable(),
  parentPhone: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });

  const child = await prisma.child.findUnique({
    where: { id: params.id },
    include: { contract: true },
  });
  if (!child) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  return NextResponse.json({ child });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Donnees invalides." }, { status: 400 });
  }

  const data = parsed.data;
  const child = await prisma.child.update({
    where: { id: params.id },
    data: {
      ...data,
      birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
      parentEmail: data.parentEmail === "" ? null : data.parentEmail ?? undefined,
    },
    include: { contract: true },
  });

  return NextResponse.json({ child });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });

  await prisma.child.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
