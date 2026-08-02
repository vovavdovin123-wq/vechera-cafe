"use client";

import { MenuCategorySelect } from "@/components/MenuCategorySelect";
import type { MenuCategoryOption } from "@/components/MenuCategorySelect";

/** Выбор категории в админке (фильтр / добавление). */
export function AdminCategorySelect({
  value,
  onChange,
  options,
  ariaLabel = "Категория меню",
}: {
  value: string;
  onChange: (value: string) => void;
  options: MenuCategoryOption[];
  ariaLabel?: string;
}) {
  return (
    <MenuCategorySelect
      variant="admin"
      ariaLabel={ariaLabel}
      value={value}
      onChange={onChange}
      options={options}
    />
  );
}
