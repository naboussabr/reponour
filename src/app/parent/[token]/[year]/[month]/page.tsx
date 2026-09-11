import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasParentSession } from "@/lib/auth";
import { computeInvoice } from "@/lib/billing";
import { daysInMonth, monthLabel, statusMeta, STATUS_OPTIONS, toDateKey } from "@/lib/dates";
import PrintButton from "./PrintButton";

export default async function ParentMonthPage({
  params,
}: {
  params: { token: string; year: string; month: string };
}) {
  const child = await prisma.child.findUnique({
    where: { accessToken: params.token },
    include: { contract: true },
  });
  if (!child || !child.active) notFound();

  const authorized = await hasParentSession(child.id);
  if (!authorized) redirect(`/parent/${params.token}`);

  const year = Number(params.year);
  const month = Number(params.month);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const attendances = await prisma.attendance.findMany({
    where: { childId: child.id, date: { gte: start, lt: end } },
  });

  const byDateKey = new Map(attendances.map((a) => [toDateKey(new Date(a.date)), a]));
  const days = daysInMonth(year, month);
  const firstDayOffset = (days[0].getDay() + 6) % 7;

  const breakdown = child.contract ? computeInvoice(child.contract, attendances) : null;

  const prevMonth = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };

  return (
    <main className="min-h-screen">
      <header className="border-b border-stone-200 bg-white no-print">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <h1 className="font-bold text-stone-900">
            Espace de {child.firstName} {child.lastName}
          </h1>
          <p className="text-xs text-stone-400">Consultation en lecture seule</p>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between no-print">
          <Link
            href={`/parent/${params.token}/${prevMonth.y}/${prevMonth.m}`}
            className="btn-secondary"
          >
            &larr; Mois precedent
          </Link>
          <h2 className="font-medium capitalize">{monthLabel(year, month)}</h2>
          <Link
            href={`/parent/${params.token}/${nextMonth.y}/${nextMonth.m}`}
            className="btn-secondary"
          >
            Mois suivant &rarr;
          </Link>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-stone-900 mb-4">Presences</h3>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-stone-400 mb-1">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const key = toDateKey(day);
              const attendance = byDateKey.get(key);
              const meta = attendance ? statusMeta(attendance.status) : null;
              return (
                <div
                  key={key}
                  className="aspect-square rounded-lg border border-stone-200 text-sm flex flex-col items-center justify-center"
                  style={meta ? { backgroundColor: meta.bg, color: meta.color } : undefined}
                  title={meta?.label}
                >
                  <span className="font-medium">{day.getDate()}</span>
                  {attendance && attendance.status === "PRESENT" && attendance.hours > 0 && (
                    <span className="text-[10px]">{attendance.hours}h</span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-4 text-xs">
            {STATUS_OPTIONS.map((s) => (
              <div key={s.value} className="flex items-center gap-1">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: s.bg, border: `1px solid ${s.color}` }}
                />
                <span className="text-stone-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {breakdown && (
          <div className="card p-6">
            <h3 className="font-semibold text-stone-900 mb-4">Facturation du mois</h3>
            <table className="w-full text-sm mb-4">
              <tbody>
                <tr className="border-b border-stone-100">
                  <td className="py-3 font-medium">Frais de garde</td>
                  <td className="py-3 text-stone-500">{breakdown.gardeDetail}</td>
                  <td className="py-3 text-right font-medium">
                    {breakdown.gardeFee.toFixed(2)} EUR
                  </td>
                </tr>
                <tr className="border-b border-stone-100">
                  <td className="py-3 font-medium">Frais de repas</td>
                  <td className="py-3 text-stone-500">
                    {breakdown.mealDays} jour(s) x {breakdown.mealRate.toFixed(2)} EUR
                  </td>
                  <td className="py-3 text-right font-medium">
                    {breakdown.mealFee.toFixed(2)} EUR
                  </td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">Frais d&apos;entretien</td>
                  <td className="py-3 text-stone-500">
                    {breakdown.maintenanceIsMonthly
                      ? "Forfait mensuel"
                      : `${breakdown.maintenanceDays} jour(s) x ${breakdown.maintenanceRate.toFixed(2)} EUR`}
                  </td>
                  <td className="py-3 text-right font-medium">
                    {breakdown.maintenanceFee.toFixed(2)} EUR
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2} className="pt-4 font-bold text-right">
                    Total a payer
                  </td>
                  <td className="pt-4 text-right font-bold text-lg">
                    {breakdown.totalFee.toFixed(2)} EUR
                  </td>
                </tr>
              </tfoot>
            </table>
            <PrintButton />
          </div>
        )}
      </div>
    </main>
  );
}
