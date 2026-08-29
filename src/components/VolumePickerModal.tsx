"use client";

import { X } from "lucide-react";
import type { MenuItem } from "@/lib/types";

interface VolumePickerModalProps {
  item: MenuItem;
  onSelect: (volumeId: string) => void;
  onClose: () => void;
}

export function VolumePickerModal({
  item,
  onSelect,
  onClose,
}: VolumePickerModalProps) {
  if (!item.volumes?.length) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 animate-fade"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-t-2xl border border-[var(--line)] bg-white p-5 shadow-2xl animate-rise sm:rounded-2xl sm:p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-line p-1.5 text-ink-muted hover:text-ink"
        >
          <X className="h-4 w-4" />
        </button>
        <p className="brand-section-label text-sm">Выберите объём</p>
        <h3 className="mt-1 font-display text-xl font-semibold text-ink">
          {item.name}
        </h3>
        <ul className="mt-4 space-y-2">
          {item.volumes.map((vol) => (
            <li key={vol.id}>
              <button
                type="button"
                onClick={() => onSelect(vol.id)}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--line)] px-4 py-3 text-left transition hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]/30"
              >
                <span className="font-medium text-ink">{vol.label}</span>
                <span className="font-semibold text-ink">{vol.price} ₽</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
