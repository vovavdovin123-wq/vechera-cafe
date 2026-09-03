"use client";

import { AdminShell } from "@/components/AdminShell";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function AdminSettingsPage() {
  const { settings, updateSettings } = useSiteSettings();

  return (
    <AdminShell
      active="settings"
      title="Настройки"
      subtitle="Доставка и общие параметры сайта"
      showLocationSwitcher={false}
    >
      <section className="mt-6 max-w-xl rounded-[22px] border border-line bg-surface p-4 shadow-[var(--shadow-soft)] sm:p-6">
        <h2 className="font-display text-lg font-semibold text-[var(--espresso)]">
          Доставка
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Текст и сумма показываются в корзине перед оформлением заказа.
        </p>

        <label className="mt-5 block text-sm font-medium text-ink">
          Стоимость доставки, ₽
          <input
            type="number"
            min={0}
            step={1}
            value={settings.deliveryFee}
            onChange={(e) =>
              updateSettings({ deliveryFee: Number(e.target.value) || 0 })
            }
            className="admin-input mt-1.5 w-full"
          />
        </label>

        <label className="mt-4 block text-sm font-medium text-ink">
          Текст уведомления
          <textarea
            value={settings.deliveryNote}
            onChange={(e) => updateSettings({ deliveryNote: e.target.value })}
            rows={3}
            className="admin-input mt-1.5 w-full resize-y"
            placeholder="Доставка по Беслану — 200 ₽"
          />
        </label>

        <div className="mt-4 rounded-xl border border-line bg-bg/40 px-3 py-2.5 text-sm text-ink-muted">
          Предпросмотр:{" "}
          <span className="font-medium text-ink">
            {settings.deliveryNote || `Доставка — ${settings.deliveryFee} ₽`}
          </span>
        </div>
      </section>
    </AdminShell>
  );
}
