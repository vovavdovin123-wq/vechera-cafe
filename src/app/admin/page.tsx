"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Loader2, Plus, RefreshCw, Save, Search, Trash2 } from "lucide-react";
import { AdminCategorySelect } from "@/components/AdminCategorySelect";
import { AdminShell } from "@/components/AdminShell";
import { CustomSelect } from "@/components/CustomSelect";
import { ImagePicker } from "@/components/ImagePicker";
import { useFranchise } from "@/context/FranchiseContext";
import { useMenu } from "@/context/MenuContext";
import {
  CATEGORY_IMAGES,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from "@/lib/menu-data";
import type { MenuCategory, MenuItem } from "@/lib/types";

const ALL_CATEGORIES = "all";

export default function AdminPage() {
  const { franchise, franchiseId } = useFranchise();
  const {
    items,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    toggleAvailable,
    applyFrontPadProducts,
    saveMenus,
    isDirty,
    syncStatus,
  } = useMenu();

  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState(ALL_CATEGORIES);
  const [search, setSearch] = useState("");
  const [addCategory, setAddCategory] = useState<MenuCategory>("sandwiches");
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("300");
  const [image, setImage] = useState("");
  const [frontpadArticle, setFrontpadArticle] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = { [ALL_CATEGORIES]: items.length };
    for (const cat of CATEGORY_ORDER) map[cat] = 0;
    for (const item of items) {
      map[item.category] = (map[item.category] ?? 0) + 1;
    }
    return map;
  }, [items]);

  const categoryOptions = useMemo(
    () => [
      { value: ALL_CATEGORIES, label: "Все категории", count: counts[ALL_CATEGORIES] },
      ...CATEGORY_ORDER.map((c) => ({
        value: c,
        label: CATEGORY_LABELS[c],
        count: counts[c] ?? 0,
      })),
    ],
    [counts],
  );

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (filterCategory !== ALL_CATEGORIES && item.category !== filterCategory) {
        return false;
      }
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.frontpadArticle ?? "").includes(q)
      );
    });
  }, [items, filterCategory, search]);

  const sections = useMemo(() => {
    const order =
      filterCategory === ALL_CATEGORIES
        ? CATEGORY_ORDER
        : [filterCategory as MenuCategory];

    return order
      .map((cat) => ({
        category: cat,
        label: CATEGORY_LABELS[cat],
        items: filteredItems.filter((i) => i.category === cat),
      }))
      .filter((s) => s.items.length > 0 || filterCategory === s.category);
  }, [filterCategory, filteredItems]);

  function openAddFor(category: MenuCategory) {
    setAddCategory(category);
    setImage(CATEGORY_IMAGES[category]);
    setShowAddForm(true);
  }

  function onAdd(e: FormEvent) {
    e.preventDefault();
    const parsed = Number(price);
    if (!name.trim() || !Number.isFinite(parsed) || parsed <= 0) return;
    addMenuItem({
      name: name.trim(),
      description: description.trim() || "Состав уточняется",
      price: Math.round(parsed),
      category: addCategory,
      image: image || CATEGORY_IMAGES[addCategory],
      frontpadArticle: frontpadArticle.trim() || undefined,
    });
    setName("");
    setDescription("");
    setPrice("300");
    setFrontpadArticle("");
    setImage(CATEGORY_IMAGES[addCategory]);
    setFilterCategory(addCategory);
  }

  async function onSaveAll() {
    setSaveMsg(null);
    const ok = await saveMenus();
    setSaveMsg(ok ? "Меню сохранено на сервере" : "Не удалось сохранить — войдите заново");
  }

  async function syncFromFrontPad() {
    setSyncLoading(true);
    setSyncMsg(null);
    try {
      const res = await fetch(
        `/api/frontpad/products?franchiseId=${encodeURIComponent(franchiseId)}`,
      );
      const data = (await res.json()) as {
        ok: boolean;
        products?: Array<{ article: string; name: string; price: number }>;
        message?: string;
      };
      if (!res.ok || !data.ok || !data.products) {
        setSyncMsg(data.message || "Не удалось загрузить товары FrontPad");
        return;
      }
      const { updated, skipped } = applyFrontPadProducts(data.products);
      setSyncMsg(
        `Синхронизация: обновлено ${updated}, без совпадения артикула ${skipped}. Нажмите «Сохранить меню».`,
      );
    } catch {
      setSyncMsg("Сеть недоступна");
    } finally {
      setSyncLoading(false);
    }
  }

  return (
    <AdminShell
      active="menu"
      title="Управление меню"
      subtitle={`${franchise.shortAddress} · категории как на сайте`}
      showLocation
    >
      <div
        className={`mt-4 flex flex-wrap items-center gap-3 rounded-2xl border px-4 py-3 ${
          isDirty
            ? "border-[var(--gold)]/50 bg-[var(--gold-soft)]/30"
            : "border-line bg-surface"
        }`}
      >
        <button
          type="button"
          onClick={() => void onSaveAll()}
          disabled={!isDirty || syncStatus === "saving"}
          className="btn-soft inline-flex items-center gap-2 disabled:opacity-50"
        >
          {syncStatus === "saving" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Сохранить меню
        </button>
        <p className="text-sm text-ink-muted">
          {isDirty
            ? "Есть несохранённые изменения"
            : "Все изменения сохранены"}
        </p>
        {saveMsg && (
          <p className="w-full text-xs text-ink-muted">{saveMsg}</p>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <AdminCategorySelect
            value={filterCategory}
            onChange={(v) => {
              setFilterCategory(v);
              if (v !== ALL_CATEGORIES) setAddCategory(v as MenuCategory);
            }}
            options={categoryOptions}
            ariaLabel="Фильтр по категории"
          />
        </div>
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или артикулу"
            className="admin-input admin-input-search w-full"
          />
        </div>
        <button
          type="button"
          onClick={() => void syncFromFrontPad()}
          disabled={syncLoading}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink shadow-[var(--shadow-soft)] transition hover:border-[var(--gold)] disabled:opacity-50"
        >
          {syncLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          FrontPad
        </button>
      </div>

      {syncMsg && <p className="mt-2 text-xs text-ink-muted">{syncMsg}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            openAddFor(
              filterCategory === ALL_CATEGORIES
                ? "sandwiches"
                : (filterCategory as MenuCategory),
            )
          }
          className="btn-soft inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Добавить в{" "}
          {filterCategory === ALL_CATEGORIES
            ? "меню"
            : CATEGORY_LABELS[filterCategory as MenuCategory]}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={onAdd}
          className="mt-4 grid gap-3 rounded-[22px] border border-[var(--gold)]/40 bg-[var(--gold-soft)]/20 p-4 shadow-[var(--shadow-soft)] sm:grid-cols-2 sm:p-5"
        >
          <h2 className="sm:col-span-2 text-base font-semibold text-ink">
            Новая позиция · {CATEGORY_LABELS[addCategory]}
          </h2>
          <div className="sm:col-span-2">
            <CustomSelect
              variant="admin"
              ariaLabel="Категория новой позиции"
              value={addCategory}
              options={CATEGORY_ORDER.map((c) => ({
                value: c,
                label: CATEGORY_LABELS[c],
              }))}
              onChange={(v) => {
                const next = v as MenuCategory;
                setAddCategory(next);
                setImage(CATEGORY_IMAGES[next]);
              }}
            />
          </div>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название"
            className="admin-input"
          />
          <input
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            min={1}
            placeholder="Цена"
            className="admin-input"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Состав"
            className="admin-input sm:col-span-2"
          />
          <input
            value={frontpadArticle}
            onChange={(e) =>
              setFrontpadArticle(e.target.value.replace(/\D/g, ""))
            }
            placeholder="Артикул FrontPad"
            inputMode="numeric"
            className="admin-input sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <ImagePicker
              persistOnServer
              uploadPrefix="menu"
              value={image}
              onChange={setImage}
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="submit" className="btn-soft">
              Добавить в меню
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="btn-ghost"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 space-y-8">
        {sections.length === 0 ? (
          <p className="text-sm text-ink-muted">
            {search.trim()
              ? "Ничего не найдено"
              : "В этой категории пока нет блюд"}
          </p>
        ) : (
          sections.map((section) => (
            <section key={section.category}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2">
                <h2 className="font-display text-lg font-semibold text-[var(--espresso)]">
                  {section.label}
                  <span className="ml-2 text-sm font-normal text-ink-muted">
                    {section.items.length}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => openAddFor(section.category)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[var(--espresso-soft)] hover:text-ink"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Добавить
                </button>
              </div>
              <ul className="space-y-3">
                {section.items.map((item) => (
                  <AdminItemRow
                    key={item.id}
                    item={item}
                    onUpdate={updateMenuItem}
                    onToggle={() => toggleAvailable(item.id)}
                    onRemove={() => removeMenuItem(item.id)}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </AdminShell>
  );
}

function AdminItemRow({
  item,
  onUpdate,
  onToggle,
  onRemove,
}: {
  item: MenuItem;
  onUpdate: (id: string, patch: Partial<MenuItem>) => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="grid min-w-0 gap-3 rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-soft)] sm:grid-cols-[1fr_auto] sm:p-4">
      <div className="grid gap-3">
        <ImagePicker
          persistOnServer
          uploadPrefix="menu"
          value={item.image}
          onChange={(image) => onUpdate(item.id, { image })}
          label="Фото блюда"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={item.name}
            onChange={(e) => onUpdate(item.id, { name: e.target.value })}
            className="admin-input"
            placeholder="Название"
          />
          <input
            type="number"
            min={1}
            value={item.price}
            onChange={(e) =>
              onUpdate(item.id, { price: Number(e.target.value) || item.price })
            }
            className="admin-input"
            placeholder="Цена"
          />
          <div className="sm:col-span-2">
            <CustomSelect
              variant="admin"
              ariaLabel="Категория блюда"
              value={item.category}
              options={CATEGORY_ORDER.map((c) => ({
                value: c,
                label: CATEGORY_LABELS[c],
              }))}
              onChange={(v) =>
                onUpdate(item.id, { category: v as MenuCategory })
              }
            />
          </div>
          <input
            value={item.description}
            onChange={(e) => onUpdate(item.id, { description: e.target.value })}
            className="admin-input sm:col-span-2"
            placeholder="Состав"
          />
          <input
            value={item.frontpadArticle ?? ""}
            onChange={(e) =>
              onUpdate(item.id, {
                frontpadArticle: e.target.value.replace(/\D/g, "") || undefined,
              })
            }
            className="admin-input sm:col-span-2"
            placeholder="Артикул FrontPad"
            inputMode="numeric"
          />
          <p className="text-xs text-ink-muted sm:col-span-2">
            {item.frontpadArticle
              ? `Артикул ${item.frontpadArticle}`
              : "Нет артикула FrontPad"}
          </p>
        </div>
      </div>
      <div className="flex flex-row gap-2 sm:flex-col sm:items-stretch">
        <button
          type="button"
          onClick={onToggle}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
            item.available
              ? "bg-success/15 text-success"
              : "bg-danger/15 text-danger"
          }`}
        >
          {item.available ? "В меню" : "Скрыто"}
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="btn-ghost btn-ghost-danger shrink-0 p-2"
          aria-label="Удалить"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
