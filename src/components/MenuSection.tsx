"use client";

import { useMemo, useState } from "react";
import { CircleAlert, ShoppingBag, UtensilsCrossed, X } from "lucide-react";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/menu-data";
import { PAGE } from "@/lib/layout";
import type { MenuCategory, MenuItem } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { useMenu } from "@/context/MenuContext";

export function MenuSection() {
  const { items } = useMenu();
  const { addItem } = useCart();
  const [category, setCategory] = useState<MenuCategory | "all">("all");
  const [faqItem, setFaqItem] = useState<MenuItem | null>(null);

  const availableCategories = useMemo(() => {
    const present = new Set(items.map((i) => i.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [items]);

  const filtered = useMemo(() => {
    const list = items.filter((i) => i.available);
    if (category === "all") return list;
    return list.filter((i) => i.category === category);
  }, [items, category]);

  return (
    <section id="menu" className={`${PAGE} py-8 sm:py-10 md:py-12`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="brand-section-label inline-flex items-center gap-2 text-sm">
            <UtensilsCrossed className="h-4 w-4" />
            Меню
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
            Блюда
          </h2>
        </div>
      </div>

      <div className="mt-5 flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-6 [&::-webkit-scrollbar]:hidden">
        <CategoryChip
          active={category === "all"}
          onClick={() => setCategory("all")}
          label="Все"
        />
        {availableCategories.map((c) => (
          <CategoryChip
            key={c}
            active={category === c}
            onClick={() => setCategory(c)}
            label={CATEGORY_LABELS[c]}
          />
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3.5 sm:mt-6 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item, index) => (
          <article
            key={item.id}
            className="menu-card animate-rise flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--white)] shadow-[var(--shadow-soft)]"
            style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-[var(--bg-deep)]">
              {item.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-muted">
                  <UtensilsCrossed className="h-8 w-8 opacity-40" />
                </div>
              )}
            </div>
            <div className="flex flex-1 flex-col p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-ink sm:text-xl">
                  {item.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setFaqItem(item)}
                  className="shrink-0 rounded-full border border-[var(--line)] p-1.5 text-[var(--espresso-soft)] transition-[background,border-color,color] duration-300 hover:border-[var(--gold)] hover:bg-[var(--gold-soft)] hover:text-[var(--espresso)]"
                  aria-label="Состав блюда"
                  title="Состав"
                >
                  <CircleAlert className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-lg font-semibold text-ink sm:text-xl">
                  {item.price} ₽
                </p>
                <button
                  type="button"
                  onClick={() => addItem(item)}
                  className="btn-soft w-full gap-2 sm:w-auto sm:flex-1"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Заказать
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="mt-10 text-center text-ink-muted">
          В этом разделе пока нет позиций.
        </p>
      )}

      {faqItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40 animate-fade"
            aria-label="Закрыть"
            onClick={() => setFaqItem(null)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-6 shadow-2xl animate-rise">
            <button
              type="button"
              onClick={() => setFaqItem(null)}
              className="absolute right-4 top-4 rounded-full border border-line p-1.5 text-ink-muted hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="brand-section-label text-sm">Состав</p>
            <h3 className="mt-1 font-display text-2xl font-semibold text-ink">
              {faqItem.name}
            </h3>
            <p className="mt-4 leading-relaxed text-ink-muted">
              {faqItem.description}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

function CategoryChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-[background,border-color,color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:px-4 sm:py-2.5 sm:text-base ${
        active
          ? "border-transparent bg-[var(--espresso)] text-[var(--gold)]"
          : "border-[var(--line)] bg-[var(--white)] text-ink hover:border-[var(--gold)] hover:text-[var(--espresso)]"
      }`}
    >
      {label}
    </button>
  );
}
