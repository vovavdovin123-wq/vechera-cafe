"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { CustomSelect } from "@/components/CustomSelect";
import type { Coupon, CouponType } from "@/lib/coupons";

export default function AdminCouponsPage() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponType>("percent");
  const [value, setValue] = useState("10");
  const [minOrder, setMinOrder] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/content/coupons");
      const data = (await res.json()) as { ok: boolean; items?: Coupon[] };
      if (res.ok && data.ok && data.items) setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function persist(next: Coupon[]) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/content/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: next }),
      });
      const data = (await res.json()) as { ok: boolean; items?: Coupon[]; message?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.message || "Не удалось сохранить");
        return;
      }
      setItems(data.items ?? next);
      setMessage("Сохранено");
    } catch {
      setMessage("Сеть недоступна");
    } finally {
      setSaving(false);
    }
  }

  function onAdd(e: FormEvent) {
    e.preventDefault();
    const parsed = Number(value);
    if (!code.trim() || !Number.isFinite(parsed) || parsed <= 0) return;
    if (type === "percent" && parsed > 100) {
      setMessage("Процент не может быть больше 100");
      return;
    }

    const coupon: Coupon = {
      id: `c-${Date.now().toString(36)}`,
      code: code.trim().toUpperCase().replace(/\s+/g, ""),
      type,
      value: Math.round(parsed),
      active: true,
      minOrder: minOrder ? Math.round(Number(minOrder)) : undefined,
      expiresAt: expiresAt || undefined,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    if (items.some((i) => i.code === coupon.code)) {
      setMessage("Такой код уже есть");
      return;
    }

    void persist([coupon, ...items]);
    setCode("");
    setValue(type === "percent" ? "10" : "100");
    setMinOrder("");
    setExpiresAt("");
    setNote("");
  }

  return (
    <AdminShell
      active="coupons"
      title="Промокоды"
      subtitle="Создавайте коды скидок для корзины на сайте"
    >
      <form
        onSubmit={onAdd}
        className="mt-6 grid max-w-full gap-3 rounded-[22px] border border-line bg-surface p-4 shadow-[var(--shadow)] sm:grid-cols-2 sm:p-5"
      >
        <h2 className="sm:col-span-2 flex items-center gap-2 text-lg font-semibold">
          <Plus className="h-5 w-5 text-accent" />
          Новый промокод
        </h2>
        <input
          required
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Код (например VECHERA10)"
          className="rounded-2xl border border-line bg-bg/40 px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <CustomSelect
          ariaLabel="Тип скидки"
          value={type}
          options={[
            { value: "percent", label: "Скидка %" },
            { value: "amount", label: "Скидка ₽" },
          ]}
          onChange={(v) => setType(v as CouponType)}
        />
        <input
          required
          type="number"
          min={1}
          max={type === "percent" ? 100 : undefined}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={type === "percent" ? "Процент" : "Сумма ₽"}
          className="rounded-2xl border border-line bg-bg/40 px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <input
          type="number"
          min={0}
          value={minOrder}
          onChange={(e) => setMinOrder(e.target.value)}
          placeholder="Мин. сумма заказа (необяз.)"
          className="rounded-2xl border border-line bg-bg/40 px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <input
          type="date"
          value={expiresAt}
          onChange={(e) => setExpiresAt(e.target.value)}
          className="rounded-2xl border border-line bg-bg/40 px-4 py-2.5 text-sm outline-none focus:border-accent"
          aria-label="Действует до"
        />
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Заметка (не видна гостю)"
          className="rounded-2xl border border-line bg-bg/40 px-4 py-2.5 text-sm outline-none focus:border-accent sm:col-span-2"
        />
        <button
          type="submit"
          disabled={saving}
          className="btn-soft sm:col-span-2 justify-self-start disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Добавить"}
        </button>
        {message && (
          <p className="text-xs text-ink-muted sm:col-span-2">{message}</p>
        )}
      </form>

      {loading ? (
        <p className="mt-8 text-ink-muted">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="mt-8 text-ink-muted">Пока нет промокодов.</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-soft)]"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold tracking-wide text-ink">{item.code}</p>
                <p className="mt-0.5 text-sm text-ink-muted">
                  {item.type === "percent"
                    ? `−${item.value}%`
                    : `−${item.value} ₽`}
                  {item.minOrder ? ` · от ${item.minOrder} ₽` : ""}
                  {item.expiresAt ? ` · до ${item.expiresAt}` : ""}
                  {item.note ? ` · ${item.note}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  void persist(
                    items.map((c) =>
                      c.id === item.id ? { ...c, active: !c.active } : c,
                    ),
                  )
                }
                className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                  item.active
                    ? "bg-success/15 text-success"
                    : "bg-danger/15 text-danger"
                }`}
              >
                {item.active ? "Включён" : "Выключен"}
              </button>
              <button
                type="button"
                onClick={() =>
                  void persist(items.filter((c) => c.id !== item.id))
                }
                className="btn-ghost btn-ghost-danger p-2"
                aria-label="Удалить"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AdminShell>
  );
}
