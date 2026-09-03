"use client";

import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import {
  formatMenuPrice,
  itemHasVolumes,
} from "@/lib/menu-volumes";
import { useCart } from "@/context/CartContext";
import { VolumePickerModal } from "@/components/VolumePickerModal";

interface MenuItemAddControlsProps {
  item: MenuItem;
}

export function MenuItemAddControls({ item }: MenuItemAddControlsProps) {
  const { addItem, quantityOf } = useCart();
  const hasVolumes = itemHasVolumes(item);
  const totalQty = quantityOf(item.id);
  const [pickVolume, setPickVolume] = useState(false);

  if (!item.available) {
    return (
      <div className="mt-2.5 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-base font-semibold text-ink sm:text-xl">
          {formatMenuPrice(item)}
        </p>
        <p className="w-full rounded-xl border border-line bg-bg/50 px-2.5 py-2 text-center text-xs font-medium text-ink-muted sm:flex-1 sm:text-sm">
          Нет в наличии
        </p>
      </div>
    );
  }

  function handleAddClick() {
    if (hasVolumes) {
      setPickVolume(true);
      return;
    }
    addItem(item);
  }

  return (
    <>
      <div className="mt-2.5 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <p className="text-base font-semibold text-ink sm:text-xl">
          {formatMenuPrice(item)}
        </p>
        <button
          type="button"
          onClick={handleAddClick}
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

      {pickVolume && (
        <VolumePickerModal
          item={item}
          onClose={() => setPickVolume(false)}
          onSelect={(volumeId) => {
            addItem(item, volumeId);
            setPickVolume(false);
          }}
        />
      )}
    </>
  );
}
