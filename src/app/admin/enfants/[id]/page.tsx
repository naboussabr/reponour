import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { currentYearMonth } from "@/lib/dates";
import AttendanceCalendar from "./AttendanceCalendar";
import ParentAccessCard from "./ParentAccessCard";
import ChildSettings from "./ChildSettings";

export default async function ChildDetailPage({ params }: { params: { id: string } }) {
  const child = await prisma.child.findUnique({
    where: { id: params.id },
    include: { contract: true },
  });

  if (!child) notFound();

  const { year, month } = currentYearMonth();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">
            {child.firstName} {child.lastName}
          </h1>
          <p className="text-stone-500 text-sm">Parent : {child.parentName}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin/enfants/${child.id}/contrat`} className="btn-secondary">
            Contrat &amp; tarifs
          </Link>
          <Link
            href={`/admin/enfants/${child.id}/factures/${year}/${month}`}
            className="btn-primary"
          >
            Facture du mois
          </Link>
        </div>
      </div>

      {!child.contract && (
        <div className="rounded-lg bg-amber-50 text-amber-800 text-sm px-4 py-3">
          Aucun contrat configure pour cet enfant.{" "}
          <Link href={`/admin/enfants/${child.id}/contrat`} className="underline font-medium">
            Configurer le contrat
          </Link>{" "}
          avant de generer une facture.
        </div>
      )}

      <ParentAccessCard
        childId={child.id}
        accessToken={child.accessToken}
        accessPin={child.accessPin}
      />

      <div className="card p-5">
        <h2 className="font-semibold text-stone-900 mb-4">Presences</h2>
        <AttendanceCalendar
          childId={child.id}
          initialYear={year}
          initialMonth={month}
          weeklySchedule={child.contract?.weeklySchedule ?? "{}"}
        />
      </div>

      <ChildSettings childId={child.id} active={child.active} />
    </div>
  );
}
