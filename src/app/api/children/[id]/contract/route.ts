import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

const contractSchema = z.object({
  billingMode: z.enum(["HORAIRE", "MENSUALISE"]),
  hourlyRate: z.coerce.number().min(0),
  monthlyHours: z.coerce.number().min(0).optional().nullable(),
  monthlySalary: z.coerce.number().min(0).optional().nullable(),
  mealRate: z.coerce.number().min(0),
  maintenanceRate: z.coerce.number().min(0),
  maintenanceMonthly: z.coerce.number().min(0).optional().nullable(),
  weeklySchedule: z.record(z.coerce.number().min(0).max(24)),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = contractSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Donnees invalides.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const c = parsed.data;

  const contract = await prisma.contract.upsert({
    where: { childId: params.id },
    update: {
      billingMode: c.billingMode,
      hourlyRate: c.hourlyRate,
      monthlyHours: c.monthlyHours ?? null,
      monthlySalary: c.monthlySalary ?? null,
      mealRate: c.mealRate,
      maintenanceRate: c.maintenanceRate,
      maintenanceMonthly: c.maintenanceMonthly ?? null,
      weeklySchedule: JSON.stringify(c.weeklySchedule ?? {}),
    },
    create: {
      childId: params.id,
      billingMode: c.billingMode,
      hourlyRate: c.hourlyRate,
      monthlyHours: c.monthlyHours ?? null,
      monthlySalary: c.monthlySalary ?? null,
      mealRate: c.mealRate,
      maintenanceRate: c.maintenanceRate,
      maintenanceMonthly: c.maintenanceMonthly ?? null,
      weeklySchedule: JSON.stringify(c.weeklySchedule ?? {}),
    },
  });

  return NextResponse.json({ contract });
}
