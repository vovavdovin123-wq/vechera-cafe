"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Loader2,
  Minus,
  Plus,
  Store,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { CleanMap } from "@/components/CleanMap";
import { CustomDateTimePicker } from "@/components/CustomDateTimePicker";
import {
  clearTrackedOrder,
  loadTrackedOrder,
  OrderStatusPanel,
  saveTrackedOrder,
  type TrackedOrder,
} from "@/components/OrderStatusPanel";
import { useCart } from "@/context/CartContext";
import { getStoredFranchiseId, useFranchise } from "@/context/FranchiseContext";
import { useUser } from "@/context/UserContext";
import { franchiseFromOrderItems } from "@/lib/order-franchise";
import {
  loadCheckoutDraft,
  saveCheckoutDraft,
} from "@/lib/checkout-storage";
import { sanitizeCustomerMessage } from "@/lib/customer-messages";

type PromoState =
  | { kind: "none" }
  | { kind: "sale"; code: string; percent: number }
  | { kind: "amount"; code: string; amount: number };

function toFrontPadDatetime(localValue: string): string | undefined {
  if (!localValue) return undefined;
  const [date, time] = localValue.split("T");
  if (!date || !time) return undefined;
  const hm = time.length === 5 ? `${time}:00` : time;
  return `${date} ${hm}`;
}

