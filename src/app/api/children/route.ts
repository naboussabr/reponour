import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";

const contractSchema = z.object({
  billingMode: z.enum(["HORAIRE", "MENSUALISE"]).default("HORAIRE"),
  hourlyRate: z.coerce.number().min(0).default(0),
  monthlyHours: z.coerce.number().min(0).optional().nullable(),
  monthlySalary: z.coerce.number().min(0).optional().nullable(),
  mealRate: z.coerce.number().min(0).default(0),
  maintenanceRate: z.coerce.number().min(0).default(0),
  maintenanceMonthly: z.coerce.number().min(0).optional().nullable(),
  weeklySchedule: z.record(z.coerce.number().min(0).max(24)).default({}),
});

const childSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  birthDate: z.string().optional().nullable(),
  parentName: z.string().min(1),
  parentEmail: z.string().email().optional().or(z.literal("")).nullable(),
  parentPhone: z.string().optional().nullable(),
  contract: contractSchema,
});

function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ error: "Non authentifie." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = childSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Donnees invalides.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { contract, ...childData } = parsed.data;

  const child = await prisma.child.create({
    data: {
      firstName: childData.firstName,
      lastName: childData.lastName,
      birthDate: childData.birthDate ? new Date(childData.birthDate) : null,
      parentName: childData.parentName,
      parentEmail: childData.parentEmail || null,
      parentPhone: childData.parentPhone || null,
      accessPin: generatePin(),
      contract: {
        create: {
          billingMode: contract.billingMode,
          hourlyRate: contract.hourlyRate,
          monthlyHours: contract.monthlyHours ?? null,
          monthlySalary: contract.monthlySalary ?? null,
          mealRate: contract.mealRate,
          maintenanceRate: contract.maintenanceRate,
          maintenanceMonthly: contract.maintenanceMonthly ?? null,
          weeklySchedule: JSON.stringify(contract.weeklySchedule ?? {}),
        },
      },
    },
    include: { contract: true },
  });

  return NextResponse.json({ child });
}
