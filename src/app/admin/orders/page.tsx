"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { AdminShell, useAdminAuth } from "@/components/AdminShell";
import { FRANCHISE_TAB_LABELS } from "@/lib/franchises";
import type { StoredOrder } from "@/lib/orders-store";
import type { FranchiseId } from "@/lib/types";

export default function AdminOrdersPage() {
  return (
    <AdminShell
      active="orders"
      title="Заказы"
      subtitle="Заказы с сайта · обновляются автоматически"
      showLocationSwitcher={false}
    >
      <OrdersList />
    </AdminShell>
  );
}

function FranchiseBadge({ franchiseId }: { franchiseId: FranchiseId }) {
  const label = FRANCHISE_TAB_LABELS[franchiseId] ?? franchiseId;
  const isCenter = franchiseId === "center";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        isCenter
          ? "bg-[var(--green-soft)] text-[var(--green-dark)]"
          : "bg-[var(--orange-soft)] text-[var(--ink)]"
      }`}
    >
      {label}
    </span>
  );
}

function OrdersList() {
  const [items, setItems] = useState<StoredOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const auth = useAdminAuth();

  function load() {
    setLoading(true);
    fetch("/api/orders")
      .then((r) => r.json())
      .then((d: { ok: boolean; items?: StoredOrder[] }) => {
        if (d.ok && d.items) setItems(d.items);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (auth !== "ok") return;
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [auth]);

  async function remove(id: string) {
    if (!confirm("Удалить этот заказ?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/orders?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok: boolean };
      if (res.ok && data.ok) {
        setItems((prev) => prev.filter((o) => o.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-8">
      {loading && items.length === 0 ? (
        <p className="text-ink-muted">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="text-ink-muted">Пока нет заказов.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-soft)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-ink">
                    {order.frontpadOrderNumber
                      ? `№${order.frontpadOrderNumber}`
                      : order.orderId}
                  </p>
                  <FranchiseBadge franchiseId={order.franchiseId} />
                  {order.frontpadMode === "live" ? (
                    <span className="rounded-full bg-[var(--green-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--green-dark)]">
                      FrontPad
                    </span>
                  ) : (
                    <span className="rounded-full bg-bg px-2 py-0.5 text-[10px] font-semibold text-ink-muted">
                      stub
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--green-deep)]">
                    {order.total} ₽
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(order.id)}
                    disabled={deletingId === order.id}
                    className="btn-ghost btn-ghost-danger disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Удалить
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
                <span>
                  {new Date(order.createdAt).toLocaleString("ru-RU")}
                </span>
                <span>
                  {order.fulfillment === "pickup" ? "Самовывоз" : "Доставка"}
                </span>
                {order.frontpadStatus !== undefined && (
                  <span>Статус FP: {order.frontpadStatus}</span>
                )}
              </div>
              {(order.customerName || order.customerPhone) && (
                <p className="mt-2 text-sm text-ink-muted">
                  {order.customerName || "Без имени"}
                  {order.customerPhone ? ` · ${order.customerPhone}` : ""}
                </p>
              )}
              {order.address?.street && (
                <p className="mt-1 text-sm text-ink">
                  {order.address.street}
                  {order.address.entrance
                    ? `, подъезд ${order.address.entrance}`
                    : ""}
                </p>
              )}
              <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                {order.items.map((item) => (
                  <li
                    key={`${order.id}-${item.id}`}
                    className="flex justify-between gap-2"
                  >
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span className="shrink-0 font-medium">
                      {item.price * item.quantity} ₽
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
