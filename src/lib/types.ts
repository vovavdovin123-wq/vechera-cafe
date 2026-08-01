export type FranchiseId = "center" | "hippodrome";

export type MenuCategory =
  | "sandwiches"
  | "burgers"
  | "panini"
  | "fryBoxes"
  | "waffles"
  | "salads"
  | "fried"
  | "sauces"
  | "rolls"
  | "pizzas"
  | "coffeeShop";

export interface MenuItem {
  id: string;
  name: string;
  /** Состав — показывается только в FAQ (!) */
  description: string;
  price: number;
  category: MenuCategory;
  image: string;
  available: boolean;
  /** Цифровой артикул товара в FrontPad (обязателен для боевых заказов) */
  frontpadArticle?: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
}

export interface Franchise {
  id: FranchiseId;
  name: string;
  /** Полный адрес для карты и блока «Как добраться» */
  address: string;
  /** Короткое имя для переключателя в шапке */
  shortAddress: string;
  hours: string;
  phone: string;
  telegram: string;
  /** Координаты [долгота, широта] для Яндекс.Карт */
  coords: [number, number];
  mapLink: string;
}

export interface OrderPayload {
  franchiseId: FranchiseId;
  customerName?: string;
  customerPhone?: string;
  /** Email — только если в FrontPad включено автосохранение клиентов */
  customerEmail?: string;
  comment?: string;
  fulfillment?: "delivery" | "pickup";
  address?: {
    street?: string;
    apartment?: string;
    entrance?: string;
    floor?: string;
    doorCode?: string;
    note?: string;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    frontpadArticle?: string;
    /** Индекс родителя в product[] для модификатора (product_mod) */
    frontpadModParentIndex?: number;
  }>;
  total: number;
  /** Скидка % (1–100). Нельзя вместе с saleAmount */
  salePercent?: number;
  /** Скидка суммой. Нельзя вместе с salePercent */
  saleAmount?: number;
  /** Баллы лояльности к списанию */
  score?: number;
  /** Карта клиента (до 16 цифр) */
  card?: string;
  /** Номер сертификата */
  certificate?: string;
  /** Кол-во персон */
  person?: number;
  /** Код варианта оплаты из справочника FrontPad */
  pay?: string;
  /** Предзаказ: ГГГГ-ММ-ДД ЧЧ:ММ:СС, макс. +30 дней */
  datetime?: string;
}

export interface FeedbackPayload {
  franchiseId: FranchiseId;
  message: string;
  name?: string;
  phone?: string;
}
