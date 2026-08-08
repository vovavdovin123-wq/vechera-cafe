"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Loader2, RefreshCw } from "lucide-react";
import { FRANCHISE_TAB_LABELS } from "@/lib/franchises";
import {
  DEFAULT_CUSTOMER_STATUS,
  formatFrontPadStatus,
} from "@/lib/frontpad-status";
import type { FranchiseId } from "@/lib/types";

export type AccountOrder = {
  id: string;
  orderId: string;
  orderNumber?: string;
  franchiseId: FranchiseId;
  total: number;
  createdAt: string;
  fulfillment?: "delivery" | "pickup";
  frontpadStatus?: string;
  items: Array<{ name: string; quantity: number; price: number }>;
};

const DONE_STATUSES = new Set(["10", "11"]);

function isActiveOrder(order: AccountOrder): boolean {
  if (order.frontpadStatus && DONE_STATUSES.has(order.frontpadStatus)) {
    return false;
  }
  const age = Date.now() - new Date(order.createdAt).getTime();
  return age < 48 * 60 * 60 * 1000;
}

export function OrderHistoryCard({
  order,
  phone,
}: {
  order: AccountOrder;
  phone: string;
}) {
  const [open, setOpen] = useState(isActiveOrder(order));
  const [status, setStatus] = useState<string | null>(
    order.frontpadStatus
      ? formatFrontPadStatus(order.frontpadStatus, {
          fulfillment: order.fulfillment,
        })
      : null,
  );
  const [loading, setLoading] = useState(false);
  const active = isActiveOrder(order);

  const refreshStatus = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        orderId: order.orderId,
        phone,
        franchiseId: order.franchiseId,
      });
      if (order.orderNumber) qs.set("orderNumber", order.orderNumber);
      if (order.fulfillment) qs.set("fulfillment", order.fulfillment);

      const res = await fetch(`/api/frontpad/status?${qs}`);
      const data = (await res.json()) as { ok: boolean; status?: string };
      if (res.ok && data.ok && data.status) {
        setStatus(data.status);
      }
    } catch {
      setStatus(DEFAULT_CUSTOMER_STATUS);
    } finally {
      setLoading(false);
    }
  }, [active, order, phone]);

  useEffect(() => {
    if (!active) return;
    void refreshStatus();
    const id = setInterval(() => void refreshStatus(), 15000);
    return () => clearInterval(id);
  }, [active, refreshStatus]);

  const title = order.orderNumber
    ? `Заказ №${order.orderNumber}`
    : `Заказ ${order.orderId}`;

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-start gap-3 px-4 py-4 sm:px-5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="min-w-0 flex-1 text-left transition hover:opacity-80"
        >
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-ink">{title}</p>
            {active && status && (
              <span className="inline-flex rounded-full bg-[var(--gold-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--espresso)]">
                {status}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            {new Date(order.createdAt).toLocaleString("ru-RU")}
            {" · "}
            {FRANCHISE_TAB_LABELS[order.franchiseId]}
            {" · "}
            {order.fulfillment === "pickup" ? "Самовывоз" : "Доставка"}
          </p>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <p className="text-base font-bold text-[var(--espresso)]">
            {order.total} ₽
          </p>
          {active && (
            <button
              type="button"
              onClick={() => void refreshStatus()}
              disabled={loading}
              className="rounded-full p-1.5 text-ink-muted hover:bg-[var(--bg)] disabled:opacity-50"
              aria-label="Обновить статус"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-full p-1 text-ink-muted hover:bg-[var(--bg)]"
            aria-label={open ? "Свернуть" : "Развернуть"}
          >
            <ChevronDown
              className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {open && (
        <ul className="space-y-2 border-t border-[var(--line)]/80 px-4 py-3 text-sm sm:px-5">
          {order.items.map((item, idx) => (
            <li key={idx} className="flex justify-between gap-2 text-ink-muted">
              <span>
                {item.name} × {item.quantity}
              </span>
              <span className="shrink-0 font-medium text-ink">
                {item.price * item.quantity} ₽
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
