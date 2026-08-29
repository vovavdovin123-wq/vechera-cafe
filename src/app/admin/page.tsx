"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Loader2, Plus, RefreshCw, Save, Search, Trash2 } from "lucide-react";
import { AdminCategorySelect } from "@/components/AdminCategorySelect";
import { AdminShell } from "@/components/AdminShell";
import { AdminVolumesEditor } from "@/components/AdminVolumesEditor";
import { CustomSelect } from "@/components/CustomSelect";
import { ImagePicker } from "@/components/ImagePicker";
import { useFranchise } from "@/context/FranchiseContext";
import { useMenu } from "@/context/MenuContext";
import { DEFAULT_DISH_IMAGE } from "@/lib/menu-categories";
import type { MenuCategoryDef, MenuItem, MenuVolumeOption } from "@/lib/types";
import { normalizeVolumes } from "@/lib/menu-volumes";

const ALL_CATEGORIES = "all";

export default function AdminPage() {
  const { franchise, franchiseId } = useFranchise();
  const {
    items,
    categories,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    toggleAvailable,
    addCategory,
    updateCategory,
    removeCategory,
    moveCategory,
    applyFrontPadProducts,
    saveMenus,
    isDirty,
    syncStatus,
  } = useMenu();

  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [categoryMsg, setCategoryMsg] = useState<string | null>(null);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");

  const [filterCategory, setFilterCategory] = useState(ALL_CATEGORIES);
  const [search, setSearch] = useState("");
  const [addCategoryId, setAddCategoryId] = useState("sandwiches");
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("300");
  const [image, setImage] = useState("");
  const [frontpadArticle, setFrontpadArticle] = useState("");
  const [addVolumes, setAddVolumes] = useState<MenuVolumeOption[] | undefined>(
    undefined,
  );
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const counts = useMemo(() => {
    const map: Record<string, number> = { [ALL_CATEGORIES]: items.length };
    for (const cat of categories) map[cat.id] = 0;
    for (const item of items) {
      map[item.category] = (map[item.category] ?? 0) + 1;
    }
    return map;
  }, [items, categories]);

  const categoryOptions = useMemo(
    () => [
      { value: ALL_CATEGORIES, label: "Все категории", count: counts[ALL_CATEGORIES] },
      ...categories.map((c) => ({
        value: c.id,
        label: c.label,
        count: counts[c.id] ?? 0,
      })),
    ],
    [counts, categories],
  );

  const selectCategoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c.id,
        label: c.label,
      })),
    [categories],
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
        ? categories.map((c) => c.id)
        : [filterCategory];

    return order
      .map((catId) => ({
        category: catId,
        label: categories.find((c) => c.id === catId)?.label ?? catId,
        items: filteredItems.filter((i) => i.category === catId),
      }))
      .filter((s) => s.items.length > 0 || filterCategory === s.category);
  }, [filterCategory, filteredItems, categories]);

  function openAddFor(categoryId: string) {
    setAddCategoryId(categoryId);
    setImage(DEFAULT_DISH_IMAGE);
    setShowAddForm(true);
  }

  function onAddCategory(e: FormEvent) {
    e.preventDefault();
    setCategoryMsg(null);
    const label = newCategoryLabel.trim();
    const result = addCategory(label);
    if (!result.ok) {
      setCategoryMsg(result.message);
      return;
    }
    setNewCategoryLabel("");
    setAddCategoryId(result.id);
    setCategoryMsg(`Категория «${label}» добавлена`);
  }

  function onAdd(e: FormEvent) {
    e.preventDefault();
    const normalizedVolumes = normalizeVolumes(addVolumes);
    const parsed = Number(price);
    if (!name.trim()) return;
    if (!normalizedVolumes?.length) {
      if (!Number.isFinite(parsed) || parsed <= 0) return;
    }
    addMenuItem({
      name: name.trim(),
      description: description.trim() || "Состав уточняется",
      price: normalizedVolumes?.length
        ? Math.min(...normalizedVolumes.map((v) => v.price))
        : Math.round(parsed),
      category: addCategoryId,
      image: image || DEFAULT_DISH_IMAGE,
      frontpadArticle: normalizedVolumes?.length
        ? undefined
        : frontpadArticle.trim() || undefined,
      volumes: normalizedVolumes,
    });
    setName("");
    setDescription("");
    setPrice("300");
    setFrontpadArticle("");
    setAddVolumes(undefined);
    setImage(DEFAULT_DISH_IMAGE);
    setFilterCategory(addCategoryId);
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
      const { updated, assigned, skipped, mismatches } =
        applyFrontPadProducts(data.products);
      const parts = [
        `артикулы подставлены — ${assigned}`,
        `цены обновлены — ${updated}`,
        `пропущено — ${skipped}`,
      ];
      if (mismatches.length) {
        parts.push(
          `ошибки артикулов — ${mismatches.length} (исправьте вручную)`,
        );
      }
      setSyncMsg(
        `FrontPad: ${parts.join(", ")}. Нажмите «Сохранить меню».` +
          (mismatches.length
            ? ` Неверный артикул: ${mismatches
                .slice(0, 3)
                .map(
                  (m) =>
                    `«${m.itemName}» (${m.article} → «${m.frontpadName}»)`,
                )
                .join("; ")}${mismatches.length > 3 ? "…" : ""}`
            : ""),
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
      subtitle={`${franchise.shortAddress} · категории и блюда`}
    >
      <div
        className={`mt-4 flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center ${
          isDirty
            ? "border-[var(--gold)]/50 bg-[var(--gold-soft)]/30"
            : "border-line bg-surface"
        }`}
      >
        <button
          type="button"
          onClick={() => void onSaveAll()}
          disabled={!isDirty || syncStatus === "saving"}
          className="btn-soft inline-flex w-full items-center justify-center gap-2 disabled:opacity-50 sm:w-auto"
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

      <section className="mt-6 rounded-[22px] border border-line bg-surface p-4 shadow-[var(--shadow-soft)] sm:p-5">
        <h2 className="font-display text-lg font-semibold text-[var(--espresso)]">
          Категории меню
        </h2>

        <ul className="mt-4 space-y-2">
          {categories.map((cat, index) => (
            <li
              key={cat.id}
              className="admin-card flex flex-col gap-2 rounded-xl border border-line bg-bg/40 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center"
            >
              <input
                value={cat.label}
                onChange={(e) => updateCategory(cat.id, { label: e.target.value })}
                className="admin-input min-w-0 w-full flex-1"
                aria-label={`Название категории ${cat.id}`}
              />
              <span className="text-xs text-ink-muted sm:shrink-0">{counts[cat.id] ?? 0} блюд</span>
              <div className="flex gap-1 sm:ml-auto">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => moveCategory(cat.id, "up")}
                  className="btn-ghost p-2 disabled:opacity-40"
                  aria-label="Выше"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  disabled={index === categories.length - 1}
                  onClick={() => moveCategory(cat.id, "down")}
                  className="btn-ghost p-2 disabled:opacity-40"
                  aria-label="Ниже"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const result = removeCategory(cat.id);
                    setCategoryMsg(result.ok ? null : result.message);
                  }}
                  className="btn-ghost btn-ghost-danger p-2"
                  aria-label="Удалить категорию"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={onAddCategory} className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <input
            value={newCategoryLabel}
            onChange={(e) => setNewCategoryLabel(e.target.value)}
            placeholder="Новая категория, напр. Хот-доги"
            className="admin-input min-w-0 w-full flex-1"
          />
          <button type="submit" className="btn-soft inline-flex w-full items-center justify-center gap-2 sm:w-auto">
            <Plus className="h-4 w-4" />
            Добавить категорию
          </button>
        </form>
        {categoryMsg && (
          <p className="mt-2 text-xs text-ink-muted">{categoryMsg}</p>
        )}
      </section>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <AdminCategorySelect
            value={filterCategory}
            onChange={(v) => {
              setFilterCategory(v);
              if (v !== ALL_CATEGORIES) setAddCategoryId(v);
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
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink shadow-[var(--shadow-soft)] transition hover:border-[var(--gold)] disabled:opacity-50 sm:w-auto"
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
                ? categories[0]?.id ?? "sandwiches"
                : filterCategory,
            )
          }
          className="btn-soft inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Добавить в{" "}
          {filterCategory === ALL_CATEGORIES
            ? "меню"
            : categories.find((c) => c.id === filterCategory)?.label ??
              filterCategory}
        </button>
      </div>

      {showAddForm && (
        <form
          onSubmit={onAdd}
          className="mt-4 grid gap-3 rounded-[22px] border border-[var(--gold)]/40 bg-[var(--gold-soft)]/20 p-4 shadow-[var(--shadow-soft)] sm:grid-cols-2 sm:p-5"
        >
          <h2 className="sm:col-span-2 text-base font-semibold text-ink">
            Новая позиция ·{" "}
            {categories.find((c) => c.id === addCategoryId)?.label ?? addCategoryId}
          </h2>
          <div className="sm:col-span-2">
            <CustomSelect
              variant="admin"
              ariaLabel="Категория новой позиции"
              value={addCategoryId}
              options={selectCategoryOptions}
              onChange={(v) => {
                setAddCategoryId(v);
                setImage(DEFAULT_DISH_IMAGE);
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
            required={!addVolumes?.length}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            type="number"
            min={1}
            placeholder={addVolumes?.length ? "Базовая (не используется)" : "Цена"}
            className="admin-input"
            disabled={Boolean(addVolumes?.length)}
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
            disabled={Boolean(addVolumes?.length)}
          />
          <div className="sm:col-span-2">
            <AdminVolumesEditor volumes={addVolumes} onChange={setAddVolumes} />
          </div>
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
                    categoryOptions={selectCategoryOptions}
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
  categoryOptions,
  onUpdate,
  onToggle,
  onRemove,
}: {
  item: MenuItem;
  categoryOptions: Array<{ value: string; label: string }>;
  onUpdate: (id: string, patch: Partial<MenuItem>) => void;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="admin-card flex min-w-0 flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-soft)] lg:grid lg:grid-cols-[1fr_auto] lg:items-start lg:p-4">
      <div className="min-w-0 grid gap-3">
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
            disabled={Boolean(item.volumes?.length)}
          />
          <div className="sm:col-span-2">
            <CustomSelect
              variant="admin"
              ariaLabel="Категория блюда"
              value={item.category}
              options={categoryOptions}
              onChange={(v) => onUpdate(item.id, { category: v })}
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
            disabled={Boolean(item.volumes?.length)}
          />
          <div className="sm:col-span-2">
            <AdminVolumesEditor
              volumes={item.volumes}
              onChange={(volumes) => {
                const normalized = normalizeVolumes(volumes);
                onUpdate(item.id, {
                  volumes: normalized,
                  price: normalized?.length
                    ? Math.min(...normalized.map((v) => v.price))
                    : item.price,
                  frontpadArticle: normalized?.length
                    ? undefined
                    : item.frontpadArticle,
                });
              }}
            />
          </div>
          <p className="text-xs text-ink-muted sm:col-span-2">
            {item.volumes?.length
              ? `${item.volumes.length} объём(а): ${item.volumes.map((v) => `${v.label} — ${v.price} ₽`).join(", ")}`
              : item.frontpadArticle
                ? `Артикул ${item.frontpadArticle}`
                : "Нет артикула FrontPad"}
          </p>
        </div>
      </div>
      <div className="flex flex-row items-center justify-end gap-2 border-t border-line pt-3 lg:flex-col lg:items-stretch lg:border-t-0 lg:pt-0">
        <button
          type="button"
          onClick={onToggle}
          className={`shrink-0 rounded-full px-3 py-2 text-xs font-medium transition sm:py-1.5 ${
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
