"use client";

import { useState } from "react";

export default function ParentAccessCard({
  childId,
  accessToken,
  accessPin,
}: {
  childId: string;
  accessToken: string;
  accessPin: string;
}) {
  const [pin, setPin] = useState(accessPin);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const link = typeof window !== "undefined"
    ? `${window.location.origin}/parent/${accessToken}`
    : `/parent/${accessToken}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard indisponible, l'utilisateur peut copier manuellement
    }
  }

  async function regeneratePin() {
    if (!confirm("Regenerer le code PIN ? L'ancien code ne fonctionnera plus.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/children/${childId}/regenerate-pin`, { method: "POST" });
      const data = await res.json();
      if (res.ok) setPin(data.accessPin);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-5 no-print">
      <h2 className="font-semibold text-stone-900 mb-2">Acces parent en ligne</h2>
      <p className="text-sm text-stone-500 mb-3">
        Transmettez ce lien et ce code au parent : il pourra consulter les presences et la
        facture du mois, sans pouvoir les modifier.
      </p>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <input readOnly value={link} className="input flex-1 bg-stone-50" />
        <button onClick={copyLink} className="btn-secondary whitespace-nowrap">
          {copied ? "Copie !" : "Copier le lien"}
        </button>
      </div>
      <div className="flex items-center gap-3 mt-3">
        <span className="text-sm text-stone-600">
          Code PIN : <span className="font-mono font-bold text-lg">{pin}</span>
        </span>
        <button
          onClick={regeneratePin}
          disabled={loading}
          className="text-sm text-stone-500 hover:text-stone-800 underline"
        >
          Regenerer le code
        </button>
      </div>
    </div>
  );
}
