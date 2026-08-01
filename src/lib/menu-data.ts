import type { FranchiseId, MenuCategory, MenuItem } from "./types";

export const CATEGORY_LABELS: Record<MenuCategory, string> = {
  sandwiches: "Сэндвичи",
  burgers: "Бургеры",
  panini: "Панини",
  fryBoxes: "Фри-боксы",
  waffles: "Венские вафли",
  salads: "Салаты",
  fried: "Фритюр",
  sauces: "Соусы",
  rolls: "Роллы",
  pizzas: "Пицца",
  coffeeShop: "Кофейня",
};

export const CATEGORY_ORDER: MenuCategory[] = [
  "sandwiches",
  "burgers",
  "panini",
  "fryBoxes",
  "waffles",
  "salads",
  "fried",
  "sauces",
  "rolls",
  "pizzas",
  "coffeeShop",
];

/** Общее фото блюд (можно менять в админке у каждой позиции) */
const DISH_IMAGE = "/menu/dish.png";

export const CATEGORY_IMAGES: Record<MenuCategory, string> = {
  sandwiches: DISH_IMAGE,
  burgers: DISH_IMAGE,
  panini: DISH_IMAGE,
  fryBoxes: DISH_IMAGE,
  waffles: DISH_IMAGE,
  salads: DISH_IMAGE,
  fried: DISH_IMAGE,
  sauces: DISH_IMAGE,
  rolls: DISH_IMAGE,
  pizzas: DISH_IMAGE,
  coffeeShop: DISH_IMAGE,
};

const CATEGORY_ID: Record<MenuCategory, string> = {
  sandwiches: "sw",
  burgers: "bg",
  panini: "pn",
  fryBoxes: "fb",
  waffles: "wf",
  salads: "sl",
  fried: "fr",
  sauces: "sc",
  rolls: "rl",
  pizzas: "pz",
  coffeeShop: "cs",
};

function item(
  partial: Omit<MenuItem, "image" | "available" | "description"> & {
    image?: string;
    description?: string;
  },
): MenuItem {
  return {
    ...partial,
    description: partial.description ?? "Состав уточняется",
    image: partial.image ?? CATEGORY_IMAGES[partial.category],
    available: true,
  };
}

