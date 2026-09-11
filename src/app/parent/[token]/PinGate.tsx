"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PinGate({
  token,
  childFirstName,
}: {
  token: string;
  childFirstName: string;
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/parent/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur.");
        return;
      }
      router.push(`/parent/${token}`);
      router.refresh();
    } catch {
      setError("Erreur reseau, veuillez reessayer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="card w-full max-w-sm p-6 space-y-4">
        <div>
          <h1 className="text-xl font-bold text-stone-900">
            Espace de {childFirstName}
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Saisissez le code a 4 chiffres transmis par l&apos;assistante maternelle.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>
        )}

        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          required
          autoFocus
          className="input text-center text-2xl tracking-[0.5em] font-mono"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
        />

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Verification..." : "Acceder"}
        </button>
      </form>
    </main>
  );
}
