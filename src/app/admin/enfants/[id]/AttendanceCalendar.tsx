"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  daysInMonth,
  monthLabel,
  toDateKey,
  weekdayKeyForDate,
  statusMeta,
  STATUS_OPTIONS,
} from "@/lib/dates";

type Attendance = {
  id: string;
  date: string;
  status: string;
  hours: number;
  mealProvided: boolean;
  note: string | null;
};

export default function AttendanceCalendar({
  childId,
  initialYear,
  initialMonth,
  weeklySchedule,
}: {
  childId: string;
  initialYear: number;
  initialMonth: number;
  weeklySchedule: string;
}) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const schedule: Record<string, number> = useMemo(() => {
    try {
      return JSON.parse(weeklySchedule || "{}");
    } catch {
      return {};
    }
  }, [weeklySchedule]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/children/${childId}/attendance?year=${year}&month=${month}`);
      const data = await res.json();
      setAttendances(data.attendances ?? []);
    } finally {
      setLoading(false);
    }
  }, [childId, year, month]);

  useEffect(() => {
    load();
  }, [load]);

  const byDateKey = useMemo(() => {
    const map = new Map<string, Attendance>();
    for (const a of attendances) {
      map.set(toDateKey(new Date(a.date)), a);
    }
    return map;
  }, [attendances]);

  const days = daysInMonth(year, month);
  const firstDayOffset = (days[0].getDay() + 6) % 7; // lundi = 0

  function goPrevMonth() {
    if (month === 1) {
      setMonth(12);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function goNextMonth() {
    if (month === 12) {
      setMonth(1);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    let hours = 0;
    for (const a of attendances) {
      counts[a.status] = (counts[a.status] ?? 0) + 1;
      if (a.status === "PRESENT") hours += a.hours;
    }
    return { counts, hours };
  }, [attendances]);

  const selectedAttendance = selectedDateKey ? byDateKey.get(selectedDateKey) : undefined;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 no-print">
        <button onClick={goPrevMonth} className="btn-secondary">
          &larr; Precedent
        </button>
        <h3 className="font-medium capitalize">{monthLabel(year, month)}</h3>
        <button onClick={goNextMonth} className="btn-secondary">
          Suivant &rarr;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-stone-400 mb-1">
        {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const key = toDateKey(day);
          const attendance = byDateKey.get(key);
          const meta = attendance ? statusMeta(attendance.status) : null;
          return (
            <button
              key={key}
              onClick={() => setSelectedDateKey(key)}
              className="aspect-square rounded-lg border border-stone-200 text-sm flex flex-col items-center justify-center hover:border-brand-400 transition-colors"
              style={meta ? { backgroundColor: meta.bg, color: meta.color } : undefined}
              title={meta?.label}
            >
              <span className="font-medium">{day.getDate()}</span>
              {attendance && attendance.status === "PRESENT" && attendance.hours > 0 && (
                <span className="text-[10px]">{attendance.hours}h</span>
              )}
              {attendance?.mealProvided && <span className="text-[10px]">repas</span>}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-4 text-xs no-print">
        {STATUS_OPTIONS.map((s) => (
          <div key={s.value} className="flex items-center gap-1">
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: s.bg, border: `1px solid ${s.color}` }}
            />
            <span className="text-stone-500">
              {s.label} ({summary.counts[s.value] ?? 0})
            </span>
          </div>
        ))}
        <span className="text-stone-500 font-medium">Total heures : {summary.hours}h</span>
      </div>

      {loading && <p className="text-sm text-stone-400 mt-3">Chargement...</p>}

      {selectedDateKey && (
        <DayEditor
          childId={childId}
          dateKey={selectedDateKey}
          attendance={selectedAttendance}
          defaultHours={
            schedule[weekdayKeyForDate(new Date(selectedDateKey))] ?? 0
          }
          onClose={() => setSelectedDateKey(null)}
          onSaved={() => {
            setSelectedDateKey(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function DayEditor({
  childId,
  dateKey,
  attendance,
  defaultHours,
  onClose,
  onSaved,
}: {
  childId: string;
  dateKey: string;
  attendance?: Attendance;
  defaultHours: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState(attendance?.status ?? "PRESENT");
  const [hours, setHours] = useState(String(attendance?.hours ?? defaultHours));
  const [mealProvided, setMealProvided] = useState(attendance?.mealProvided ?? true);
  const [note, setNote] = useState(attendance?.note ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/children/${childId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey,
          status,
          hours: status === "PRESENT" ? Number(hours || 0) : 0,
          mealProvided: status === "PRESENT" ? mealProvided : false,
          note,
        }),
      });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  async function handleClear() {
    setSaving(true);
    try {
      await fetch(`/api/children/${childId}/attendance?date=${dateKey}`, { method: "DELETE" });
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50 no-print">
      <div className="card w-full max-w-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{dateKey}</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700">
            &times;
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className="text-left px-3 py-2 rounded-lg border text-sm"
              style={{
                backgroundColor: status === s.value ? s.bg : "white",
                borderColor: status === s.value ? s.color : "#e7e5e4",
                color: status === s.value ? s.color : "#44403c",
                fontWeight: status === s.value ? 600 : 400,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {status === "PRESENT" && (
          <>
            <div>
              <label className="label">Heures gardees</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="24"
                className="input"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={mealProvided}
                onChange={(e) => setMealProvided(e.target.checked)}
              />
              Repas fourni ce jour-la
            </label>
          </>
        )}

        <div>
          <label className="label">Note (optionnel)</label>
          <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="flex gap-2">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? "Enregistrement..." : "Enregistrer"}
          </button>
          {attendance && (
            <button onClick={handleClear} disabled={saving} className="btn-secondary">
              Effacer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
