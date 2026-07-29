import type {
  FranchiseId,
  MenuCategory,
  MenuItem,
  VenueKind,
} from "./types";

export const CATEGORY_LABELS: Record<MenuCategory, string> = {
  sandwiches: "Сэндвичи",
  burgers: "Гамбургеры",
  rolls: "Роллы",
  pizzas: "Пиццы",
  waffles: "Вафли",
  coffee: "Кофе",
  tea: "Чай",
  cold: "Холодные",
};

export const CAFE_CATEGORY_ORDER: MenuCategory[] = [
  "sandwiches",
  "burgers",
  "rolls",
  "pizzas",
  "waffles",
];

export const COFFEE_CATEGORY_ORDER: MenuCategory[] = [
  "coffee",
  "tea",
  "cold",
];

export const CATEGORY_ORDER: MenuCategory[] = [
  ...CAFE_CATEGORY_ORDER,
  ...COFFEE_CATEGORY_ORDER,
];

export function categoriesForVenue(kind: VenueKind): MenuCategory[] {
  return kind === "coffee" ? COFFEE_CATEGORY_ORDER : CAFE_CATEGORY_ORDER;
}

/** Общее фото блюд (можно менять в админке у каждой позиции) */
const DISH_IMAGE = "/menu/dish.png";

export const CATEGORY_IMAGES: Record<MenuCategory, string> = {
  sandwiches: DISH_IMAGE,
  burgers: DISH_IMAGE,
  rolls: DISH_IMAGE,
  pizzas: DISH_IMAGE,
  waffles: DISH_IMAGE,
  coffee: DISH_IMAGE,
  tea: DISH_IMAGE,
  cold: DISH_IMAGE,
};

function item(
  partial: Omit<MenuItem, "image" | "available"> & { image?: string },
): MenuItem {
  return {
    ...partial,
    image: partial.image ?? CATEGORY_IMAGES[partial.category],
    available: true,
  };
}

const centerMenu: MenuItem[] = [
  item({
    id: "c-s-1",
    name: "Классический сэндвич",
    description: "Ветчина, сыр, свежие овощи",
    price: 320,
    category: "sandwiches",
    frontpadArticle: "10001",
  }),
  item({
    id: "c-s-2",
    name: "Куриный сэндвич",
    description: "Курица, салат, фирменный соус",
    price: 350,
    category: "sandwiches",
    frontpadArticle: "10002",
  }),
  item({
    id: "c-s-3",
    name: "Сэндвич с тунцом",
    description: "Тунец, яйцо, зелёный лук",
    price: 380,
    category: "sandwiches",
    frontpadArticle: "10003",
  }),
  item({
    id: "c-b-1",
    name: "Чизбургер",
    description: "Говядина, чеддер, соус",
    price: 420,
    category: "burgers",
    frontpadArticle: "10004",
  }),
  item({
    id: "c-b-2",
    name: "Чикенбургер",
    description: "Куриная котлета, салат, майонез",
    price: 390,
    category: "burgers",
    frontpadArticle: "10005",
  }),
  item({
    id: "c-r-1",
    name: "Филадельфия",
    description: "Лосось, сыр, огурец",
    price: 520,
    category: "rolls",
    frontpadArticle: "10006",
  }),
  item({
    id: "c-r-2",
    name: "Калифорния",
    description: "Краб, авокадо, икра тобико",
    price: 480,
    category: "rolls",
    frontpadArticle: "10007",
  }),
  item({
    id: "c-p-1",
    name: "Маргарита",
    description: "Томаты, моцарелла, базилик",
    price: 450,
    category: "pizzas",
    frontpadArticle: "10008",
  }),
  item({
    id: "c-p-2",
    name: "Пепперони",
    description: "Колбаса пепперони, сыр",
    price: 520,
    category: "pizzas",
    frontpadArticle: "10009",
  }),
  item({
    id: "c-w-1",
    name: "Вафля с нутеллой",
    description: "Вафля, нутелла, банан",
    price: 280,
    category: "waffles",
    frontpadArticle: "10010",
  }),
  item({
    id: "c-w-2",
    name: "Вафля с ягодами",
    description: "Свежие ягоды, сливки",
    price: 310,
    category: "waffles",
    frontpadArticle: "10011",
  }),
  item({
    id: "c-w-3",
    name: "Вафля карамель",
    description: "Карамель, орехи, мороженое",
    price: 340,
    category: "waffles",
    frontpadArticle: "10012",
  }),
];

