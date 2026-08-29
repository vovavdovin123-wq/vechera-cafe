"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleAlert, UtensilsCrossed, X } from "lucide-react";
import { MenuCategorySelect } from "@/components/MenuCategorySelect";
import { MenuItemAddControls } from "@/components/MenuItemAddControls";
import { MenuSkeleton } from "@/components/MenuSkeleton";
import { PAGE } from "@/lib/layout";
import type { MenuItem } from "@/lib/types";
import { useFranchise } from "@/context/FranchiseContext";
import { useMenu } from "@/context/MenuContext";

export function MenuSection() {
  const { franchise } = useFranchise();
  const { items, contentReady, categories } = useMenu();
  const [category, setCategory] = useState<string | "all">("all");
  const [faqItem, setFaqItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    setCategory("all");
  }, [franchise.id]);

  const availableCategories = useMemo(() => {
    const present = new Set(items.map((i) => i.category));
    return categories.filter((c) => present.has(c.id));
  }, [items, categories]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (!item.available) continue;
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
    }
    return counts;
  }, [items]);

  const categoryOptions = useMemo(
    () => [
      {
        value: "all",
        label: "Все блюда",
        count: items.filter((i) => i.available).length,
      },
      ...availableCategories.map((c) => ({
        value: c.id,
        label: c.label,
        count: categoryCounts.get(c.id) ?? 0,
      })),
    ],
    [availableCategories, categoryCounts, items],
  );

  const filtered = useMemo(() => {
    const list = items.filter((i) => i.available);
    if (category === "all") return list;
    return list.filter((i) => i.category === category);
  }, [items, category]);

  if (!contentReady) {
    return <MenuSkeleton />;
  }

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

      <div className="mt-5 sm:mt-6">
        <MenuCategorySelect
          value={category}
          onChange={(value) => setCategory(value)}
          options={categoryOptions}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
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
                  key={item.image}
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
            <div className="flex flex-1 flex-col p-2.5 sm:p-5">
              <div className="flex items-start justify-between gap-1.5">
                <h3 className="text-sm font-semibold leading-snug text-ink sm:text-xl">
                  {item.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setFaqItem(item)}
                  className="shrink-0 rounded-full border border-[var(--line)] p-1 text-[var(--espresso-soft)] transition-[background,border-color,color] duration-300 hover:border-[var(--gold)] hover:bg-[var(--gold-soft)] hover:text-[var(--espresso)] sm:p-1.5"
                  aria-label="Состав блюда"
                  title="Состав"
                >
                  <CircleAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
              <MenuItemAddControls item={item} />
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
