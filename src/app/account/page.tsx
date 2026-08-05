"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Loader2,
  LogOut,
  Package,
  UserRound,
} from "lucide-react";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { useUser } from "@/context/UserContext";
import { FRANCHISE_TAB_LABELS } from "@/lib/franchises";
import { formatFrontPadStatus } from "@/lib/frontpad-status";
import { PAGE } from "@/lib/layout";
import type { FranchiseId } from "@/lib/types";

type OrderRow = {
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

export default function AccountPage() {
  const { user, ready, login, logout } = useUser();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    setOrdersLoading(true);
    fetch("/api/account/orders")
      .then((r) => r.json())
      .then((d: { ok: boolean; items?: OrderRow[] }) => {
        if (d.ok && d.items) setOrders(d.items);
      })
      .finally(() => setOrdersLoading(false));
  }, [user]);

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    const result = await login(phone, name.trim() || undefined);
    if (!result.ok) setAuthError(result.message ?? "Ошибка входа");
    setAuthLoading(false);
  }

  const inputClass =
    "w-full rounded-2xl border border-line bg-bg/30 px-4 py-3 text-base outline-none placeholder:text-ink-muted focus:border-accent";

  return (
    <>
      <Header />
      <main className={`${PAGE} py-8 sm:py-10`}>
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>

        <div className="mx-auto max-w-2xl">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold text-[var(--espresso)] sm:text-4xl">
                Личный кабинет
              </h1>
              <p className="mt-2 text-sm text-ink-muted sm:text-base">
                История заказов по номеру телефона
              </p>
            </div>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--gold-soft)] text-[var(--espresso)]">
              <UserRound className="h-6 w-6" />
            </div>
          </div>

          {!ready ? (
            <p className="mt-10 text-ink-muted">Загрузка…</p>
          ) : !user ? (
            <section className="mt-8 rounded-[22px] border border-line bg-surface p-5 shadow-[var(--shadow-soft)] sm:p-6">
              <h2 className="font-display text-xl font-semibold text-[var(--espresso)]">
                Вход
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Укажите телефон — без SMS и пароля. Заказы с этого номера
                появятся в истории.
              </p>

              <form onSubmit={onLogin} className="mt-5 space-y-3">
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (900) 000-00-00"
                  type="tel"
                  autoComplete="tel"
                  required
                  className={inputClass}
                />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Имя (необязательно)"
                  autoComplete="name"
                  className={inputClass}
                />
                {authError && (
                  <p className="text-sm text-[var(--danger)]">{authError}</p>
                )}
                <button
                  type="submit"
                  disabled={authLoading}
                  className="btn-soft inline-flex w-full items-center justify-center gap-2 disabled:opacity-50"
                >
                  {authLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Войти
                </button>
              </form>
            </section>
          ) : (
            <>
              <section className="mt-8 rounded-[22px] border border-line bg-surface p-5 shadow-[var(--shadow-soft)] sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-ink-muted">Вы вошли как</p>
                    <p className="mt-1 text-lg font-semibold text-ink">
                      {user.name || "Гость"}
                    </p>
                    <p className="text-sm text-ink-muted">{user.phoneDisplay}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="btn-ghost inline-flex items-center gap-2 text-sm"
                  >
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </button>
                </div>
              </section>

              <section className="mt-6">
                <h2 className="font-display text-xl font-semibold text-[var(--espresso)]">
                  История заказов
                </h2>

                {ordersLoading ? (
                  <p className="mt-4 text-ink-muted">Загрузка заказов…</p>
                ) : orders.length === 0 ? (
                  <div className="mt-4 rounded-[22px] border border-dashed border-line bg-bg/40 px-5 py-10 text-center">
                    <Package className="mx-auto h-8 w-8 text-ink-muted" />
                    <p className="mt-3 text-ink-muted">
                      Пока нет заказов с этого номера
                    </p>
                    <Link
                      href="/"
                      className="btn-soft mt-4 inline-flex items-center gap-2"
                    >
                      Перейти в меню
                    </Link>
                  </div>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {orders.map((order) => (
                      <li
                        key={order.id}
                        className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-soft)]"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-ink">
                              {order.orderNumber
                                ? `Заказ №${order.orderNumber}`
                                : order.orderId}
                            </p>
                            <p className="mt-1 text-xs text-ink-muted">
                              {new Date(order.createdAt).toLocaleString("ru-RU")}
                              {" · "}
                              {FRANCHISE_TAB_LABELS[order.franchiseId]}
                              {" · "}
                              {order.fulfillment === "pickup"
                                ? "Самовывоз"
                                : "Доставка"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-[var(--green-deep)]">
                              {order.total} ₽
                            </p>
                            {order.frontpadStatus && (
                              <p className="mt-1 text-xs text-ink-muted">
                                {formatFrontPadStatus(order.frontpadStatus, {
                                  fulfillment: order.fulfillment,
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                        <ul className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
                          {order.items.map((item, idx) => (
                            <li
                              key={`${order.id}-${idx}`}
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
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
