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
  variant = "menu",
  ariaLabel = "Категория меню",
}: {
  value: string;
  onChange: (value: string) => void;
  options: MenuCategoryOption[];
  variant?: "menu" | "admin";
  ariaLabel?: string;
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

  const isAdmin = variant === "admin";

  return (
    <div
      ref={rootRef}
      className={`relative w-full ${isAdmin ? "" : "sm:max-w-sm"}`}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={
          isAdmin
            ? `admin-input flex w-full items-center gap-3 text-left ${open ? "border-[#bbb]" : ""}`
            : `flex w-full items-center gap-3 rounded-2xl border bg-[var(--white)] px-4 py-3 text-left shadow-[var(--shadow-soft)] transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--gold)] active:scale-[0.99] ${
                open
                  ? "border-[var(--gold)] ring-2 ring-[color-mix(in_srgb,var(--gold)_30%,transparent)]"
                  : "border-[var(--line)]"
              }`
        }
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            isAdmin
              ? "bg-[var(--espresso)]/10 text-[var(--espresso)]"
              : "bg-[var(--espresso)] text-[var(--gold)]"
          }`}
        >
          <UtensilsCrossed className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={`block text-xs font-medium uppercase tracking-wide ${
              isAdmin ? "text-ink-muted" : "text-ink-muted"
            }`}
          >
            {isAdmin ? "Раздел меню" : "Категория"}
          </span>
          <span
            className={`block truncate ${
              isAdmin
                ? "text-sm font-semibold text-ink"
                : "font-display text-xl font-semibold text-ink"
            }`}
          >
            {selected?.label}
          </span>
        </span>
        <ChevronDown
          className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          } ${isAdmin ? "text-ink-muted" : "text-[var(--espresso-soft)]"}`}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute left-0 right-0 z-50 max-h-72 overflow-y-auto p-1.5 ${
            isAdmin
              ? "mt-1 rounded-lg border border-[#e5e5e5] bg-white shadow-sm"
              : "mt-2 rounded-2xl border border-[var(--line)] bg-[var(--white)] shadow-[var(--shadow)] animate-fade"
          }`}
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
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors duration-200 ${
                    isAdmin
                      ? active
                        ? "rounded-md bg-[#f5f5f5] text-ink"
                        : "rounded-md text-ink-muted hover:bg-[#fafafa] hover:text-ink"
                      : active
                        ? "rounded-xl bg-[color-mix(in_srgb,var(--gold)_22%,white)] text-[var(--espresso)]"
                        : "rounded-xl text-ink hover:bg-[var(--bg-deep)]/40"
                  }`}
                >
                  <span className="text-base font-medium sm:text-lg">{opt.label}</span>
                  <span className="flex shrink-0 items-center gap-2">
                    {opt.count != null && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          active
                            ? isAdmin
                              ? "bg-[var(--espresso)] text-white"
                              : "bg-[var(--espresso)] text-[var(--gold)]"
                            : "bg-[var(--bg-deep)] text-ink-muted"
                        }`}
                      >
                        {opt.count}
                      </span>
                    )}
                    {active && (
                      <Check
                        className={`h-4 w-4 ${isAdmin ? "text-ink" : "text-[var(--espresso)]"}`}
                        aria-hidden
                      />
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
