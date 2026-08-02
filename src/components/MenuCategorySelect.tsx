"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, UtensilsCrossed } from "lucide-react";

export interface MenuCategoryOption {
  value: string;
  label: string;
  count?: number;
}

export function MenuCategorySelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: MenuCategoryOption[];
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find((o) => o.value === value) ?? options[0];

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

  return (
    <div ref={rootRef} className="relative w-full sm:max-w-sm">
      <button
        type="button"
        aria-label="Категория меню"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center gap-3 rounded-2xl border bg-[var(--white)] px-4 py-3 text-left shadow-[var(--shadow-soft)] transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--gold)] active:scale-[0.99] ${
          open
            ? "border-[var(--gold)] ring-2 ring-[color-mix(in_srgb,var(--gold)_30%,transparent)]"
            : "border-[var(--line)]"
        }`}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--espresso)] text-[var(--gold)]">
          <UtensilsCrossed className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium uppercase tracking-wide text-ink-muted">
            Категория
          </span>
          <span className="block truncate font-display text-lg font-semibold text-ink">
            {selected?.label}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-[var(--espresso-soft)] transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Категория меню"
          className="absolute left-0 right-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--white)] p-1.5 shadow-[var(--shadow)] animate-fade"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-200 ${
                    active
                      ? "bg-[color-mix(in_srgb,var(--gold)_22%,white)] text-[var(--espresso)]"
                      : "text-ink hover:bg-[var(--bg-deep)]/40"
                  }`}
                >
                  <span className="text-sm font-medium sm:text-base">{opt.label}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {opt.count != null && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          active
                            ? "bg-[var(--espresso)] text-[var(--gold)]"
                            : "bg-[var(--bg-deep)] text-ink-muted"
                        }`}
                      >
                        {opt.count}
                      </span>
                    )}
                    {active && (
                      <Check className="h-4 w-4 text-[var(--espresso)]" aria-hidden />
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
