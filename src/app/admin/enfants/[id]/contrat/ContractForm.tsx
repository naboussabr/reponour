"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { WEEKDAY_KEYS, WEEKDAY_LABELS } from "@/lib/dates";

type Contract = {
  billingMode: string;
  hourlyRate: number;
  monthlyHours: number | null;
  monthlySalary: number | null;
  mealRate: number;
  maintenanceRate: number;
  maintenanceMonthly: number | null;
  weeklySchedule: string;
} | null;

export default function ContractForm({
  childId,
  contract,
}: {
  childId: string;
  contract: Contract;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const initialSchedule = (() => {
    try {
      return JSON.parse(contract?.weeklySchedule ?? "{}");
    } catch {
      return {};
    }
  })();

  const [billingMode, setBillingMode] = useState<"HORAIRE" | "MENSUALISE">(
    (contract?.billingMode as "HORAIRE" | "MENSUALISE") ?? "HORAIRE"
  );
  const [hourlyRate, setHourlyRate] = useState(String(contract?.hourlyRate ?? "3.50"));
  const [monthlyHours, setMonthlyHours] = useState(String(contract?.monthlyHours ?? ""));
  const [monthlySalary, setMonthlySalary] = useState(String(contract?.monthlySalary ?? ""));
  const [mealRate, setMealRate] = useState(String(contract?.mealRate ?? "4.00"));
  const [maintenanceRate, setMaintenanceRate] = useState(
    String(contract?.maintenanceRate ?? "3.00")
  );
  const [maintenanceMonthly, setMaintenanceMonthly] = useState(
    String(contract?.maintenanceMonthly ?? "")
  );
  const [schedule, setSchedule] = useState<Record<string, string>>({
    mon: String(initialSchedule.mon ?? 8),
    tue: String(initialSchedule.tue ?? 8),
    wed: String(initialSchedule.wed ?? 8),
    thu: String(initialSchedule.thu ?? 8),
    fri: String(initialSchedule.fri ?? 8),
    sat: String(initialSchedule.sat ?? 0),
    sun: String(initialSchedule.sun ?? 0),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);

    const weeklySchedule: Record<string, number> = {};
    for (const key of WEEKDAY_KEYS) {
      weeklySchedule[key] = Number(schedule[key] || 0);
    }

    try {
      const res = await fetch(`/api/children/${childId}/contract`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingMode,
          hourlyRate: Number(hourlyRate || 0),
          monthlyHours: monthlyHours ? Number(monthlyHours) : null,
          monthlySalary: monthlySalary ? Number(monthlySalary) : null,
          mealRate: Number(mealRate || 0),
          maintenanceRate: Number(maintenanceRate || 0),
          maintenanceMonthly: maintenanceMonthly ? Number(maintenanceMonthly) : null,
          weeklySchedule,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'enregistrement.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Erreur reseau, veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-4">
      {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}
      {saved && (
        <div className="rounded-lg bg-green-50 text-green-700 text-sm px-3 py-2">
          Contrat enregistre.
        </div>
      )}

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
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Enregistrement..." : "Enregistrer le contrat"}
      </button>
    </form>
  );
}
