"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Phone, Search, ShoppingBag } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { CustomSelect } from "@/components/CustomSelect";
import { FRANCHISE_LIST } from "@/lib/franchises";
import { PAGE } from "@/lib/layout";
import { CATEGORY_LABELS } from "@/lib/menu-data";
import { useCart } from "@/context/CartContext";
import { useFranchise } from "@/context/FranchiseContext";
import { useMenu } from "@/context/MenuContext";
import { useSearch } from "@/context/SearchContext";
import type { FranchiseId } from "@/lib/types";

const franchiseOptions = FRANCHISE_LIST.map((f) => ({
  value: f.id,
  label: f.shortAddress,
}));

export function Header() {
  const { franchiseId, setFranchiseId } = useFranchise();
  const { count, setOpen, addItem } = useCart();
  const { query, setQuery } = useSearch();
  const { items } = useMenu();
  const [openList, setOpenList] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return items
      .filter((i) => i.available)
      .filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          CATEGORY_LABELS[i.category].toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [items, query]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpenList(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[color-mix(in_srgb,var(--espresso)_94%,black)] text-white shadow-[var(--shadow-soft)] backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div
        className={`${PAGE} flex flex-wrap items-center gap-2.5 py-3 sm:gap-3 sm:py-3.5 md:flex-nowrap`}
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <BrandLogo variant="light" size="sm" className="min-w-0" />
          <div className="hidden min-w-0 items-center gap-1.5 sm:flex">
            <MapPin className="h-4 w-4 shrink-0 text-[var(--gold)]" />
            <CustomSelect
              ariaLabel="Точка"
              variant="dark"
              value={franchiseId}
              options={franchiseOptions}
              onChange={(v) => setFranchiseId(v as FranchiseId)}
              className="min-w-[9rem] md:min-w-[12rem]"
            />
          </div>
        </div>

        <div
          ref={wrapRef}
          className="relative order-last w-full min-w-0 md:order-none md:flex-1"
        >
          <form
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2.5 transition-[border-color,background] duration-300 hover:border-[var(--gold)]/60 hover:bg-white/15 sm:px-4"
            onSubmit={(e) => {
              e.preventDefault();
              setOpenList(results.length > 0);
            }}
            role="search"
          >
            <Search className="h-4 w-4 shrink-0 text-white/60" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpenList(true);
              }}
              onFocus={() => setOpenList(true)}
              placeholder="Искать блюда"
              className="w-full min-w-0 bg-transparent text-base text-white outline-none placeholder:text-white/50 sm:text-lg"
              aria-label="Поиск по меню"
              aria-expanded={openList && results.length > 0}
              autoComplete="off"
            />
          </form>

          {openList && query.trim() && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[min(70vh,24rem)] overflow-hidden rounded-2xl border border-line bg-[var(--white)] shadow-[var(--shadow)] animate-fade">
              {results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-ink-muted">
                  Ничего не найдено
                </p>
              ) : (
                <ul className="max-h-[min(70vh,24rem)] overflow-y-auto py-1 overscroll-contain">
                  {results.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors duration-300 hover:bg-[var(--gold-soft)]"
                        onClick={() => {
                          addItem(item);
                          setQuery("");
                          setOpenList(false);
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image}
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-xl object-cover"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium text-ink">
                            {item.name}
                          </span>
                          <span className="text-xs text-ink-muted">
                            {CATEGORY_LABELS[item.category]}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-semibold text-ink">
                          {item.price} ₽
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2 md:ml-0">
          <div className="flex min-w-0 items-center gap-1 sm:hidden">
            <MapPin className="h-4 w-4 shrink-0 text-[var(--gold)]" />
            <CustomSelect
              ariaLabel="Точка"
              variant="dark"
              value={franchiseId}
              options={franchiseOptions}
              onChange={(v) => setFranchiseId(v as FranchiseId)}
              className="min-w-0 w-[7.5rem] max-w-[9rem]"
            />
          </div>
          <a
            href="#contacts"
            className="hidden items-center gap-1.5 rounded-full border border-white/25 px-3 py-2 text-sm text-white/90 transition hover:border-[var(--gold)] hover:bg-white/10 lg:inline-flex"
          >
            <Phone className="h-4 w-4" />
            Контакты
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="btn-soft relative shrink-0 gap-1.5 !px-3 !py-2 sm:!px-4 sm:!py-2.5"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Корзина</span>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--espresso)] px-1 text-[11px] font-bold text-[var(--gold)]">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
