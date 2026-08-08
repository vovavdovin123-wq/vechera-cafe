"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowLeft, Loader2, MapPin, Package, Phone, UserRound } from "lucide-react";
import {
  AccountSidebar,
  type AccountSection,
} from "@/components/account/AccountSidebar";
import {
  OrderHistoryCard,
  type AccountOrder,
} from "@/components/account/OrderHistoryCard";
import { CartDrawer } from "@/components/CartDrawer";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { useUser } from "@/context/UserContext";
import { FRANCHISE_TAB_LABELS } from "@/lib/franchises";
import { saveCheckoutDraft } from "@/lib/checkout-storage";
import { PAGE } from "@/lib/layout";
import type { FranchiseId } from "@/lib/types";

const DONE_STATUSES = new Set(["10", "11"]);

function isActiveOrder(order: AccountOrder): boolean {
  if (order.frontpadStatus && DONE_STATUSES.has(order.frontpadStatus)) {
    return false;
  }
  const age = Date.now() - new Date(order.createdAt).getTime();
  return age < 48 * 60 * 60 * 1000;
}

type ClientProfile = {
  name?: string;
  address?: string;
  sale?: string;
  score?: string;
  franchiseId?: FranchiseId;
};

const SECTION_TITLES: Record<AccountSection, string> = {
  orders: "Активные заказы",
  addresses: "Адрес доставки",
  profile: "Личные данные",
};

