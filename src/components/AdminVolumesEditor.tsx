"use client";

import { Plus, Trash2 } from "lucide-react";
import type { MenuVolumeOption } from "@/lib/types";
import { newVolumeId } from "@/lib/menu-volumes";

interface AdminVolumesEditorProps {
  volumes: MenuVolumeOption[] | undefined;
  onChange: (volumes: MenuVolumeOption[] | undefined) => void;
}

export function AdminVolumesEditor({
  volumes,
  onChange,
}: AdminVolumesEditorProps) {
  const list = volumes ?? [];

  function updateAt(index: number, patch: Partial<MenuVolumeOption>) {
    const next = list.map((v, i) => (i === index ? { ...v, ...patch } : v));
    onChange(next.length ? next : undefined);
  }

  function removeAt(index: number) {
    const next = list.filter((_, i) => i !== index);
    onChange(next.length ? next : undefined);
  }

  function addVolume() {
    onChange([
      ...list,
      {
        id: newVolumeId(),
        label: "",
        price: 0,
      },
    ]);
  }

  return (
    <div className="admin-card rounded-xl border border-line bg-bg/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Объёмы / размеры
        </p>
        <button
          type="button"
          onClick={addVolume}
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--espresso-soft)] hover:text-ink"
        >
          <Plus className="h-3.5 w-3.5" />
          Добавить объём
        </button>
      </div>

      {list.length === 0 ? (
        <p className="mt-2 text-xs text-ink-muted">
          Без объёмов — одна цена и один артикул. Добавьте объёмы для напитков
          (М, С, Б и т.д.).
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {list.map((vol, index) => (
            <li
              key={vol.id}
              className="rounded-lg border border-line bg-surface p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-ink-muted">
                  Объём {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="btn-ghost btn-ghost-danger p-1.5"
                  aria-label="Удалить объём"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_100px_120px]">
                <label className="min-w-0 sm:col-span-2 lg:col-span-1">
                  <span className="mb-1 block text-[11px] text-ink-muted">
                    Название
                  </span>
                  <input
                    value={vol.label}
                    onChange={(e) => updateAt(index, { label: e.target.value })}
                    placeholder="М, С, Б…"
                    className="admin-input py-2 text-sm"
                  />
                </label>
                <label className="min-w-0">
                  <span className="mb-1 block text-[11px] text-ink-muted">
                    Цена
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={vol.price || ""}
                    onChange={(e) =>
                      updateAt(index, { price: Number(e.target.value) || 0 })
                    }
                    placeholder="₽"
                    className="admin-input py-2 text-sm"
                  />
                </label>
                <label className="min-w-0 sm:col-span-2 lg:col-span-1">
                  <span className="mb-1 block text-[11px] text-ink-muted">
                    Артикул FP
                  </span>
                  <input
                    value={vol.frontpadArticle ?? ""}
                    onChange={(e) =>
                      updateAt(index, {
                        frontpadArticle:
                          e.target.value.replace(/\D/g, "") || undefined,
                      })
                    }
                    placeholder="FrontPad"
                    inputMode="numeric"
                    className="admin-input py-2 text-sm"
                  />
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}

      {list.length > 0 && (
        <p className="mt-2 text-xs text-ink-muted">
          Гость не сможет добавить блюдо в корзину, пока не выберет объём.
        </p>
      )}
    </div>
  );
}
