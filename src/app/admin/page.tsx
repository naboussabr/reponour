import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function AdminDashboard() {
  const children = await prisma.child.findMany({
    orderBy: [{ active: "desc" }, { lastName: "asc" }],
    include: { contract: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Enfants gardes</h1>
        <Link href="/admin/enfants/nouveau" className="btn-primary">
          + Ajouter un enfant
        </Link>
      </div>

      {children.length === 0 ? (
        <div className="card p-8 text-center text-stone-500">
          Aucun enfant enregistre pour le moment. Ajoutez le premier enfant pour
          commencer le suivi des presences.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {children.map((child) => (
            <Link
              key={child.id}
              href={`/admin/enfants/${child.id}`}
              className="card p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-stone-900">
                    {child.firstName} {child.lastName}
                  </h2>
                  <p className="text-sm text-stone-500">Parent : {child.parentName}</p>
                </div>
                {!child.active && (
                  <span className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded-full">
                    Inactif
                  </span>
                )}
              </div>
              {child.contract ? (
                <p className="text-sm text-stone-600 mt-3">
                  {child.contract.billingMode === "MENSUALISE"
                    ? "Mensualise"
                    : `${child.contract.hourlyRate.toFixed(2)} EUR/h`}{" "}
                  &middot; repas {child.contract.mealRate.toFixed(2)} EUR &middot; entretien{" "}
                  {child.contract.maintenanceMonthly != null
                    ? `${child.contract.maintenanceMonthly.toFixed(2)} EUR/mois`
                    : `${child.contract.maintenanceRate.toFixed(2)} EUR/jour`}
                </p>
              ) : (
                <p className="text-sm text-amber-600 mt-3">Contrat a configurer</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
