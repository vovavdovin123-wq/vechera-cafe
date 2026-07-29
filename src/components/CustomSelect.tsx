"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  ariaLabel,
  variant = "light",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  ariaLabel: string;
  variant?: "light" | "dark" | "admin";
  className?: string;
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

  const isDark = variant === "dark";
  const isAdmin = variant === "admin";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={
          isAdmin
            ? `admin-input flex w-full min-w-0 items-center justify-between gap-2 text-left ${open ? "border-[#bbb]" : ""}`
            : `flex w-full min-w-0 items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-left text-base transition-[background,border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                isDark
                  ? "border-white/20 bg-white/10 text-white hover:border-[var(--orange)] hover:bg-white/15"
                  : "border-[var(--line)] bg-[color-mix(in_srgb,var(--surface)_90%,white)] text-ink hover:border-[var(--orange)] hover:shadow-[var(--shadow-soft)]"
              } ${open ? "ring-2 ring-[color-mix(in_srgb,var(--orange)_35%,transparent)]" : ""}`
        }
      >
        <span className={`truncate ${isAdmin ? "" : "font-medium"}`}>
          {selected?.label}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
            open ? "rotate-180" : ""
          } ${isDark ? "text-[var(--orange)]" : isAdmin ? "text-ink-muted" : "text-[var(--brown)]"}`}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          className={`absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border p-1 ${
            isAdmin
              ? "border-[#e5e5e5] bg-white shadow-sm"
              : "mt-2 rounded-2xl border-[var(--line)] bg-[var(--white)] p-1.5 shadow-[var(--shadow)] animate-fade"
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
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-base transition-colors ${
                    isAdmin
                      ? active
                        ? "bg-[#f5f5f5] text-ink"
                        : "text-ink-muted hover:bg-[#fafafa] hover:text-ink"
                      : active
                        ? "rounded-xl bg-[color-mix(in_srgb,var(--orange-soft)_80%,white)] text-ink"
                        : "rounded-xl text-ink hover:bg-[var(--green-soft)]"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {active && (
                    <Check
                      className={`h-4 w-4 shrink-0 ${isAdmin ? "text-ink" : "text-[var(--green-deep)]"}`}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
