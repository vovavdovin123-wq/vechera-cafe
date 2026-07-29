"use client";

import { useEffect, useRef } from "react";
import { useAdminAuth } from "@/components/AdminShell";

const POLL_MS = 12000;
const SEEN_KEY = "vechera-admin-seen-orders";

export function AdminOrderAlerts() {
  const auth = useAdminAuth();
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (auth !== "ok") return;

    try {
      const saved = localStorage.getItem(SEEN_KEY);
      if (saved) {
        seenRef.current = new Set(JSON.parse(saved) as string[]);
      }
    } catch {
      /* ignore */
    }

    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }

    let firstPoll = true;

    async function poll() {
      try {
        const res = await fetch("/api/orders");
        const data = (await res.json()) as {
          ok: boolean;
          items?: Array<{ id: string; orderId: string; total: number }>;
        };
        if (!res.ok || !data.ok || !data.items) return;

        if (firstPoll) {
          for (const order of data.items) seenRef.current.add(order.id);
          firstPoll = false;
          localStorage.setItem(
            SEEN_KEY,
            JSON.stringify([...seenRef.current].slice(-200)),
          );
          return;
        }

        const fresh = data.items.filter((o) => !seenRef.current.has(o.id));
        if (fresh.length === 0) return;

        for (const order of fresh.reverse()) {
          seenRef.current.add(order.id);
          if (Notification.permission === "granted") {
            new Notification("Новый заказ — Вечера", {
              body: `${order.orderId} · ${order.total} ₽`,
              tag: order.id,
            });
          }
        }

        localStorage.setItem(
          SEEN_KEY,
          JSON.stringify([...seenRef.current].slice(-200)),
        );
      } catch {
        /* ignore */
      }
    }

    void poll();
    const id = setInterval(poll, POLL_MS);
    return () => clearInterval(id);
  }, [auth]);

  return null;
}
