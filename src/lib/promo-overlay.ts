export type PromoOverlayTint = "green" | "orange" | "brown" | "none";

export const PROMO_OVERLAY_TINTS: {
  id: PromoOverlayTint;
  label: string;
  color: string;
}[] = [
  { id: "brown", label: "Эспрессо", color: "#281300" },
  { id: "orange", label: "Золото", color: "#f7bd51" },
  { id: "green", label: "Какао", color: "#5c4030" },
  { id: "none", label: "Кремовый", color: "#d4cec9" },
];

/**
 * Многоцветный градиент на весь слайд (без затемнения к прозрачному краю).
 * strength влияет на насыщенность, не на «затемнение в конце».
 */
export function overlayGradient(tint: PromoOverlayTint, strength: number): string {
  const s = Math.max(0, Math.min(100, strength)) / 100;
  // 0.55…1 — насколько «плотный» цвет
  const dense = 0.55 + s * 0.45;

  const mixes: Record<PromoOverlayTint, [string, string, string]> = {
    brown: [
      `color-mix(in srgb, #281300 ${Math.round(88 * dense)}%, #5c4030)`,
      `color-mix(in srgb, #5c4030 ${Math.round(70 * dense)}%, #f7bd51)`,
      `color-mix(in srgb, #f7bd51 ${Math.round(55 * dense)}%, #efe4db)`,
    ],
    orange: [
      `color-mix(in srgb, #f7bd51 ${Math.round(85 * dense)}%, #e5a83a)`,
      `color-mix(in srgb, #e5a83a ${Math.round(65 * dense)}%, #8a6b4a)`,
      `color-mix(in srgb, #5c4030 ${Math.round(75 * dense)}%, #281300)`,
    ],
    green: [
      `color-mix(in srgb, #5c4030 ${Math.round(85 * dense)}%, #281300)`,
      `color-mix(in srgb, #8a6b4a ${Math.round(70 * dense)}%, #f7bd51)`,
      `color-mix(in srgb, #f7bd51 ${Math.round(60 * dense)}%, #efe4db)`,
    ],
    none: [
      `color-mix(in srgb, #efe4db ${Math.round(90 * dense)}%, #d4cec9)`,
      `color-mix(in srgb, #d4cec9 ${Math.round(75 * dense)}%, #c4a574)`,
      `color-mix(in srgb, #c4a574 ${Math.round(55 * dense)}%, #8a6b4a)`,
    ],
  };

  const [a, b, c] = mixes[tint];
  return `linear-gradient(125deg, ${a} 0%, ${b} 48%, ${c} 100%)`;
}

export const DEFAULT_OVERLAY_TINT: PromoOverlayTint = "brown";
export const DEFAULT_OVERLAY_STRENGTH = 55;

/** Цветной градиент только если фото нет — иначе конфликтует с картинкой */
export function shouldShowPromoOverlay(image: string | undefined): boolean {
  return !image?.trim();
}

export const PROMO_PHOTO_HINT =
  "Рекомендуемый размер: 1400 × 600 px (горизонтальное фото). Минимум 1200 × 500 px. Формат JPG или PNG. Загружайте исходник крупнее — так фото не будет размытым на сайте.";
