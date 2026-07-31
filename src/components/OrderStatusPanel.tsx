"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";

const STORAGE_KEY = "vechera-last-order";

export type TrackedOrder = {
  orderId: string;
  orderNumber?: string;
  phone?: string;
  at: string;
};

export function saveTrackedOrder(order: TrackedOrder) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    /* ignore */
  }
}

export function loadTrackedOrder(): TrackedOrder | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TrackedOrder;
  } catch {
    return null;
  }
}

export function clearTrackedOrder() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Статус заказа из FrontPad — только по кнопке / редкий опрос, без циклов. */
export function OrderStatusPanel({
  order,
  onDismiss,
}: {
  order: TrackedOrder;
  onDismiss?: () => void;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const qs = new URLSearchParams();
      if (order.orderId) qs.set("orderId", order.orderId);
      else if (order.phone) qs.set("phone", order.phone);
      const res = await fetch(`/api/frontpad/status?${qs}`);
      const data = (await res.json()) as {
        ok: boolean;
        status?: string;
        message?: string;
      };
      if (!res.ok || !data.ok) {
        setMessage(data.message || "Не удалось получить статус");
        return;
      }
      setStatus(data.status || "Принят");
    } catch {
      setMessage("Сеть недоступна");
    } finally {
      setLoading(false);
    }
  }, [order.orderId, order.phone]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold-soft)]/40 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Статус заказа
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-ink">
            {order.orderNumber
              ? `№${order.orderNumber}`
              : `ID ${order.orderId}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          className="rounded-full border border-line bg-surface p-2 text-ink-muted transition hover:text-ink disabled:opacity-50"
          aria-label="Обновить статус"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </button>
      </div>
      <p className="mt-3 text-base font-medium text-ink">
        {status ?? (loading ? "Загружаем…" : "—")}
      </p>
      {message && <p className="mt-1 text-xs text-danger">{message}</p>}
      <p className="mt-2 text-xs text-ink-muted">
        Статус обновляется из FrontPad. Нажмите кнопку обновления.
      </p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-3 text-xs text-ink-muted underline underline-offset-2 hover:text-ink"
        >
          Скрыть
        </button>
      )}
    </div>
  );
}
