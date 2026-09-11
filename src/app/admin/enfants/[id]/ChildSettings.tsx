"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChildSettings({
  childId,
  active,
}: {
  childId: string;
  active: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleActive() {
    setLoading(true);
    try {
      await fetch(`/api/children/${childId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (
      !confirm(
        "Supprimer definitivement cet enfant ainsi que toutes ses presences et factures ?"
      )
    )
      return;
    setLoading(true);
    try {
      await fetch(`/api/children/${childId}`, { method: "DELETE" });
      router.push("/admin");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5 no-print flex items-center justify-between">
      <div>
        <h2 className="font-semibold text-stone-900">Statut</h2>
        <p className="text-sm text-stone-500">
          {active ? "Contrat actif" : "Contrat inactif (fin de garde)"}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={toggleActive} disabled={loading} className="btn-secondary">
          {active ? "Marquer inactif" : "Reactiver"}
        </button>
        <button onClick={handleDelete} disabled={loading} className="btn-danger">
          Supprimer
        </button>
      </div>
    </div>
  );
}
