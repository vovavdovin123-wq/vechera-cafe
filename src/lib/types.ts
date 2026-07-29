export type FranchiseId = "center" | "hippodrome";

export type MenuCategory =
  | "sandwiches"
  | "burgers"
  | "rolls"
  | "pizzas"
  | "waffles"
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
  }>;
  total: number;
}

export interface FeedbackPayload {
  franchiseId: FranchiseId;
  message: string;
  name?: string;
  phone?: string;
}
