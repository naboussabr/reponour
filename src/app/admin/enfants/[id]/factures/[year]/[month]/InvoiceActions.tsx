"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InvoiceActions({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: string;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setCurrent(newStatus);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between no-print">
      <div className="flex gap-2">
        {["BROUILLON", "ENVOYEE", "PAYEE"].map((s) => (
          <button
            key={s}
            onClick={() => updateStatus(s)}
            disabled={loading || current === s}
            className={current === s ? "btn-primary" : "btn-secondary"}
          >
            {s === "BROUILLON" ? "Brouillon" : s === "ENVOYEE" ? "Envoyee" : "Payee"}
          </button>
        ))}
      </div>
      <button onClick={() => window.print()} className="btn-secondary">
        Imprimer / PDF
      </button>
    </div>
  );
}
