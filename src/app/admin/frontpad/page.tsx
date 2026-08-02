"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Plug, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { FRANCHISE_TAB_LABELS } from "@/lib/franchises";
import type { FranchiseId } from "@/lib/types";

type AccountPublic = {
  franchiseId: FranchiseId;
  configured: boolean;
  source: "admin" | "env" | "none";
  hint?: string;
  updatedAt?: string;
};

export default function AdminFrontPadPage() {
  const [accounts, setAccounts] = useState<AccountPublic[]>([]);
  const [dualAccounts, setDualAccounts] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<FranchiseId | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [secrets, setSecrets] = useState<Record<FranchiseId, string>>({
    center: "",
    hippodrome: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/frontpad");
      const data = (await res.json()) as {
        ok: boolean;
        accounts?: AccountPublic[];
        dualAccounts?: boolean;
      };
      if (res.ok && data.ok && data.accounts) {
        setAccounts(data.accounts);
        setDualAccounts(Boolean(data.dualAccounts));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSave(e: FormEvent, franchiseId: FranchiseId) {
    e.preventDefault();
    const secret = secrets[franchiseId].trim();
    if (!secret) {
      setMessage("Вставьте секрет из FrontPad → Настройки → API");
      return;
    }

    setSavingId(franchiseId);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/frontpad", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ franchiseId, secret }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        message?: string;
        accounts?: AccountPublic[];
      };
      if (!res.ok || !data.ok) {
        setMessage(data.message || "Не удалось сохранить");
        return;
      }
      if (data.accounts) setAccounts(data.accounts);
      setDualAccounts(
        Boolean(
          data.accounts?.find((a) => a.franchiseId === "center")?.configured &&
            data.accounts?.find((a) => a.franchiseId === "hippodrome")
              ?.configured,
        ),
      );
      setSecrets((prev) => ({ ...prev, [franchiseId]: "" }));
      setMessage(data.message || "Сохранено");
    } catch {
      setMessage("Сеть недоступна");
    } finally {
      setSavingId(null);
    }
  }

  async function onRemove(franchiseId: FranchiseId) {
    if (
      !confirm(
        `Удалить секрет «${FRANCHISE_TAB_LABELS[franchiseId]}» из админки? Будет использован .env, если задан.`,
      )
    ) {
      return;
    }
    setSavingId(franchiseId);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/frontpad?franchiseId=${encodeURIComponent(franchiseId)}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as {
        ok: boolean;
        accounts?: AccountPublic[];
      };
      if (res.ok && data.ok && data.accounts) {
        setAccounts(data.accounts);
        setMessage("Секрет удалён из админки");
      }
    } finally {
      setSavingId(null);
    }
  }

  return (
    <AdminShell
      active="frontpad"
      title="FrontPad"
      subtitle="Отдельный аккаунт FrontPad для каждой точки — заказы уходят в нужную программу"
      showLocationSwitcher={false}
    >
      {loading ? (
        <p className="mt-8 text-ink-muted">Загрузка…</p>
      ) : (
        <div className="mt-8 space-y-4">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              dualAccounts
                ? "border-[var(--green)]/40 bg-[var(--green-soft)]/50 text-[var(--green-deep)]"
                : "border-line bg-surface text-ink-muted"
            }`}
          >
            {dualAccounts ? (
              <span className="inline-flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Оба аккаунта подключены — центр и ипподром работают отдельно
              </span>
            ) : (
              <>
                Подключите секрет для{" "}
                {!accounts.find((a) => a.franchiseId === "hippodrome")?.configured
                  ? "ипподрома"
                  : "центра"}
                , чтобы заказы шли в правильный FrontPad.
              </>
            )}
          </div>

          {message && (
            <p className="rounded-xl border border-line bg-bg px-3 py-2 text-sm text-ink">
              {message}
            </p>
          )}

          {(["center", "hippodrome"] as const).map((franchiseId) => {
            const account = accounts.find((a) => a.franchiseId === franchiseId);
            const configured = account?.configured;
            const fromAdmin = account?.source === "admin";

            return (
              <section
                key={franchiseId}
                className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-soft)] sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink">
                      {FRANCHISE_TAB_LABELS[franchiseId]}
                    </h2>
                    <p className="mt-1 text-xs text-ink-muted">
                      {configured ? (
                        <>
                          Подключён
                          {account?.hint ? ` · ${account.hint}` : ""}
                          {fromAdmin
                            ? " · из админки"
                            : account?.source === "env"
                              ? " · из .env на сервере"
                              : ""}
                        </>
                      ) : (
                        "Не настроен — заказы в stub-режиме"
                      )}
                    </p>
                  </div>
                  {fromAdmin && (
                    <button
                      type="button"
                      onClick={() => void onRemove(franchiseId)}
                      disabled={savingId === franchiseId}
                      className="btn-ghost btn-ghost-danger text-xs"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Убрать из админки
                    </button>
                  )}
                </div>

                <form
                  onSubmit={(e) => void onSave(e, franchiseId)}
                  className="mt-4 space-y-3"
                >
                  <label className="block text-xs font-medium text-ink-muted">
                    Секрет API (FrontPad → Настройки → Общие → API)
                  </label>
                  <input
                    type="password"
                    autoComplete="off"
                    value={secrets[franchiseId]}
                    onChange={(e) =>
                      setSecrets((prev) => ({
                        ...prev,
                        [franchiseId]: e.target.value,
                      }))
                    }
                    placeholder={
                      configured
                        ? "Новый секрет (оставьте пустым, если не меняете)"
                        : "Вставьте секрет из FrontPad"
                    }
                    className="w-full rounded-2xl border border-line bg-bg/40 px-4 py-2.5 text-sm outline-none focus:border-accent"
                  />
                  <button
                    type="submit"
                    disabled={savingId === franchiseId}
                    className="btn-soft inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingId === franchiseId ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plug className="h-4 w-4" />
                    )}
                    {configured ? "Обновить и проверить" : "Подключить"}
                  </button>
                </form>
              </section>
            );
          })}

          <p className="text-xs text-ink-muted">
            Webhook статусов:{" "}
            <code className="rounded bg-bg px-1">https://vechera-cafe.ru/api/frontpad/webhook</code>
            . Укажите его в каждом аккаунте FrontPad (Настройки → API → Webhook url).
          </p>
        </div>
      )}
    </AdminShell>
  );
}
