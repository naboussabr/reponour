import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  getDay,
} from "date-fns";
import { fr } from "date-fns/locale";

export const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type WeekdayKey = (typeof WEEKDAY_KEYS)[number];

export const WEEKDAY_LABELS: Record<WeekdayKey, string> = {
  mon: "Lundi",
  tue: "Mardi",
  wed: "Mercredi",
  thu: "Jeudi",
  fri: "Vendredi",
  sat: "Samedi",
  sun: "Dimanche",
};

// date-fns getDay(): 0=dimanche .. 6=samedi
const DAY_INDEX_TO_KEY: WeekdayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function weekdayKeyForDate(date: Date): WeekdayKey {
  return DAY_INDEX_TO_KEY[getDay(date)];
}

export function daysInMonth(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month - 1, 1));
  const end = endOfMonth(start);
  return eachDayOfInterval({ start, end });
}

export function toDateKey(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function monthLabel(year: number, month: number): string {
  const d = new Date(year, month - 1, 1);
  return format(d, "MMMM yyyy", { locale: fr });
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Present", color: "#16a34a", bg: "#dcfce7" },
  { value: "ABSENT", label: "Absent (non justifie)", color: "#dc2626", bg: "#fee2e2" },
  { value: "CONGE", label: "Conge", color: "#2563eb", bg: "#dbeafe" },
  { value: "FERIE", label: "Jour ferie", color: "#7c3aed", bg: "#ede9fe" },
  { value: "MALADIE", label: "Maladie", color: "#ea580c", bg: "#ffedd5" },
] as const;

export type AttendanceStatus = (typeof STATUS_OPTIONS)[number]["value"];

export function statusMeta(status: string) {
  return STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
}

export function currentYearMonth(): { year: number; month: number } {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}
