"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

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

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseIso(value: string): Date | null {
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

function formatRu(value: string): string {
  const d = parseIso(value);
  if (!d) return "";
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Сетка дней: понедельник = 0 */
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

export function CustomDatePicker({
  value,
  onChange,
  label,
  hint,
  min,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hint?: string;
  /** YYYY-MM-DD — раньше нельзя */
  min?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const selected = parseIso(value);
  const minDate = min ? parseIso(min) : null;

  const [view, setView] = useState(() =>
    startOfMonth(selected ?? new Date()),
  );

  useEffect(() => {
    if (selected) setView(startOfMonth(selected));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps -- sync view when value changes

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

  function pick(d: Date) {
    const iso = toIsoDate(d);
    if (minDate && d < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate())) {
      return;
    }
    onChange(iso);
    setOpen(false);
  }

  function clear(e: { stopPropagation: () => void }) {
    e.stopPropagation();
    onChange("");
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      {label && (
        <p className="mb-1.5 text-sm font-medium text-ink">{label}</p>
      )}
      <button
        type="button"
        aria-label={label || "Выбрать дату"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-2 rounded-2xl border border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_90%,white)] px-3.5 py-2.5 text-left text-sm transition-[border-color,box-shadow] duration-300 hover:border-[var(--gold)] hover:shadow-[var(--shadow-soft)] ${
          open
            ? "border-[var(--gold)] ring-2 ring-[color-mix(in_srgb,var(--gold)_35%,transparent)]"
            : ""
        }`}
      >
        <CalendarDays className="h-4 w-4 shrink-0 text-[var(--espresso-soft)]" />
        <span
          className={`min-w-0 flex-1 truncate ${
            value ? "font-medium text-ink" : "text-ink-muted"
          }`}
        >
          {value ? formatRu(value) : "Без срока — действует всегда"}
        </span>
        {value ? (
          <span
            role="button"
            tabIndex={0}
            onClick={clear}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                clear(e as unknown as React.MouseEvent);
              }
            }}
            className="rounded-full p-1 text-ink-muted transition hover:bg-[var(--gold-soft)] hover:text-ink"
            aria-label="Сбросить дату"
          >
            <X className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </button>

      {hint && (
        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">{hint}</p>
      )}

      {open && (
        <div
          id={panelId}
          role="dialog"
          className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-[20px] border border-[var(--line)] bg-[var(--surface)] p-3 shadow-[var(--shadow)] animate-rise sm:left-auto sm:w-[300px]"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() =>
                setView(
                  new Date(view.getFullYear(), view.getMonth() - 1, 1),
                )
              }
              className="rounded-full border border-[var(--line)] p-1.5 text-ink transition hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="font-display text-sm font-semibold tracking-wide text-[var(--espresso)]">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </p>
            <button
              type="button"
              onClick={() =>
                setView(
                  new Date(view.getFullYear(), view.getMonth() + 1, 1),
                )
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
              const isSelected = value === iso;
              const isToday = iso === todayIso;
              const disabled =
                !!minDate &&
                date <
                  new Date(
                    minDate.getFullYear(),
                    minDate.getMonth(),
                    minDate.getDate(),
                  );

              return (
                <button
                  key={iso + String(inMonth)}
                  type="button"
                  disabled={disabled}
                  onClick={() => pick(date)}
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

          <div className="mt-3 flex gap-2 border-t border-[var(--line)] pt-3">
            <button
              type="button"
              onClick={() => pick(new Date())}
              className="flex-1 rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-ink transition hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]"
            >
              Сегодня
            </button>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="flex-1 rounded-full border border-[var(--line)] px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:border-[var(--gold)] hover:text-ink"
            >
              Без срока
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