function minPreorderLocal(): string {
  const d = new Date(Date.now() + 45 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const minutes = d.getMinutes();
  const rounded = Math.ceil(minutes / 30) * 30;
  if (rounded === 60) {
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
  } else {
    d.setMinutes(rounded);
  }
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function maxPreorderLocal(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const minutes = d.getMinutes();
  const rounded = Math.floor(minutes / 30) * 30;
  d.setMinutes(rounded);
  d.setSeconds(0, 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CartDrawer() {
  const { franchise, franchiseId } = useFranchise();
  const { user } = useUser();
  const {
    items,
    total,
    count,
    isOpen,
    setOpen,
    updateQty,
    removeItem,
    clear,
  } = useCart();

  const [mode, setMode] = useState<"delivery" | "pickup">("delivery");
  const [street, setStreet] = useState("");
  const [entrance, setEntrance] = useState("");
  const [addressNote, setAddressNote] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [deliveryCoords, setDeliveryCoords] = useState<[number, number] | null>(
    null,
  );
  const [geocodeHint, setGeocodeHint] = useState<string | null>(null);

  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<PromoState>({ kind: "none" });
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const [wantPreorder, setWantPreorder] = useState(false);
  const [preorderAt, setPreorderAt] = useState("");

  const [tracked, setTracked] = useState<TrackedOrder | null>(null);

  useEffect(() => {
    const draft = loadCheckoutDraft();
    if (draft.name) setName(draft.name);
    if (draft.phone) setPhone(draft.phone);
    if (draft.street) setStreet(draft.street);
    if (draft.entrance) setEntrance(draft.entrance);
    if (draft.addressNote) setAddressNote(draft.addressNote);
    if (draft.mode) setMode(draft.mode);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (user.name) setName(user.name);
    if (user.phoneDisplay) setPhone(user.phoneDisplay);
  }, [user]);

  useEffect(() => {
    saveCheckoutDraft({
      name,
      phone,
      street,
      entrance,
      addressNote,
      mode,
    });
  }, [name, phone, street, entrance, addressNote, mode]);

  useEffect(() => {
    if (isOpen) setTracked(loadTrackedOrder());
  }, [isOpen]);

  useEffect(() => {
    if (mode !== "delivery" || street.trim().length < 4) {
      setDeliveryCoords(null);
      setGeocodeHint(null);
      return;
    }

    setGeocodeHint("Ищем адрес на карте…");
    const timer = setTimeout(() => {
      fetch(
        `/api/geocode?${new URLSearchParams({
          address: street.trim(),
          franchiseId,
        })}`,
      )
        .then((r) => r.json())
        .then((d: { ok: boolean; coords?: [number, number]; message?: string }) => {
          if (d.ok && d.coords) {
            setDeliveryCoords(d.coords);
            setGeocodeHint("Адрес отмечен на карте");
          } else {
            setDeliveryCoords(null);
            setGeocodeHint(d.message || "Адрес не найден — уточните улицу и дом");
          }
        })
        .catch(() => {
          setDeliveryCoords(null);
          setGeocodeHint("Не удалось проверить адрес");
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [street, mode, franchiseId]);

  const discount = useMemo(() => {
    if (promo.kind === "sale") {
      return Math.min(total, Math.round((total * promo.percent) / 100));
    }
    if (promo.kind === "amount") {
      return Math.min(total, Math.round(promo.amount));
    }
    return 0;
  }, [promo, total]);

  const payable = Math.max(0, total - discount);

  const mapMarkers = useMemo(() => {
    const cafe = {
      coords: franchise.coords,
      style: "pm2",
    };
    if (mode === "pickup") return [cafe];
    if (deliveryCoords) {
      return [
        cafe,
        { coords: deliveryCoords, style: "pm2rdm" },
      ];
    }
    return [cafe];
  }, [franchise.coords, mode, deliveryCoords]);

  const deliveryMapZoom = deliveryCoords ? 15 : 16;

  async function applyPromo() {
    const code = promoInput.trim();
    if (!code) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await fetch(
        `/api/coupons/validate?${new URLSearchParams({
          code,
          total: String(total),
        })}`,
      );
      const data = (await res.json()) as {
        ok: boolean;
        kind?: "sale" | "amount";
        percent?: number;
        amount?: number;
        code?: string;
        message?: string;
      };
      if (!res.ok || !data.ok) {
        setPromo({ kind: "none" });
        setPromoError(data.message || "Промокод недействителен");
        return;
      }
      if (data.kind === "sale" && data.percent) {
        setPromo({
          kind: "sale",
          code: data.code || code.toUpperCase(),
          percent: data.percent,
        });
      } else if (data.kind === "amount" && data.amount) {
        setPromo({
          kind: "amount",
          code: data.code || code.toUpperCase(),
          amount: data.amount,
        });
      } else {
        setPromo({ kind: "none" });
        setPromoError("Не удалось применить промокод");
      }
    } catch {
      setPromoError("Сеть недоступна");
    } finally {
      setPromoLoading(false);
    }
  }

  async function submitOrder(e: FormEvent) {
    e.preventDefault();
    if (!items.length) return;
    setLoading(true);
    setResult(null);

    const cartItems = items.map((i) => ({ id: i.menuItem.id }));
    const orderFranchiseId =
      franchiseFromOrderItems(cartItems) ??
      getStoredFranchiseId() ??
      franchiseId;

    try {
      const promoNote =
        promo.kind !== "none" ? `Промокод ${promo.code}` : undefined;
      const commentParts = [addressNote, promoNote].filter(Boolean);

      const payload: Record<string, unknown> = {
        franchiseId: orderFranchiseId,
        customerName: name || undefined,
        customerPhone: phone || undefined,
        fulfillment: mode,
        comment: commentParts.length ? commentParts.join(". ") : undefined,
        address:
          mode === "delivery"
            ? {
                street: street || undefined,
                entrance: entrance || undefined,
                note: addressNote || undefined,
              }
            : { street: franchise.address },
        items: items.map((i) => ({
          id: i.menuItem.id,
          name: i.menuItem.name,
          price: i.menuItem.price,
          quantity: i.quantity,
          frontpadArticle: i.menuItem.frontpadArticle,
        })),
        total: payable,
      };

      if (promo.kind === "sale") {
        payload.salePercent = promo.percent;
      } else if (promo.kind === "amount") {
        payload.saleAmount = promo.amount;
      }

      if (wantPreorder && preorderAt) {
        const dt = toFrontPadDatetime(preorderAt);
        if (dt) payload.datetime = dt;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setResult(
          sanitizeCustomerMessage(
            data.message,
            "Не удалось оформить заказ",
          ),
        );
        return;
      }

      const track: TrackedOrder = {
        orderId: String(data.orderId),
        orderNumber: data.orderNumber ? String(data.orderNumber) : undefined,
        phone: phone || undefined,
        franchiseId: orderFranchiseId,
        fulfillment: mode,
        mode: data.mode === "live" ? "live" : "stub",
        at: new Date().toISOString(),
      };
      saveTrackedOrder(track);
      setTracked(track);

      setResult(
        data.orderNumber
          ? `Заказ №${data.orderNumber} принят`
          : "Заказ принят",
      );
      clear();
      setStreet("");
      setEntrance("");
      setAddressNote("");
      setDeliveryCoords(null);
      setGeocodeHint(null);
      setPromo({ kind: "none" });
      setPromoInput("");
      setWantPreorder(false);
      setPreorderAt("");
    } catch {
      setResult("Сеть недоступна. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const inputClass =
    "w-full rounded-2xl border border-line bg-bg/30 px-4 py-3 text-base outline-none placeholder:text-ink-muted focus:border-accent";

  const mapTitle =
    mode === "delivery"
      ? "Карта адреса доставки"
      : `Карта — ${franchise.shortAddress}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px] animate-fade"
        onClick={() => setOpen(false)}
      />

      <div className="relative flex max-h-[min(920px,100dvh)] w-full max-w-5xl flex-col overflow-hidden rounded-t-[24px] border border-line bg-surface shadow-2xl animate-rise sm:max-h-[min(920px,94vh)] sm:rounded-[28px] lg:flex-row">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-20 rounded-full bg-surface/90 p-2 text-ink shadow-md sm:right-4 sm:top-4"
        >
          <X className="h-5 w-5" />
        </button>

        <form
          onSubmit={submitOrder}
          className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain lg:w-[46%] lg:shrink-0 lg:flex-none"
        >
          <div className="border-b border-line px-4 py-4 pr-12 sm:px-7 sm:py-5">
            <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
              {mode === "delivery" ? "Адрес доставки" : "Самовывоз"}
            </h2>

            <div className="mt-3 grid grid-cols-2 gap-1 rounded-2xl bg-bg-deep p-1 sm:mt-4">
              <button
                type="button"
                onClick={() => setMode("delivery")}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-sm font-medium transition sm:gap-2 sm:px-3 sm:text-base ${
                  mode === "delivery"
                    ? "bg-surface text-ink shadow-sm"
                    : "text-ink-muted"
                }`}
              >
                <Truck className="h-4 w-4 shrink-0 text-[var(--orange)]" />
                Доставка
              </button>
              <button
                type="button"
                onClick={() => setMode("pickup")}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-sm font-medium transition sm:gap-2 sm:px-3 sm:text-base ${
                  mode === "pickup"
                    ? "bg-surface text-ink shadow-sm"
                    : "text-ink-muted"
                }`}
              >
                <Store className="h-4 w-4 shrink-0" />
                Самовывоз
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 px-4 py-4 sm:px-7">
            {tracked && (
              <OrderStatusPanel
                order={tracked}
                onDismiss={() => {
                  clearTrackedOrder();
                  setTracked(null);
                }}
              />
            )}

            {mode === "delivery" ? (
              <>
                <input
                  required={items.length > 0}
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Улица и дом"
                  className={inputClass}
                />
                <input
                  value={entrance}
                  onChange={(e) => setEntrance(e.target.value)}
                  placeholder="Подъезд"
                  className={inputClass}
                />
                <input
                  value={addressNote}
                  onChange={(e) => setAddressNote(e.target.value)}
                  placeholder="Комментарий к адресу"
                  className={inputClass}
                />
                {geocodeHint && (
                  <p
                    className={`text-xs ${
                      deliveryCoords ? "text-success" : "text-ink-muted"
                    }`}
                  >
                    {geocodeHint}
                  </p>
                )}
              </>
            ) : (
              <p className="rounded-2xl border border-line bg-bg/40 px-4 py-3 text-sm text-ink-muted">
                Заберите заказ по адресу:{" "}
                <span className="font-medium text-ink">{franchise.address}</span>
              </p>
            )}

            {/* Карта на телефоне — сразу под адресом */}
            <div className="h-48 overflow-hidden rounded-2xl border border-line lg:hidden">
              <CleanMap
                markers={mapMarkers}
                title={mapTitle}
                className="h-full w-full"
                zoom={deliveryMapZoom}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Имя"
                className={inputClass}
              />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Телефон"
                className={inputClass}
                required={items.length > 0}
              />
            </div>

            <div className="rounded-2xl border border-line bg-bg/30 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
                Промокод
              </p>
              <div className="flex gap-2">
                <input
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="Введите промокод"
                  className={`${inputClass} py-2.5`}
                />
                <button
                  type="button"
                  onClick={() => void applyPromo()}
                  disabled={promoLoading || !promoInput.trim()}
                  className="shrink-0 rounded-2xl border border-line bg-surface px-3 text-sm font-medium disabled:opacity-50"
                >
                  {promoLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "ОК"
                  )}
                </button>
              </div>
              {promoError && (
                <p className="mt-1.5 text-xs text-danger">{promoError}</p>
              )}
              {promo.kind === "sale" && (
                <p className="mt-1.5 text-xs text-success">
                  Скидка {promo.percent}%
                </p>
              )}
              {promo.kind === "amount" && (
                <p className="mt-1.5 text-xs text-success">
                  Скидка {promo.amount} ₽
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-line bg-bg/30 p-3">
              <label className="flex cursor-pointer items-center gap-3">
                <span
                  className={`relative flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${
                    wantPreorder ? "bg-[var(--espresso)]" : "bg-[var(--line)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={wantPreorder}
                    onChange={(e) => {
                      setWantPreorder(e.target.checked);
                      if (e.target.checked && !preorderAt) {
                        setPreorderAt(minPreorderLocal());
                      }
                    }}
                    className="peer sr-only"
                  />
                  <span
                    className={`absolute h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                      wantPreorder ? "translate-x-[22px]" : "translate-x-0.5"
                    }`}
                  />
                </span>
                <span className="text-sm font-medium text-ink">
                  Предзаказ на время
                </span>
              </label>
              {wantPreorder && (
                <div className="mt-3">
                  <CustomDateTimePicker
                    value={preorderAt}
                    onChange={setPreorderAt}
                    min={minPreorderLocal()}
                    max={maxPreorderLocal()}
                    required
                  />
                  <p className="mt-2 text-xs text-ink-muted">
                    Можно заказать не раньше чем через 45 минут и не позже чем на
                    24 часа вперёд.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-1 rounded-2xl border border-line bg-bg/30 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
                Корзина · {count} поз.
              </p>
              {items.length === 0 ? (
                <p className="py-4 text-center text-sm text-ink-muted">
                  Корзина пуста
                </p>
              ) : (
                <ul className="max-h-40 space-y-2 overflow-y-auto">
                  {items.map(({ menuItem, quantity }) => (
                    <li
                      key={menuItem.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {menuItem.name}
                      </span>
                      <button
                        type="button"
                        className="rounded-full border border-line p-0.5"
                        onClick={() => updateQty(menuItem.id, quantity - 1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-xs font-semibold">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        className="rounded-full border border-line p-0.5"
                        onClick={() => updateQty(menuItem.id, quantity + 1)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-14 text-right text-xs font-semibold">
                        {menuItem.price * quantity} ₽
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(menuItem.id)}
                        className="text-ink-muted hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-3 space-y-1 border-t border-line pt-2 text-sm">
                {discount > 0 && (
                  <div className="flex justify-between text-ink-muted">
                    <span>Скидка</span>
                    <span>−{discount} ₽</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold">
                  <span>Итого</span>
                  <span>{payable} ₽</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-auto border-t border-line px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-7">
            <button
              type="submit"
              disabled={!items.length || loading}
              className="btn-soft w-full gap-2 uppercase tracking-wide disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Оформить заказ"
              )}
            </button>
            <p className="mt-2 text-center text-xs text-ink-muted">
              Оплата от платёжного сервиса — подключим позже
            </p>
            {result && (
              <p className="mt-2 text-center text-sm text-ink-muted">{result}</p>
            )}
          </div>
        </form>

        {/* Карта справа на десктопе */}
        <div className="relative hidden min-h-[420px] flex-1 bg-bg-deep lg:block">
          <CleanMap
            markers={mapMarkers}
            title={mapTitle}
            className="absolute inset-0 h-full w-full rounded-none"
            zoom={deliveryMapZoom}
          />
        </div>
      </div>
    </div>
  );
}