/** Позиции с фото меню (обе точки) */
const MENU_CATALOG: Array<{
  name: string;
  price: number;
  category: MenuCategory;
}> = [
  // Сэндвичи
  { name: "Сендвич с курицей", price: 290, category: "sandwiches" },
  { name: "Двойной с курицей", price: 370, category: "sandwiches" },
  { name: "Сендвич с говядиной", price: 350, category: "sandwiches" },
  { name: "Двойной с говядиной", price: 420, category: "sandwiches" },
  { name: "Смешанный", price: 390, category: "sandwiches" },
  { name: "Сендвич с семгой", price: 300, category: "sandwiches" },
  // Бургеры
  { name: "Чизбургер", price: 330, category: "burgers" },
  { name: "Чикен бургер", price: 270, category: "burgers" },
  { name: "«Бейрут» бургер", price: 350, category: "burgers" },
  // Панини
  { name: "Панини с курицей", price: 280, category: "panini" },
  { name: "Панини с ветчиной", price: 300, category: "panini" },
  // Фри-боксы
  { name: "Баварский", price: 350, category: "fryBoxes" },
  { name: "Чикен", price: 300, category: "fryBoxes" },
  { name: "Деревенский", price: 250, category: "fryBoxes" },
  // Венские вафли
  { name: "Вафля с нутеллой", price: 200, category: "waffles" },
  { name: "Вафля банан-нутелла", price: 250, category: "waffles" },
  { name: "Вафля клубника нутелла", price: 300, category: "waffles" },
  { name: "Вафля банан-клубника", price: 270, category: "waffles" },
  { name: "Доп. мороженое", price: 50, category: "waffles" },
  // Салаты
  { name: "Цезарь с курицей", price: 270, category: "salads" },
  { name: "Цезарь с креветками", price: 300, category: "salads" },
  { name: "Свежий", price: 230, category: "salads" },
  { name: "Греческий", price: 250, category: "salads" },
  // Фритюр
  { name: "Картофель фри", price: 180, category: "fried" },
  { name: "Наггетсы", price: 200, category: "fried" },
  { name: "Стрипсы", price: 190, category: "fried" },
  { name: "Сырные палочки", price: 180, category: "fried" },
  // Соусы
  { name: "Сырный", price: 40, category: "sauces" },
  { name: "Томатный", price: 40, category: "sauces" },
  { name: "Основной", price: 40, category: "sauces" },
  { name: "Доп. Халапеньо", price: 40, category: "sauces" },
  // Роллы
  { name: "Филадельфия", price: 370, category: "rolls" },
  { name: "Филадельфия люкс", price: 380, category: "rolls" },
  { name: "Филадельфия с креветкой", price: 420, category: "rolls" },
  { name: "Запеченная Филадельфия", price: 400, category: "rolls" },
  { name: "Филадельфия с угрем", price: 390, category: "rolls" },
  { name: "Калифорния с семгой", price: 370, category: "rolls" },
  { name: "Калифорния с креветкой", price: 370, category: "rolls" },
  { name: "Калифорния с крабом", price: 330, category: "rolls" },
  { name: "Калифорния с угрем", price: 390, category: "rolls" },
  { name: "Жареный с семгой", price: 370, category: "rolls" },
  { name: "Жареный с креветкой", price: 370, category: "rolls" },
  { name: "Жареный с крабом", price: 330, category: "rolls" },
  { name: "Жареный с угрем", price: 390, category: "rolls" },
  { name: "Жареный Цезарь", price: 340, category: "rolls" },
  { name: "Спайси с семгой", price: 350, category: "rolls" },
  { name: "Спайси с креветкой", price: 350, category: "rolls" },
  { name: "Спайси с крабом", price: 330, category: "rolls" },
  { name: "Спайси с угрем", price: 370, category: "rolls" },
  { name: "Запеченный краб", price: 350, category: "rolls" },
  { name: "Запеченный с креветкой", price: 370, category: "rolls" },
  { name: "Запеченный с семгой", price: 370, category: "rolls" },
  { name: "Запеченный с угрем", price: 400, category: "rolls" },
  { name: "Онигири с семгой", price: 380, category: "rolls" },
  { name: "Онигири с креветкой", price: 370, category: "rolls" },
  { name: "Онигири с крабом", price: 350, category: "rolls" },
  { name: "Онигири цезарь", price: 320, category: "rolls" },
  { name: "Онигири с угрем", price: 430, category: "rolls" },
  // Пицца
  { name: "Маргарита", price: 470, category: "pizzas" },
  { name: "Пепперони", price: 530, category: "pizzas" },
  { name: "5 сыров", price: 530, category: "pizzas" },
  { name: "Ветчина-грибы", price: 550, category: "pizzas" },
  { name: "Цезарь", price: 480, category: "pizzas" },
];

function buildFranchiseMenu(
  prefix: "c" | "h",
  articleBase: number,
): MenuItem[] {
  const counters: Partial<Record<MenuCategory, number>> = {};

  return MENU_CATALOG.map((entry, index) => {
    const next = (counters[entry.category] ?? 0) + 1;
    counters[entry.category] = next;

    return item({
      id: `${prefix}-${CATEGORY_ID[entry.category]}-${next}`,
      name: entry.name,
      price: entry.price,
      category: entry.category,
      frontpadArticle: String(articleBase + index + 1),
    });
  });
}

export const INITIAL_MENUS: Record<FranchiseId, MenuItem[]> = {
  center: buildFranchiseMenu("c", 10000),
  hippodrome: buildFranchiseMenu("h", 20000),
};
