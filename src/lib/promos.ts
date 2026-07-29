import {
  DEFAULT_OVERLAY_STRENGTH,
  DEFAULT_OVERLAY_TINT,
  type PromoOverlayTint,
} from "./promo-overlay";

export interface PromoSlide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  image: string;
  overlayTint: PromoOverlayTint;
  overlayStrength: number;
  /** @deprecated старое поле, не используется */
  tone?: string;
}

const PROMO_IMAGE = "/promos/promo-sub-photo.jpg";

const base = {
  image: PROMO_IMAGE,
  overlayTint: DEFAULT_OVERLAY_TINT,
  overlayStrength: DEFAULT_OVERLAY_STRENGTH,
};

export const PROMO_SLIDES: PromoSlide[] = [
  {
    id: "p1",
    title: "Акция «Сендвич с лимонадом»",
    subtitle: "Купи сендвич с курицей и получи сок в подарок",
    badge: "Акция",
    ...base,
  },
  {
    id: "p2",
    title: "2 вафли = −15%",
    subtitle: "Возьмите две вафли — третья позиция со скидкой",
    badge: "Сладкое",
    ...base,
    overlayTint: "orange",
  },
  {
    id: "p3",
    title: "Комбо на компанию",
    subtitle: "Бургер + напиток выгоднее, чем по отдельности",
    badge: "Комбо",
    ...base,
    overlayTint: "brown",
  },
  {
    id: "p4",
    title: "Ролл дня −50 ₽",
    subtitle: "Каждый день новая позиция со специальной ценой",
    badge: "Сегодня",
    ...base,
    overlayTint: "green",
    overlayStrength: 30,
  },
];
