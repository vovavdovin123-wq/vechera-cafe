"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";
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

export default function AdminPage() {
  const { franchise, franchiseId } = useFranchise();
  const {
    items,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    toggleAvailable,
    applyFrontPadProducts,
  } = useMenu();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("300");
  const [category, setCategory] = useState<MenuCategory>("sandwiches");
  const [image, setImage] = useState("");
  const [frontpadArticle, setFrontpadArticle] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  function onAdd(e: FormEvent) {
    e.preventDefault();
    const parsed = Number(price);
    if (!name.trim() || !Number.isFinite(parsed) || parsed <= 0) return;
    addMenuItem({
      name: name.trim(),
      description: description.trim() || "Состав уточняется",
      price: Math.round(parsed),
      category,
      image: image || "",
      frontpadArticle: frontpadArticle.trim() || undefined,
    });
    setName("");
    setDescription("");
    setPrice("300");
    setImage("");
    setFrontpadArticle("");
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
        `Синхронизация: обновлено ${updated}, без совпадения артикула ${skipped}. В FrontPad товаров: ${data.products.length}. Не чаще 1 раза в час.`,
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
      subtitle={`${franchise.shortAddress} · добавляйте позиции, меняйте цены и фото`}
      showLocation
    >
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void syncFromFrontPad()}
          disabled={syncLoading}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink shadow-[var(--shadow-soft)] transition hover:border-[var(--gold)] disabled:opacity-50"
        >
          {syncLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Синхронизировать с FrontPad
        </button>
        {syncMsg && (
          <p className="max-w-xl text-xs text-ink-muted">{syncMsg}</p>
        )}
      </div>

      <form
        onSubmit={onAdd}
        className="mt-6 grid max-w-full gap-3 rounded-[22px] border border-line bg-surface p-4 shadow-[var(--shadow)] sm:mt-8 sm:grid-cols-2 sm:p-5"
      >
        <h2 className="sm:col-span-2 flex items-center gap-2 text-lg font-semibold">
          <Plus className="h-5 w-5 text-accent" />
          Добавить позицию
        </h2>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название"
          className="rounded-2xl border border-line bg-bg/40 px-4 py-2.5 text-base outline-none focus:border-accent sm:text-sm"
        />
        <input
          required
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          min={1}
          placeholder="Цена"
          className="rounded-2xl border border-line bg-bg/40 px-4 py-2.5 text-base outline-none focus:border-accent sm:text-sm"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Состав"
          className="rounded-2xl border border-line bg-bg/40 px-4 py-2.5 text-sm outline-none focus:border-accent sm:col-span-2"
        />
        <input
          value={frontpadArticle}
          onChange={(e) => setFrontpadArticle(e.target.value.replace(/\D/g, ""))}
          placeholder="Артикул FrontPad (цифры)"
          inputMode="numeric"
          className="rounded-2xl border border-line bg-bg/40 px-4 py-2.5 text-sm outline-none focus:border-accent sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <CustomSelect
            ariaLabel="Категория"
            value={category}
            options={CATEGORY_ORDER.map((c) => ({
              value: c,
              label: CATEGORY_LABELS[c],
            }))}
            onChange={(v) => {
              const next = v as MenuCategory;
              setCategory(next);
              if (
                Object.values(CATEGORY_IMAGES).includes(image as (typeof CATEGORY_IMAGES)[MenuCategory])
              ) {
                setImage(CATEGORY_IMAGES[next]);
              }
            }}
          />
        </div>
        <div className="sm:col-span-2">
          <ImagePicker
            persistOnServer
            uploadPrefix="menu"
            value={image}
            onChange={setImage}
          />
        </div>
        <button type="submit" className="btn-soft sm:col-span-2 justify-self-start">
          Добавить
        </button>
      </form>

      <ul className="mt-8 space-y-4">
        {items.map((item) => (
          <AdminItemRow
            key={item.id}
            item={item}
            onUpdate={updateMenuItem}
            onToggle={() => toggleAvailable(item.id)}
            onRemove={() => removeMenuItem(item.id)}
          />
        ))}
      </ul>
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
            className="rounded-xl border border-line bg-bg/40 px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Название"
          />
          <input
            type="number"
            min={1}
            value={item.price}
            onChange={(e) =>
              onUpdate(item.id, { price: Number(e.target.value) || item.price })
            }
            className="rounded-xl border border-line bg-bg/40 px-3 py-2 text-sm outline-none focus:border-accent"
            placeholder="Цена"
          />
          <input
            value={item.description}
            onChange={(e) => onUpdate(item.id, { description: e.target.value })}
            className="rounded-xl border border-line bg-bg/40 px-3 py-2 text-sm outline-none focus:border-accent sm:col-span-2"
            placeholder="Состав"
          />
          <input
            value={item.frontpadArticle ?? ""}
            onChange={(e) =>
              onUpdate(item.id, {
                frontpadArticle: e.target.value.replace(/\D/g, "") || undefined,
              })
            }
            className="rounded-xl border border-line bg-bg/40 px-3 py-2 text-sm outline-none focus:border-accent sm:col-span-2"
            placeholder="Артикул FrontPad"
            inputMode="numeric"
          />
          <p className="text-xs text-ink-muted sm:col-span-2">
            {CATEGORY_LABELS[item.category]}
            {item.frontpadArticle ? ` · арт. ${item.frontpadArticle}` : " · нет артикула FrontPad"}
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
