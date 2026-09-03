"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useInterior } from "@/context/InteriorContext";
import { useMenu } from "@/context/MenuContext";
import { usePromos } from "@/context/PromoContext";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export function AdminSaveBar() {
  const menu = useMenu();
  const interior = useInterior();
  const promos = usePromos();
  const settings = useSiteSettings();
  const [msg, setMsg] = useState<string | null>(null);

  const dirtySources: string[] = [];
  if (menu.isDirty) dirtySources.push("меню");
  if (interior.isDirty) dirtySources.push("интерьер");
  if (promos.isDirty) dirtySources.push("акции");
  if (settings.isDirty) dirtySources.push("настройки");

  const isDirty = dirtySources.length > 0;
  const saving =
    menu.syncStatus === "saving" ||
    interior.syncStatus === "saving" ||
    promos.syncStatus === "saving" ||
    settings.syncStatus === "saving";

  if (!isDirty && !msg) return null;

  async function onSave() {
    setMsg(null);
    const results: string[] = [];
    let failed = false;

    if (menu.isDirty) {
      const ok = await menu.saveMenus();
      if (ok) results.push("меню");
      else failed = true;
    }
    if (interior.isDirty) {
      const ok = await interior.saveInterior();
      if (ok) results.push("интерьер");
      else failed = true;
    }
    if (promos.isDirty) {
      const ok = await promos.savePromos();
      if (ok) results.push("акции");
      else failed = true;
    }
    if (settings.isDirty) {
      const ok = await settings.saveSettings();
      if (ok) results.push("настройки");
      else failed = true;
    }

    if (failed) {
      setMsg("Не удалось сохранить — войдите заново");
      return;
    }
    setMsg(results.length ? `Сохранено: ${results.join(", ")}` : "Сохранено");
    window.setTimeout(() => setMsg(null), 2500);
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-4">
      <div className="pointer-events-auto flex w-full max-w-lg items-center gap-3 rounded-2xl border border-[var(--gold)]/40 bg-[var(--espresso)] px-4 py-3 text-white shadow-2xl animate-rise">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {isDirty ? "Есть несохранённые изменения" : "Готово"}
          </p>
          <p className="truncate text-xs text-white/70">
            {msg
              ? msg
              : isDirty
                ? dirtySources.join(", ")
                : "Все изменения сохранены"}
          </p>
        </div>
        {isDirty && (
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[var(--gold)] px-3.5 py-2.5 text-sm font-semibold text-[var(--espresso)] transition hover:brightness-105 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Сохранить
          </button>
        )}
      </div>
    </div>
  );
}
