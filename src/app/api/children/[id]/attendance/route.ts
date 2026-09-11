import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { parseDateKey } from "@/lib/dates";

const upsertSchema = z.object({
  date: z.string(), // yyyy-MM-dd
  status: z.enum(["PRESENT", "ABSENT", "CONGE", "FERIE", "MALADIE"]),
  hours: z.coerce.number().min(0).max(24).default(0),
  mealProvided: z.boolean().default(false),
  note: z.string().optional().nullable(),
});

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = Number(searchParams.get("year"));
  const month = Number(searchParams.get("month"));
  if (!year || !month) {
    return NextResponse.json({ error: "year et month requis." }, { status: 400 });
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const attendances = await prisma.attendance.findMany({
    where: { childId: params.id, date: { gte: start, lt: end } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json({ attendances });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Donnees invalides." }, { status: 400 });
  }

  const { date, status, hours, mealProvided, note } = parsed.data;
  const dateValue = parseDateKey(date);

  const attendance = await prisma.attendance.upsert({
    where: { childId_date: { childId: params.id, date: dateValue } },
    update: { status, hours, mealProvided, note: note || null },
    create: {
      childId: params.id,
      date: dateValue,
      status,
      hours,
      mealProvided,
      note: note || null,
    },
  });

  return NextResponse.json({ attendance });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date requise." }, { status: 400 });

  const dateValue = parseDateKey(date);
  await prisma.attendance
    .delete({ where: { childId_date: { childId: params.id, date: dateValue } } })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
