import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { computeInvoice } from "@/lib/billing";
import { monthLabel } from "@/lib/dates";
import InvoiceActions from "./InvoiceActions";

export default async function InvoicePage({
  params,
}: {
  params: { id: string; year: string; month: string };
}) {
  const year = Number(params.year);
  const month = Number(params.month);
  const child = await prisma.child.findUnique({
    where: { id: params.id },
    include: { contract: true },
  });
  if (!child || !child.contract) notFound();

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const attendances = await prisma.attendance.findMany({
    where: { childId: child.id, date: { gte: start, lt: end } },
  });

  const breakdown = computeInvoice(child.contract, attendances);

  const invoice = await prisma.invoice.upsert({
    where: { childId_year_month: { childId: child.id, year, month } },
    update: {
      daysPresent: breakdown.daysPresent,
      hoursTotal: breakdown.hoursTotal,
      gardeFee: breakdown.gardeFee,
      mealDays: breakdown.mealDays,
      mealFee: breakdown.mealFee,
      maintenanceDays: breakdown.maintenanceDays,
      maintenanceFee: breakdown.maintenanceFee,
      totalFee: breakdown.totalFee,
      breakdown: JSON.stringify(breakdown),
    },
    create: {
      childId: child.id,
      year,
      month,
      daysPresent: breakdown.daysPresent,
      hoursTotal: breakdown.hoursTotal,
      gardeFee: breakdown.gardeFee,
      mealDays: breakdown.mealDays,
      mealFee: breakdown.mealFee,
      maintenanceDays: breakdown.maintenanceDays,
      maintenanceFee: breakdown.maintenanceFee,
      totalFee: breakdown.totalFee,
      breakdown: JSON.stringify(breakdown),
      status: "BROUILLON",
    },
  });

  const prevMonth = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between no-print">
        <Link href={`/admin/enfants/${child.id}`} className="text-sm text-stone-500 hover:underline">
          &larr; Retour a {child.firstName}
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/admin/enfants/${child.id}/factures/${prevMonth.y}/${prevMonth.m}`}
            className="btn-secondary"
          >
            &larr; Mois precedent
          </Link>
          <Link
            href={`/admin/enfants/${child.id}/factures/${nextMonth.y}/${nextMonth.m}`}
            className="btn-secondary"
          >
            Mois suivant &rarr;
          </Link>
        </div>
      </div>

      <div className="card p-8 print:shadow-none print:border-none" id="invoice">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-stone-900">Note de frais mensuelle</h1>
            <p className="text-stone-500 capitalize">{monthLabel(year, month)}</p>
          </div>
          <span className="text-xs uppercase tracking-wide px-3 py-1 rounded-full bg-stone-100 text-stone-600">
            {invoice.status}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div>
            <p className="text-stone-400">Enfant</p>
            <p className="font-medium">
              {child.firstName} {child.lastName}
            </p>
          </div>
          <div>
            <p className="text-stone-400">Parent</p>
            <p className="font-medium">{child.parentName}</p>
          </div>
        </div>

        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b border-stone-200 text-left text-stone-400">
              <th className="py-2">Prestation</th>
              <th className="py-2">Detail</th>
              <th className="py-2 text-right">Montant</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-stone-100">
              <td className="py-3 font-medium">Frais de garde</td>
              <td className="py-3 text-stone-500">{breakdown.gardeDetail}</td>
              <td className="py-3 text-right font-medium">{breakdown.gardeFee.toFixed(2)} EUR</td>
            </tr>
            <tr className="border-b border-stone-100">
              <td className="py-3 font-medium">Frais de repas</td>
              <td className="py-3 text-stone-500">
                {breakdown.mealDays} jour(s) x {breakdown.mealRate.toFixed(2)} EUR
              </td>
              <td className="py-3 text-right font-medium">{breakdown.mealFee.toFixed(2)} EUR</td>
            </tr>
            <tr className="border-b border-stone-100">
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-stone-500 border-t border-stone-200 pt-4">
          <div>Jours presents : {breakdown.daysPresent}</div>
          <div>Absences : {breakdown.absentDays}</div>
          <div>Conges : {breakdown.congeDays}</div>
          <div>Feries / maladie : {breakdown.ferieDays + breakdown.maladieDays}</div>
        </div>
      </div>

      <InvoiceActions invoiceId={invoice.id} status={invoice.status} />
    </div>
  );
}
