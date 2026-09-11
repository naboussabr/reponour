import type { Attendance, Contract } from "@prisma/client";
import { weekdayKeyForDate, WeekdayKey } from "./dates";

export type WeeklySchedule = Partial<Record<WeekdayKey, number>>;

export function parseWeeklySchedule(json: string): WeeklySchedule {
  try {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object") return parsed as WeeklySchedule;
    return {};
  } catch {
    return {};
  }
}

export function scheduledHoursFor(schedule: WeeklySchedule, date: Date): number {
  const key = weekdayKeyForDate(date);
  return schedule[key] ?? 0;
}

export type InvoiceBreakdown = {
  billingMode: string;
  daysPresent: number;
  hoursTotal: number;
  hourlyRate: number;
  gardeFee: number;
  gardeDetail: string;
  mealDays: number;
  mealRate: number;
  mealFee: number;
  maintenanceDays: number;
  maintenanceRate: number;
  maintenanceFee: number;
  maintenanceIsMonthly: boolean;
  congeDays: number;
  absentDays: number;
  ferieDays: number;
  maladieDays: number;
  totalFee: number;
};

export function computeInvoice(
  contract: Contract,
  attendances: Attendance[]
): InvoiceBreakdown {
  const schedule = parseWeeklySchedule(contract.weeklySchedule);

  const presentDays = attendances.filter((a) => a.status === "PRESENT");
  const absentDays = attendances.filter((a) => a.status === "ABSENT");
  const congeDays = attendances.filter((a) => a.status === "CONGE");
  const ferieDays = attendances.filter((a) => a.status === "FERIE");
  const maladieDays = attendances.filter((a) => a.status === "MALADIE");

  const hoursTotal = presentDays.reduce((sum, a) => sum + a.hours, 0);
  const mealDays = presentDays.filter((a) => a.mealProvided).length;
  const maintenanceDays = presentDays.length;

  let gardeFee = 0;
  let gardeDetail = "";

  if (contract.billingMode === "MENSUALISE") {
    const baseSalary =
      contract.monthlySalary ?? contract.hourlyRate * (contract.monthlyHours ?? 0);

    const missedHours = absentDays.reduce(
      (sum, a) => sum + scheduledHoursFor(schedule, a.date),
      0
    );
    const deduction = missedHours * contract.hourlyRate;
    gardeFee = Math.max(0, baseSalary - deduction);
    gardeDetail =
      missedHours > 0
        ? `Mensualisation : ${baseSalary.toFixed(2)} EUR - ${missedHours}h d'absence non justifiee x ${contract.hourlyRate.toFixed(2)} EUR`
        : `Mensualisation : salaire de base fixe ${baseSalary.toFixed(2)} EUR`;
  } else {
    gardeFee = hoursTotal * contract.hourlyRate;
    gardeDetail = `${hoursTotal}h de garde x ${contract.hourlyRate.toFixed(2)} EUR/h`;
  }

  const mealFee = mealDays * contract.mealRate;

  const maintenanceIsMonthly =
    contract.maintenanceMonthly !== null && contract.maintenanceMonthly !== undefined;
  const maintenanceFee = maintenanceIsMonthly
    ? (contract.maintenanceMonthly as number)
    : maintenanceDays * contract.maintenanceRate;

  const totalFee = round2(gardeFee) + round2(mealFee) + round2(maintenanceFee);

  return {
    billingMode: contract.billingMode,
    daysPresent: presentDays.length,
    hoursTotal,
    hourlyRate: contract.hourlyRate,
    gardeFee: round2(gardeFee),
    gardeDetail,
    mealDays,
    mealRate: contract.mealRate,
    mealFee: round2(mealFee),
    maintenanceDays,
    maintenanceRate: contract.maintenanceRate,
    maintenanceFee: round2(maintenanceFee),
    maintenanceIsMonthly,
    congeDays: congeDays.length,
    absentDays: absentDays.length,
    ferieDays: ferieDays.length,
    maladieDays: maladieDays.length,
    totalFee: round2(totalFee),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
