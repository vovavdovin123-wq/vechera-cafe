"use client";

import { ShoppingBag } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import {
  formatMenuPrice,
  itemHasVolumes,
} from "@/lib/menu-volumes";
import { useCart } from "@/context/CartContext";

interface MenuItemAddControlsProps {
  item: MenuItem;
}

export function MenuItemAddControls({ item }: MenuItemAddControlsProps) {
  const { addItem, quantityOf, quantityOfVolume } = useCart();
  const hasVolumes = itemHasVolumes(item);
  const totalQty = quantityOf(item.id);

  if (hasVolumes) {
    return (
      <div className="mt-2.5 flex flex-col gap-2 sm:mt-5">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-base font-semibold text-ink sm:text-xl">
            {formatMenuPrice(item)}
          </p>
          {totalQty > 0 && (
            <span className="text-[10px] font-medium text-ink-muted sm:text-xs">
              в корзине: {totalQty}
            </span>
          )}
        </div>
        <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted sm:text-xs">
          Выберите размер
        </p>
        <div className="flex flex-wrap gap-1.5">
          {item.volumes!.map((vol) => {
            const volQty = quantityOfVolume(item.id, vol.id);
            return (
              <button
                key={vol.id}
                type="button"
                onClick={() => addItem(item, vol.id)}
                className="relative inline-flex min-w-0 max-w-full items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--bg)]/40 px-2 py-1.5 text-left transition hover:border-[var(--gold)] hover:bg-[var(--gold-soft)]/40 sm:gap-1.5 sm:px-3 sm:py-2"
              >
                <span className="truncate text-xs font-semibold text-ink sm:text-sm">
                  {vol.label}
                </span>
                <span className="shrink-0 text-xs font-semibold text-ink sm:text-sm">
                  {vol.price} ₽
                </span>
                {volQty > 0 && (
                  <span
                    className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--espresso)] px-0.5 text-[9px] font-bold text-[var(--gold)] sm:h-5 sm:min-w-5 sm:text-[10px]"
                    aria-label={`В корзине ${volQty}`}
                  >
                    {volQty}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2.5 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <p className="text-base font-semibold text-ink sm:text-xl">
        {formatMenuPrice(item)}
      </p>
      <button
        type="button"
        onClick={() => addItem(item)}
        className="btn-soft relative w-full gap-1.5 px-2.5 py-2 text-xs sm:w-auto sm:flex-1 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
      >
        <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        {totalQty > 0 ? "Ещё" : "В корзину"}
        {totalQty > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--espresso)] px-1 text-[10px] font-bold text-[var(--gold)] shadow-sm sm:h-6 sm:min-w-6 sm:text-xs"
            aria-label={`В корзине ${totalQty}`}
          >
            {totalQty}
          </span>
        )}
      </button>
    </div>
  );
}
