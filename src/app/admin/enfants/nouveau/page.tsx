"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WEEKDAY_KEYS, WEEKDAY_LABELS } from "@/lib/dates";

export default function NewChildPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  const [billingMode, setBillingMode] = useState<"HORAIRE" | "MENSUALISE">("HORAIRE");
  const [hourlyRate, setHourlyRate] = useState("3.50");
  const [monthlyHours, setMonthlyHours] = useState("");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [mealRate, setMealRate] = useState("4.00");
  const [maintenanceRate, setMaintenanceRate] = useState("3.00");
  const [maintenanceMonthly, setMaintenanceMonthly] = useState("");
  const [schedule, setSchedule] = useState<Record<string, string>>({
    mon: "8",
    tue: "8",
    wed: "8",
    thu: "8",
    fri: "8",
    sat: "0",
    sun: "0",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const weeklySchedule: Record<string, number> = {};
    for (const key of WEEKDAY_KEYS) {
      weeklySchedule[key] = Number(schedule[key] || 0);
    }

    try {
      const res = await fetch("/api/children", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          birthDate: birthDate || null,
          parentName,
          parentEmail: parentEmail || null,
          parentPhone: parentPhone || null,
          contract: {
            billingMode,
            hourlyRate: Number(hourlyRate || 0),
            monthlyHours: monthlyHours ? Number(monthlyHours) : null,
            monthlySalary: monthlySalary ? Number(monthlySalary) : null,
            mealRate: Number(mealRate || 0),
            maintenanceRate: Number(maintenanceRate || 0),
            maintenanceMonthly: maintenanceMonthly ? Number(maintenanceMonthly) : null,
            weeklySchedule,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la creation.");
        return;
      }
      router.push(`/admin/enfants/${data.child.id}`);
    } catch {
      setError("Erreur reseau, veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Ajouter un enfant</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>
        )}

        <section className="card p-5 space-y-4">
          <h2 className="font-semibold text-stone-900">Informations de l&apos;enfant</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Prenom</label>
              <input
                className="input"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Nom</label>
              <input
                className="input"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Date de naissance</label>
            <input
              type="date"
              className="input"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
            />
          </div>
        </section>

        <section className="card p-5 space-y-4">
          <h2 className="font-semibold text-stone-900">Parent</h2>
          <div>
            <label className="label">Nom du parent</label>
            <input
              className="input"
              required
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Email (optionnel)</label>
              <input
                type="email"
                className="input"
                value={parentEmail}
                onChange={(e) => setParentEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Telephone (optionnel)</label>
              <input
                className="input"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="card p-5 space-y-4">
          <h2 className="font-semibold text-stone-900">Contrat et tarifs</h2>

          <div>
            <label className="label">Mode de facturation de la garde</label>
            <select
              className="input"
              value={billingMode}
              onChange={(e) => setBillingMode(e.target.value as "HORAIRE" | "MENSUALISE")}
            >
              <option value="HORAIRE">Horaire (paye selon heures reellement gardees)</option>
              <option value="MENSUALISE">Mensualise (salaire fixe, mensualisation)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Taux horaire net (EUR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
              />
            </div>
            {billingMode === "MENSUALISE" && (
              <div>
                <label className="label">Heures mensualisees</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  className="input"
                  value={monthlyHours}
                  onChange={(e) => setMonthlyHours(e.target.value)}
                />
              </div>
            )}
          </div>

          {billingMode === "MENSUALISE" && (
            <div>
              <label className="label">Salaire mensuel fixe (EUR, optionnel)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                placeholder="Laisser vide = taux horaire x heures mensualisees"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Indemnite repas / jour (EUR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={mealRate}
                onChange={(e) => setMealRate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Indemnite entretien / jour (EUR)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input"
                value={maintenanceRate}
                onChange={(e) => setMaintenanceRate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="label">Indemnite entretien mensuelle fixe (EUR, optionnel)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              placeholder="Laisser vide pour un calcul par jour de presence"
              value={maintenanceMonthly}
              onChange={(e) => setMaintenanceMonthly(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Planning hebdomadaire habituel (heures/jour)</label>
            <div className="grid grid-cols-7 gap-2">
              {WEEKDAY_KEYS.map((key) => (
                <div key={key} className="text-center">
                  <p className="text-xs text-stone-500 mb-1">{WEEKDAY_LABELS[key].slice(0, 3)}</p>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    className="input text-center px-1"
                    value={schedule[key]}
                    onChange={(e) => setSchedule({ ...schedule, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-stone-400 mt-1">
              Ce planning sert a pre-remplir les heures lors de la saisie des presences.
            </p>
          </div>
        </section>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creation..." : "Creer l'enfant"}
        </button>
      </form>
    </div>
  );
}
