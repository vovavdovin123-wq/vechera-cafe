"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { AdminShell, useAdminAuth } from "@/components/AdminShell";
import { FRANCHISE_TAB_LABELS } from "@/lib/franchises";
import type { FranchiseId } from "@/lib/types";

interface FeedbackItem {
  id: string;
  franchiseId: FranchiseId;
  message: string;
  name?: string;
  phone?: string;
  createdAt: string;
}

export default function AdminFeedbackPage() {
  return (
    <AdminShell
      active="feedback"
      title="Обратная связь"
      subtitle="Сообщения с сайта"
      showLocationSwitcher={false}
    >
      <FeedbackList />
    </AdminShell>
  );
}

function FeedbackList() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const auth = useAdminAuth();

  function load() {
    setLoadingList(true);
    fetch("/api/feedback")
      .then((r) => r.json())
      .then((d: { ok: boolean; items?: FeedbackItem[] }) => {
        if (d.ok && d.items) setItems(d.items);
      })
      .finally(() => setLoadingList(false));
  }

  useEffect(() => {
    if (auth !== "ok") return;
    load();
  }, [auth]);

  async function remove(id: string) {
    if (!confirm("Удалить это сообщение?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/feedback?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { ok: boolean };
      if (res.ok && data.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mt-8">
      {loadingList ? (
        <p className="text-ink-muted">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="text-ink-muted">Пока нет сообщений.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-soft)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                  <span>{new Date(item.createdAt).toLocaleString("ru-RU")}</span>
                  <span className="rounded-full bg-[var(--green-soft)] px-2.5 py-0.5 font-semibold text-[var(--green-dark)]">
                    {FRANCHISE_TAB_LABELS[item.franchiseId] ?? item.franchiseId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => remove(item.id)}
                  disabled={deletingId === item.id}
                  className="btn-ghost btn-ghost-danger disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Удалить
                </button>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-ink">{item.message}</p>
              {(item.name || item.phone) && (
                <p className="mt-2 text-sm text-ink-muted">
                  {item.name || "Аноним"}
                  {item.phone ? ` · ${item.phone}` : ""}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
