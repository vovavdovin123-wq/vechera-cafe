"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const TIME_SLOTS = Array.from({ length: 28 }, (_, i) => {
  const totalMin = 10 * 60 + i * 30;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
});

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, day] = value.split("-").map(Number);
  const d = new Date(y, m - 1, day);
  if (
    d.getFullYear() !== y ||
    d.getMonth() !== m - 1 ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d;
}

function parseLocalDateTime(value: string): { date: string; time: string } | null {
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!match) return null;
  return { date: match[1], time: match[2] };
}

function toLocalDateTime(date: string, time: string): string {
  return `${date}T${time}`;
}

function formatRuDateTime(value: string): string {
  const parsed = parseLocalDateTime(value);
  if (!parsed) return "";
  const d = parseIsoDate(parsed.date);
  if (!d) return "";
  const dateStr = d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
  return `${dateStr}, ${parsed.time}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function buildGrid(view: Date): Array<{ date: Date; inMonth: boolean }> {
  const first = startOfMonth(view);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - mondayOffset);

  const cells: Array<{ date: Date; inMonth: boolean }> = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    cells.push({
      date,
      inMonth: date.getMonth() === view.getMonth(),
    });
  }
  return cells;
}

function roundUpToSlot(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m;
  const slot = TIME_SLOTS.find((t) => {
    const [sh, sm] = t.split(":").map(Number);
    return sh * 60 + sm >= total;
  });
  return slot ?? TIME_SLOTS[TIME_SLOTS.length - 1];
}

export function CustomDateTimePicker({
  value,
  onChange,
  min,
  max,
  required,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  min: string;
  max: string;
  required?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const parsed = parseLocalDateTime(value);
  const minDateIso = min.split("T")[0];
  const maxDateIso = max.split("T")[0];

  const [pickedDate, setPickedDate] = useState(parsed?.date ?? "");
  const [pickedTime, setPickedTime] = useState(
    parsed?.time ? roundUpToSlot(parsed.time) : "",
  );
  const [view, setView] = useState(() =>
    startOfMonth(
      parseIsoDate(parsed?.date ?? min.split("T")[0]) ?? new Date(),
    ),
  );

  useEffect(() => {
    const next = parseLocalDateTime(value);
    if (next) {
      setPickedDate(next.date);
      setPickedTime(roundUpToSlot(next.time));
      const d = parseIsoDate(next.date);
      if (d) setView(startOfMonth(d));
    }
  }, [value]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const grid = useMemo(() => buildGrid(view), [view]);
  const todayIso = toIsoDate(new Date());

  const availableTimes = useMemo(() => {
    if (!pickedDate) return TIME_SLOTS;
    const minTime = pickedDate === minDateIso ? min.split("T")[1]?.slice(0, 5) : null;
    const maxTime = pickedDate === maxDateIso ? max.split("T")[1]?.slice(0, 5) : null;

    return TIME_SLOTS.filter((slot) => {
      if (minTime && slot < roundUpToSlot(minTime)) return false;
      if (maxTime && slot > maxTime) return false;
      return true;
    });
  }, [pickedDate, min, max, minDateIso, maxDateIso]);

  useEffect(() => {
    if (!pickedDate || availableTimes.length === 0) return;
    if (!pickedTime || !availableTimes.includes(pickedTime)) {
      setPickedTime(availableTimes[0]);
    }
  }, [pickedDate, availableTimes, pickedTime]);

  function dateDisabled(date: Date): boolean {
    const iso = toIsoDate(date);
    if (iso < minDateIso || iso > maxDateIso) return true;
    return false;
  }

  function pickDate(date: Date) {
    if (dateDisabled(date)) return;
    setPickedDate(toIsoDate(date));
  }

  function applySelection(date: string, time: string) {
    if (!date || !time) return;
    onChange(toLocalDateTime(date, time));
    setOpen(false);
  }

  function pickTime(time: string) {
    setPickedTime(time);
    if (pickedDate) applySelection(pickedDate, time);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label="Дата и время предзаказа"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-3 rounded-2xl border bg-[var(--white)] px-4 py-3 text-left shadow-[var(--shadow-soft)] transition-[border-color,box-shadow,transform] duration-300 hover:border-[var(--gold)] active:scale-[0.99] ${
          open
            ? "border-[var(--gold)] ring-2 ring-[color-mix(in_srgb,var(--gold)_30%,transparent)]"
            : "border-[var(--line)]"
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--espresso)] text-[var(--gold)]">
          <Clock className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium uppercase tracking-wide text-ink-muted">
            Когда забрать / доставить
          </span>
          <span
            className={`block truncate font-display text-lg font-semibold ${
              value ? "text-ink" : "text-ink-muted"
            }`}
          >
            {value ? formatRuDateTime(value) : "Выберите дату и время"}
          </span>
        </span>
        <CalendarDays className="h-5 w-5 shrink-0 text-[var(--espresso-soft)]" />
      </button>

      {required && !value && (
        <input
          tabIndex={-1}
          required
          value=""
          onChange={() => {}}
          className="pointer-events-none absolute h-0 w-0 opacity-0"
          aria-hidden
        />
      )}

      {open && (
        <div
          id={panelId}
          role="dialog"
          className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--white)] p-3 shadow-[var(--shadow)] animate-rise sm:w-[320px]"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() =>
                setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
              }
              className="rounded-full border border-[var(--line)] p-1.5 text-ink transition hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="font-display text-sm font-semibold text-[var(--espresso)]">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </p>
            <button
              type="button"
              onClick={() =>
                setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
              }
              className="rounded-full border border-[var(--line)] p-1.5 text-ink transition hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]"
              aria-label="Следующий месяц"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map((w) => (
              <div
                key={w}
                className="py-1 text-center text-[10px] font-medium uppercase tracking-wide text-ink-muted"
              >
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {grid.map(({ date, inMonth }) => {
              const iso = toIsoDate(date);
              const isSelected = pickedDate === iso;
              const isToday = iso === todayIso;
              const disabled = dateDisabled(date);

              return (
                <button
                  key={iso + String(inMonth)}
                  type="button"
                  disabled={disabled}
                  onClick={() => pickDate(date)}
                  className={`aspect-square rounded-xl text-sm transition ${
                    isSelected
                      ? "bg-[var(--espresso)] font-semibold text-[var(--gold)]"
                      : isToday
                        ? "border border-[var(--gold)] font-medium text-ink"
                        : inMonth
                          ? "text-ink hover:bg-[var(--gold-soft)]"
                          : "text-ink-muted/50 hover:bg-[var(--bg-deep)]"
                  } ${disabled ? "cursor-not-allowed opacity-30" : ""}`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 border-t border-[var(--line)] pt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
              Время
            </p>
            {!pickedDate ? (
              <p className="text-sm text-ink-muted">Сначала выберите дату</p>
            ) : (
              <div className="grid max-h-36 grid-cols-4 gap-1.5 overflow-y-auto">
                {availableTimes.map((slot) => {
                  const active = pickedTime === slot && value === toLocalDateTime(pickedDate, slot);
                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => pickTime(slot)}
                      className={`rounded-xl px-2 py-2 text-sm font-medium transition ${
                        active
                          ? "bg-[var(--espresso)] text-[var(--gold)]"
                          : "border border-[var(--line)] text-ink hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
