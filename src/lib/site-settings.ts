export type SiteSettings = {
  /** Стоимость доставки, ₽ */
  deliveryFee: number;
  /** Текст уведомления в корзине */
  deliveryNote: string;
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  deliveryFee: 200,
  deliveryNote: "Доставка по Беслану — 200 ₽",
};

export function normalizeSiteSettings(
  raw: Partial<SiteSettings> | null | undefined,
): SiteSettings {
  const fee = Number(raw?.deliveryFee);
  return {
    deliveryFee: Number.isFinite(fee) && fee >= 0 ? Math.round(fee) : DEFAULT_SITE_SETTINGS.deliveryFee,
    deliveryNote:
      typeof raw?.deliveryNote === "string" && raw.deliveryNote.trim()
        ? raw.deliveryNote.trim()
        : DEFAULT_SITE_SETTINGS.deliveryNote,
  };
}
