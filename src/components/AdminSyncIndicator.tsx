"use client";

import { useMenu } from "@/context/MenuContext";
import { useInterior } from "@/context/InteriorContext";
import { usePromos } from "@/context/PromoContext";

export function AdminSyncIndicator() {
  const { syncStatus: menuStatus } = useMenu();
  const { syncStatus: interiorStatus } = useInterior();
  const { syncStatus: promoStatus } = usePromos();

  const statuses = [menuStatus, interiorStatus, promoStatus];
  const saving = statuses.includes("saving");
  const loading = statuses.includes("loading");
  const error = statuses.includes("error");

  if (!loading && !saving && !error) return null;

  let text = "";
  if (loading) text = "Загрузка данных…";
  if (saving) text = "Сохранение…";
  if (error) text = "Ошибка сохранения — войдите заново в админку";

  return (
    <p
      className={`mt-2 text-xs ${
        error ? "text-danger" : saving ? "text-[var(--orange-dark)]" : "text-ink-muted"
      }`}
    >
      {text}
    </p>
  );
}