export default function AccountPage() {
  const { user, ready, login, register, logout, updateProfile } = useUser();
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [section, setSection] = useState<AccountSection>("orders");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [clientProfile, setClientProfile] = useState<ClientProfile | null>(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      setClientProfile(null);
      return;
    }

    setOrdersLoading(true);
    fetch("/api/account/orders")
      .then((r) => r.json())
      .then((d: { ok: boolean; items?: AccountOrder[] }) => {
        if (d.ok && d.items) setOrders(d.items);
      })
      .finally(() => setOrdersLoading(false));

    setClientLoading(true);
    fetch("/api/account/client")
      .then((r) => r.json())
      .then(
        (d: {
          ok: boolean;
          client?: ClientProfile | null;
          franchiseId?: FranchiseId;
        }) => {
          if (d.ok && d.client) {
            setClientProfile({ ...d.client, franchiseId: d.franchiseId });
          } else {
            setClientProfile(null);
          }
        },
      )
      .finally(() => setClientLoading(false));
  }, [user]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || clientProfile?.name || "");
    }
  }, [user, clientProfile?.name]);

  async function saveProfileName(e: FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    const result = await updateProfile(profileName.trim());
    if (result.ok) {
      setProfileMsg("Сохранено");
      saveCheckoutDraft({ name: profileName.trim() });
      setClientProfile((prev) =>
        prev ? { ...prev, name: profileName.trim() } : prev,
      );
    } else {
      setProfileMsg(result.message ?? "Не удалось сохранить");
    }
    setProfileSaving(false);
  }

  const { activeOrders, pastOrders } = useMemo(() => {
    const active: AccountOrder[] = [];
    const past: AccountOrder[] = [];
    for (const order of orders) {
      (isActiveOrder(order) ? active : past).push(order);
    }
    return { activeOrders: active, pastOrders: past };
  }, [orders]);

  async function onAuthSubmit(e: FormEvent) {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    const result =
      authMode === "login"
        ? await login(phone, password)
        : await register(name.trim(), phone, password, passwordConfirm);

    if (!result.ok) {
      setAuthError(result.message ?? "Ошибка");
    } else {
      setPassword("");
      setPasswordConfirm("");
    }
    setAuthLoading(false);
  }

  function switchAuthMode(mode: "login" | "register") {
    setAuthMode(mode);
    setAuthError(null);
    setPassword("");
    setPasswordConfirm("");
  }

  const inputClass =
    "w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3.5 text-base outline-none placeholder:text-ink-muted focus:border-[var(--gold)]";

  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-[#f3f0ec] pb-12 pt-6 sm:pt-8">
        <div className={PAGE}>
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-ink-muted transition hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>

          {!ready ? (
            <div className="flex justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-ink-muted" />
            </div>
          ) : !user ? (
            <div className="mx-auto max-w-md">
              <div className="rounded-3xl bg-white px-6 py-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] sm:px-8 sm:py-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--gold-soft)] text-[var(--espresso)]">
                  <UserRound className="h-8 w-8" />
                </div>

                <div className="mt-5 flex rounded-2xl bg-[var(--bg)]/80 p-1">
                  {(
                    [
                      ["login", "Вход"],
                      ["register", "Регистрация"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => switchAuthMode(id)}
                      className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition ${
                        authMode === id
                          ? "bg-white text-[var(--espresso)] shadow-sm"
                          : "text-ink-muted hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <h1 className="mt-5 text-center font-display text-2xl font-semibold text-ink sm:text-3xl">
                  {authMode === "login" ? "Вход" : "Регистрация"}
                </h1>

                <form onSubmit={onAuthSubmit} className="mt-6 space-y-3">
                  {authMode === "register" && (
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Имя"
                      autoComplete="name"
                      required
                      className={inputClass}
                    />
                  )}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Пароль"
                    type="password"
                    autoComplete={
                      authMode === "login" ? "current-password" : "new-password"
                    }
                    required
                    minLength={6}
                    className={inputClass}
                  />
                  {authMode === "register" && (
                    <input
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      placeholder="Подтверждение пароля"
                      type="password"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      className={inputClass}
                    />
                  )}
                  {authError && (
                    <p className="text-center text-sm text-[var(--danger)]">
                      {authError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="btn-soft mt-2 inline-flex w-full items-center justify-center gap-2 py-3.5 text-base disabled:opacity-50"
                  >
                    {authLoading && (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    )}
                    {authMode === "login" ? "Войти" : "Зарегистрироваться"}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="mx-auto flex max-w-5xl flex-col gap-5 lg:flex-row lg:items-start">
              <AccountSidebar
                user={user}
                section={section}
                onSectionChange={setSection}
                onLogout={() => void logout()}
              />

              <div className="min-w-0 flex-1 lg:pt-1">
                <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">
                  {SECTION_TITLES[section]}
                </h1>

                {section === "orders" && (
                  <div className="mt-6 space-y-8">
                    {ordersLoading ? (
                      <div className="flex justify-center py-16">
                        <Loader2 className="h-7 w-7 animate-spin text-ink-muted" />
                      </div>
                    ) : orders.length === 0 ? (
                      <div className="rounded-3xl bg-white px-5 py-14 text-center shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                        <Package className="mx-auto h-10 w-10 text-ink-muted" />
                        <p className="mt-4 font-medium text-ink">
                          Заказов пока нет
                        </p>
                        <p className="mt-1 text-sm text-ink-muted">
                          Оформите заказ — он появится здесь
                        </p>
                        <Link
                          href="/"
                          className="btn-soft mt-5 inline-flex items-center gap-2"
                        >
                          В меню
                        </Link>
                      </div>
                    ) : (
                      <>
                        {activeOrders.length > 0 && (
                          <ul className="space-y-3">
                            {activeOrders.map((order) => (
                              <li key={order.id}>
                                <OrderHistoryCard
                                  order={order}
                                  phone={user.phone}
                                />
                              </li>
                            ))}
                          </ul>
                        )}

                        {activeOrders.length === 0 && (
                          <p className="text-sm text-ink-muted">
                            Сейчас нет активных заказов
                          </p>
                        )}

                        {pastOrders.length > 0 && (
                          <section>
                            <h2 className="text-lg font-bold text-ink">
                              История заказов
                            </h2>
                            <ul className="mt-4 space-y-3">
                              {pastOrders.map((order) => (
                                <li key={order.id}>
                                  <OrderHistoryCard
                                    order={order}
                                    phone={user.phone}
                                  />
                                </li>
                              ))}
                            </ul>
                          </section>
                        )}
                      </>
                    )}
                  </div>
                )}

                {section === "addresses" && (
                  <div className="mt-6">
                    <div className="rounded-3xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--gold-soft)] text-[var(--espresso)]">
                          <MapPin className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          {clientLoading ? (
                            <p className="text-sm text-ink-muted">Загрузка…</p>
                          ) : clientProfile?.address ? (
                            <>
                              <p className="text-base font-medium leading-relaxed text-ink">
                                {clientProfile.address}
                              </p>
                              {clientProfile.franchiseId && (
                                <p className="mt-2 text-sm text-ink-muted">
                                  {FRANCHISE_TAB_LABELS[clientProfile.franchiseId]}
                                </p>
                              )}
                              <p className="mt-4 text-xs text-ink-muted">
                                Адрес сохраняется после заказа с доставкой
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-ink">
                                Адрес не сохранён
                              </p>
                              <p className="mt-2 text-sm text-ink-muted">
                                Оформите заказ с доставкой — адрес подтянется
                                автоматически
                              </p>
                              <Link
                                href="/"
                                className="btn-soft mt-5 inline-flex items-center gap-2 text-sm"
                              >
                                Перейти в меню
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {section === "profile" && (
                  <div className="mt-6 space-y-4">
                    <form
                      onSubmit={saveProfileName}
                      className="rounded-3xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[var(--gold-soft)] text-[var(--espresso)]">
                          <UserRound className="h-7 w-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-ink-muted">
                            Телефон
                          </p>
                          <p className="mt-0.5 flex items-center gap-1.5 text-base font-semibold text-ink">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {user.phoneDisplay}
                          </p>
                        </div>
                      </div>

                      <label className="mt-5 block">
                        <span className="text-sm font-medium text-ink-muted">
                          Имя
                        </span>
                        <input
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          placeholder="Имя"
                          className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-base outline-none placeholder:text-ink-muted focus:border-[var(--gold)]"
                        />
                      </label>

                      {profileMsg && (
                        <p
                          className={`mt-3 text-sm ${
                            profileMsg === "Сохранено"
                              ? "text-[var(--success)]"
                              : "text-[var(--danger)]"
                          }`}
                        >
                          {profileMsg}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={profileSaving || !profileName.trim()}
                        className="btn-soft mt-4 inline-flex items-center gap-2 disabled:opacity-50"
                      >
                        {profileSaving && (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Сохранить
                      </button>
                    </form>

                    {(clientProfile?.score || clientProfile?.sale) && (
                      <div className="rounded-3xl bg-white p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]">
                        <p className="text-sm font-semibold text-ink">Бонусы</p>
                        <div className="mt-3 flex flex-wrap gap-6 text-sm">
                          {clientProfile.score && (
                            <div>
                              <p className="text-ink-muted">Баллы</p>
                              <p className="mt-0.5 text-lg font-semibold text-ink">
                                {clientProfile.score}
                              </p>
                            </div>
                          )}
                          {clientProfile.sale && (
                            <div>
                              <p className="text-ink-muted">Скидка</p>
                              <p className="mt-0.5 text-lg font-semibold text-ink">
                                {clientProfile.sale}%
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
      <CartDrawer />
    </>
  );
}
