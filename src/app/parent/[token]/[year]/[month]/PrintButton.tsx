"use client";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="btn-secondary no-print">
      Imprimer / PDF
    </button>
  );
}