const hippodromeMenu: MenuItem[] = [
  item({
    id: "h-s-1",
    name: "Сэндвич BBQ",
    description: "Говядина, BBQ-соус, лук",
    price: 360,
    category: "sandwiches",
    frontpadArticle: "20001",
  }),
  item({
    id: "h-s-2",
    name: "Вегетарианский",
    description: "Хумус, овощи гриль, зелень",
    price: 300,
    category: "sandwiches",
    frontpadArticle: "20002",
  }),
  item({
    id: "h-b-1",
    name: "Дабл бургер",
    description: "Две котлеты, двойной сыр",
    price: 560,
    category: "burgers",
    frontpadArticle: "20003",
  }),
  item({
    id: "h-b-2",
    name: "Острый бургер",
    description: "Халапеньо, острый соус",
    price: 470,
    category: "burgers",
    frontpadArticle: "20004",
  }),
  item({
    id: "h-b-3",
    name: "Классик бургер",
    description: "Говядина, огурец, кетчуп",
    price: 410,
    category: "burgers",
    frontpadArticle: "20005",
  }),
  item({
    id: "h-r-1",
    name: "Дракон",
    description: "Угорь, авокадо, унаги",
    price: 590,
    category: "rolls",
    frontpadArticle: "20006",
  }),
  item({
    id: "h-r-2",
    name: "Спайси ролл",
    description: "Лосось, спайси-майонез",
    price: 510,
    category: "rolls",
    frontpadArticle: "20007",
  }),
  item({
    id: "h-r-3",
    name: "Овощной ролл",
    description: "Огурец, авокадо, перец",
    price: 350,
    category: "rolls",
    frontpadArticle: "20008",
  }),
  item({
    id: "h-p-1",
    name: "Четыре сыра",
    description: "Моцарелла, дорблю, пармезан, чеддер",
    price: 580,
    category: "pizzas",
    frontpadArticle: "20009",
  }),
  item({
    id: "h-p-2",
    name: "Мясная",
    description: "Салями, бекон, ветчина",
    price: 620,
    category: "pizzas",
    frontpadArticle: "20010",
  }),
  item({
    id: "h-w-1",
    name: "Вафля шоколад",
    description: "Тёмный шоколад, стружка",
    price: 290,
    category: "waffles",
    frontpadArticle: "20011",
  }),
  item({
    id: "h-w-2",
    name: "Вафля мёд-орех",
    description: "Мёд, грецкий орех, сливки",
    price: 320,
    category: "waffles",
    frontpadArticle: "20012",
  }),
];

const centerCoffeeMenu: MenuItem[] = [
  item({
    id: "cc-c-1",
    name: "Эспрессо",
    description: "Двойной шот",
    price: 150,
    category: "coffee",
    frontpadArticle: "30001",
  }),
  item({
    id: "cc-c-2",
    name: "Американо",
    description: "Эспрессо, вода",
    price: 180,
    category: "coffee",
    frontpadArticle: "30002",
  }),
  item({
    id: "cc-c-3",
    name: "Капучино",
    description: "Эспрессо, молоко, пенка",
    price: 220,
    category: "coffee",
    frontpadArticle: "30003",
  }),
  item({
    id: "cc-c-4",
    name: "Латте",
    description: "Эспрессо, молоко",
    price: 240,
    category: "coffee",
    frontpadArticle: "30004",
  }),
  item({
    id: "cc-t-1",
    name: "Чёрный чай",
    description: "Классический листовой",
    price: 160,
    category: "tea",
    frontpadArticle: "30005",
  }),
  item({
    id: "cc-t-2",
    name: "Зелёный чай",
    description: "Сенча",
    price: 160,
    category: "tea",
    frontpadArticle: "30006",
  }),
  item({
    id: "cc-d-1",
    name: "Айс-латте",
    description: "Холодный латте со льдом",
    price: 260,
    category: "cold",
    frontpadArticle: "30007",
  }),
  item({
    id: "cc-d-2",
    name: "Лимонад домашний",
    description: "Лимон, мята, сироп",
    price: 230,
    category: "cold",
    frontpadArticle: "30008",
  }),
];

const hippodromeCoffeeMenu: MenuItem[] = [
  item({
    id: "hc-c-1",
    name: "Эспрессо",
    description: "Двойной шот",
    price: 150,
    category: "coffee",
    frontpadArticle: "40001",
  }),
  item({
    id: "hc-c-2",
    name: "Американо",
    description: "Эспрессо, вода",
    price: 180,
    category: "coffee",
    frontpadArticle: "40002",
  }),
  item({
    id: "hc-c-3",
    name: "Флэт уайт",
    description: "Двойной эспрессо, молоко",
    price: 250,
    category: "coffee",
    frontpadArticle: "40003",
  }),
  item({
    id: "hc-c-4",
    name: "Раф",
    description: "Эспрессо, сливки, ваниль",
    price: 280,
    category: "coffee",
    frontpadArticle: "40004",
  }),
  item({
    id: "hc-t-1",
    name: "Чай облепиховый",
    description: "Облепиха, мёд",
    price: 220,
    category: "tea",
    frontpadArticle: "40005",
  }),
  item({
    id: "hc-t-2",
    name: "Чай имбирный",
    description: "Имбирь, лимон, мёд",
    price: 220,
    category: "tea",
    frontpadArticle: "40006",
  }),
  item({
    id: "hc-d-1",
    name: "Айс-американо",
    description: "Холодный американо со льдом",
    price: 200,
    category: "cold",
    frontpadArticle: "40007",
  }),
  item({
    id: "hc-d-2",
    name: "Милкшейк",
    description: "Молоко, мороженое, сироп",
    price: 290,
    category: "cold",
    frontpadArticle: "40008",
  }),
];

export const INITIAL_MENUS: Record<FranchiseId, MenuItem[]> = {
  center: centerMenu,
  centerCoffee: centerCoffeeMenu,
  hippodrome: hippodromeMenu,
  hippodromeCoffee: hippodromeCoffeeMenu,
};
