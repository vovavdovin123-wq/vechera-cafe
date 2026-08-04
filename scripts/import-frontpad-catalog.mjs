import fs from "fs";
import path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");

function parseHtmlCatalog(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].slice(1);
  const items = [];

  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      m[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .trim(),
    );
    if (cells.length < 5) continue;

    const [category, name, priceRaw, , article] = cells;
    if (!name || !article || !/^\d+$/.test(article)) continue;

    const price = Number(String(priceRaw).replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(price) || price <= 0) continue;

    items.push({
      fpCategory: category.trim(),
      name: name.trim(),
      price: Math.round(price),
      frontpadArticle: article.trim(),
    });
  }

  return items;
}

function resolveCategory(franchise, fpCategory, name) {
  const n = name.toLowerCase().replace(/ё/g, "е");

  if (/хот[\s—-]?дог/.test(n)) return "hotDogs";
  if (/сендвич|сандвич/.test(n)) return "sandwiches";
  if (/бургер|бейрут|чикен/.test(n) && /бургер|бейрут/.test(n)) return "burgers";
  if (/чизбургер/.test(n)) return "burgers";
  if (/панини/.test(n)) return "panini";
  if (/пицц/.test(n)) return "pizzas";
  if (/онигири/.test(n)) return "rolls";
  if (
    /ролл|филадель|калифор|спайси|жарен|запеч|филад|микс/.test(n) &&
    !/сендвич|сандвич/.test(n)
  ) {
    return "rolls";
  }
  if (/салат|цезарь|греческ|свежий/.test(n) && !/сендвич|ролл/.test(n)) {
    return "salads";
  }
  if (/соус|холопеньо/.test(n)) return "sauces";
  if (/бокс|бавар|чикен-бокс/.test(n)) return "fryBoxes";
  if (/вафл/.test(n)) return "waffles";
  if (/фри|наггет|стрип|крыл|палочк|картош/.test(n)) return "fried";

  const fp = fpCategory.toLowerCase();

  if (fp.includes("онигири") || fp.includes("холодный")) return "rolls";
  if (fp.includes("горяч")) return "sandwiches";
  if (fp.includes("пицц")) return "pizzas";
  if (fp.includes("фри бокс")) return "fryBoxes";
  if (fp.includes("фритюр")) return "fried";
  if (fp.includes("вафл") || fp.includes("десерт")) return "waffles";
  if (fp.includes("салат")) return "salads";
  if (fp.includes("доп")) return "sauces";
  if (
    fp.includes("кофе") ||
    fp.includes("чай") ||
    fp.includes("напит") ||
    fp.includes("лиман") ||
    fp.includes("морож")
  ) {
    return "coffeeShop";
  }

  return franchise === "center" ? "coffeeShop" : "coffeeShop";
}

function categoryPrefix(categoryId) {
  const map = {
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
    hotDogs: "hd",
  };
  return map[categoryId] ?? "xx";
}

function buildMenu(franchise, items) {
  const prefix = franchise === "center" ? "c" : "h";
  const counters = {};

  return items.map((item) => {
    const cat = resolveCategory(franchise, item.fpCategory, item.name);
    counters[cat] = (counters[cat] ?? 0) + 1;
    const n = counters[cat];

    return {
      id: `${prefix}-${categoryPrefix(cat)}-${n}`,
      name: item.name,
      price: item.price,
      category: cat,
      frontpadArticle: item.frontpadArticle,
      description: "Состав уточняется",
      image: "/menu/dish.png",
      available: true,
    };
  });
}

const CENTER_LABELS = {
  sandwiches: "Сэндвичи",
  burgers: "Бургеры",
  panini: "Панини",
  hotDogs: "Хот-доги",
  fryBoxes: "Фри-боксы",
  waffles: "Венские вафли",
  salads: "Салаты",
  fried: "Фритюр",
  sauces: "Соусы",
  rolls: "Роллы",
  pizzas: "Пицца",
  coffeeShop: "Кофейня",
};

const HIPPODROME_LABELS = {
  fried: "Фритюр",
  sandwiches: "Сэндвичи",
  hotDogs: "Хот-доги",
  burgers: "Бургеры",
  salads: "Салаты",
  sauces: "Соусы",
  waffles: "Десерты",
  coffeeShop: "Напитки",
};

function buildCategoryDefs(menu, labels) {
  const order = [];
  for (const item of menu) {
    if (!order.includes(item.category)) order.push(item.category);
  }
  return order.map((id) => ({ id, label: labels[id] ?? id }));
}

const centerItems = parseHtmlCatalog(
  "c:/Users/vovav/Downloads/Товары (2).xls",
);
const hippodromeItems = parseHtmlCatalog(
  "c:/Users/vovav/Downloads/Товары (3).xls",
);

const menus = {
  center: buildMenu("center", centerItems),
  hippodrome: buildMenu("hippodrome", hippodromeItems),
};

fs.writeFileSync(
  path.join(ROOT, "data/menus.json"),
  `${JSON.stringify(menus, null, 2)}\n`,
);

const articleMap = {
  center: Object.fromEntries(menus.center.map((i) => [i.id, i.frontpadArticle])),
  hippodrome: Object.fromEntries(
    menus.hippodrome.map((i) => [i.id, i.frontpadArticle]),
  ),
};

fs.writeFileSync(
  path.join(ROOT, "data/frontpad-article-map.json"),
  `${JSON.stringify(articleMap, null, 2)}\n`,
);

const categories = {
  center: buildCategoryDefs(menus.center, CENTER_LABELS),
  hippodrome: buildCategoryDefs(menus.hippodrome, HIPPODROME_LABELS),
};

fs.writeFileSync(
  path.join(ROOT, "data/menu-categories.json"),
  `${JSON.stringify(categories, null, 2)}\n`,
);

console.log("center:", menus.center.length, "items");
console.log(
  "center categories:",
  Object.fromEntries(
    menus.center.reduce((m, i) => {
      m.set(i.category, (m.get(i.category) ?? 0) + 1);
      return m;
    }, new Map()),
  ),
);
console.log("hippodrome:", menus.hippodrome.length, "items");
console.log(
  "hippo categories:",
  Object.fromEntries(
    menus.hippodrome.reduce((m, i) => {
      m.set(i.category, (m.get(i.category) ?? 0) + 1);
      return m;
    }, new Map()),
  ),
);

const hSand = menus.hippodrome.find((i) => i.frontpadArticle === "1000");
console.log("hippo art 1000:", hSand?.name);
