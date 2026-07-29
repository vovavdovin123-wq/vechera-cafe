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
import { useCart } from "@/context/CartContext";
import { useFranchise } from "@/context/FranchiseContext";

export function CartDrawer() {
  const { franchise, franchiseId } = useFranchise();
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

  useEffect(() => {
    if (mode !== "delivery" || street.trim().length < 4) {
      setDeliveryCoords(null);
      return;
    }

    const timer = setTimeout(() => {
      fetch(
        `/api/geocode?${new URLSearchParams({
          address: street.trim(),
          franchiseId,
        })}`,
      )
        .then((r) => r.json())
        .then((d: { ok: boolean; coords?: [number, number] }) => {
          if (d.ok && d.coords) setDeliveryCoords(d.coords);
          else setDeliveryCoords(null);
        })
        .catch(() => setDeliveryCoords(null));
    }, 600);

    return () => clearTimeout(timer);
  }, [street, mode, franchiseId]);

  const mapMarkers = useMemo(() => {
    const cafe = {
      coords: franchise.coords,
      style: "pm2",
    };
    if (mode === "pickup") return [cafe];
    if (deliveryCoords) {
      return [cafe, { coords: deliveryCoords, style: "pm2rdm" }];
    }
    return [cafe];
  }, [franchise.coords, mode, deliveryCoords]);

  async function submitOrder(e: FormEvent) {
    e.preventDefault();
    if (!items.length) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          franchiseId,
          customerName: name || undefined,
          customerPhone: phone || undefined,
          fulfillment: mode,
          comment: addressNote || undefined,
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
          total,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setResult(data.message || "Не удалось оформить заказ");
        return;
      }
      setResult(
        data.orderNumber
          ? `Заказ №${data.orderNumber} принят`
          : `Заказ ${data.orderId} принят`,
      );
      clear();
      setStreet("");
      setEntrance("");
      setAddressNote("");
      setName("");
      setPhone("");
      setDeliveryCoords(null);
    } catch {
      setResult("Сеть недоступна. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const inputClass =
    "w-full rounded-2xl border border-line bg-bg/30 px-4 py-3 text-base outline-none placeholder:text-ink-muted focus:border-accent";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 md:p-6">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px] animate-fade"
        onClick={() => setOpen(false)}
      />

      <div className="relative flex max-h-[min(920px,100dvh)] w-full max-w-5xl flex-col overflow-hidden rounded-t-[24px] border border-line bg-surface shadow-2xl animate-rise sm:max-h-[min(920px,94vh)] sm:rounded-[28px]">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 z-20 rounded-full bg-surface/90 p-2 text-ink shadow-md sm:right-4 sm:top-4"
        >
          <X className="h-5 w-5" />
        </button>

        <form
          onSubmit={submitOrder}
          className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto overscroll-contain lg:w-[46%] lg:shrink-0"
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
            {mode === "delivery" ? (
              <>
                <input
                  required
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
                {street.trim().length >= 4 && !deliveryCoords && (
                  <p className="text-xs text-ink-muted">
                    Уточняем адрес на карте…
                  </p>
                )}
              </>
            ) : (
              <p className="rounded-2xl border border-line bg-bg/40 px-4 py-3 text-sm text-ink-muted">
                Заберите заказ по адресу:{" "}
                <span className="font-medium text-ink">{franchise.address}</span>
              </p>
            )}

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
              />
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
              <div className="mt-3 flex justify-between border-t border-line pt-2 text-sm font-semibold">
                <span>Итого</span>
                <span>{total} ₽</span>
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
                "Оплатить"
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

        <div className="relative hidden min-h-[420px] flex-1 lg:block">
          <CleanMap
            markers={mapMarkers}
            title={
              mode === "delivery"
                ? "Карта адреса доставки"
                : `Карта — ${franchise.shortAddress}`
            }
            className="absolute inset-0 h-full w-full rounded-none"
            zoom={deliveryCoords ? 15 : 16}
          />
        </div>
      </div>
    </div>
  );
}
