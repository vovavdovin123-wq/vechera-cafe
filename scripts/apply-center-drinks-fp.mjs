#!/usr/bin/env node
/**
 * Обновляет/добавляет напитки Центра (drinks-2) по каталогу FrontPad.
 * Пары м/М = Маленький, Б = Большой → одна позиция с volumes.
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const MENUS_FILE = join(process.cwd(), "data", "menus.json");
const CATEGORY = "drinks-2";
const DEFAULT_IMAGE = "/menu/dish.png";
const M = "Маленький";
const B = "Большой";

/** @type {Array<{ name: string, match?: string[], exactOnly?: boolean, volumes?: {label:string,price:number,fp:string}[], price?: number, fp?: string }>} */
const CATALOG = [
  {
    name: "Айс кофе",
    match: ["айс кофе"],
    volumes: [
      { label: M, price: 200, fp: "11020" },
      { label: B, price: 230, fp: "11021" },
    ],
  },
  {
    name: "Айс латте",
    volumes: [
      { label: M, price: 200, fp: "11055" },
      { label: B, price: 230, fp: "11056" },
    ],
  },
  {
    name: "Айс раф",
    volumes: [
      { label: M, price: 230, fp: "11057" },
      { label: B, price: 250, fp: "11058" },
    ],
  },
  {
    name: "Айс раф фисташка-малина",
    match: ["айс раф фисташка"],
    volumes: [
      { label: M, price: 250, fp: "11059" },
      { label: B, price: 280, fp: "11060" },
    ],
  },
  {
    name: "Американо",
    match: ["американо"],
    price: 130,
    fp: "11022",
  },
  {
    name: "Апельсиновый кофе (Бамбл)",
    match: ["апельсиновый кофе", "бамбл"],
    volumes: [
      { label: M, price: 210, fp: "11023" },
      { label: B, price: 240, fp: "11024" },
    ],
  },
  {
    name: "Ванильное мороженое",
    price: 220,
    fp: "11025",
  },
  {
    name: "Горячий шоколад",
    match: ["горячий шоколад"],
    volumes: [
      { label: M, price: 170, fp: "11027" },
      { label: B, price: 190, fp: "11028" },
    ],
  },
  {
    name: "Какао",
    match: ["какао"],
    exactOnly: true,
    volumes: [
      { label: M, price: 140, fp: "11029" },
      { label: B, price: 170, fp: "11030" },
    ],
  },
  {
    name: "Какао тоник (пьяная вишня)",
    match: ["какао тоник"],
    volumes: [
      { label: M, price: 200, fp: "11061" },
      { label: B, price: 250, fp: "11062" },
    ],
  },
  {
    name: "Капучино",
    match: ["капучино"],
    volumes: [
      { label: M, price: 170, fp: "11031" },
      { label: B, price: 200, fp: "11032" },
    ],
  },
  {
    name: "Латте",
    match: ["латте"],
    exactOnly: true,
    volumes: [
      { label: M, price: 170, fp: "11033" },
      { label: B, price: 200, fp: "11034" },
    ],
  },
  {
    name: "Матча анчан-вишня",
    volumes: [
      { label: M, price: 250, fp: "11065" },
      { label: B, price: 280, fp: "11066" },
    ],
  },
  {
    name: "Матча клубника-банан",
    match: ["матча клубника"],
    volumes: [
      { label: M, price: 250, fp: "11063" },
      { label: B, price: 280, fp: "11064" },
    ],
  },
  {
    name: "Матча питахайя",
    volumes: [
      { label: M, price: 250, fp: "11067" },
      { label: B, price: 280, fp: "11068" },
    ],
  },
  {
    name: "Раф апельсин",
    volumes: [
      { label: M, price: 200, fp: "11035" },
      { label: B, price: 230, fp: "11036" },
    ],
  },
  {
    name: "Раф карамель миндаль",
    match: ["раф карамель"],
    volumes: [
      { label: M, price: 200, fp: "11037" },
      { label: B, price: 230, fp: "11038" },
    ],
  },
  {
    name: "Раф",
    match: ["раф классический"],
    exactOnly: true,
    volumes: [
      { label: M, price: 180, fp: "11039" },
      { label: B, price: 210, fp: "11040" },
    ],
  },
  {
    name: "Раф фисташка малина",
    match: ["раф фисташка малина", "раф фисташка"],
    volumes: [
      { label: M, price: 200, fp: "11041" },
      { label: B, price: 230, fp: "11042" },
    ],
  },
  {
    name: "Тоник кофе",
    volumes: [
      { label: M, price: 210, fp: "11043" },
      { label: B, price: 240, fp: "11044" },
    ],
  },
  {
    name: "Флэт уайт",
    match: ["флэт уайт", "flat white"],
    price: 200,
    fp: "11045",
  },
  {
    name: "Эспрессо",
    match: ["эспрессо"],
    price: 100,
    fp: "11046",
  },
  {
    name: "Чай апельсин",
    match: ["чай апельсин"],
    price: 140,
    fp: "11000",
  },
  {
    name: "Чай зелёный",
    match: ["чай зеленый", "чай зелёный"],
    volumes: [
      { label: M, price: 80, fp: "11001" },
      { label: B, price: 100, fp: "11002" },
    ],
  },
  {
    name: "Чай малина",
    match: ["чай малина"],
    volumes: [
      { label: M, price: 120, fp: "11003" },
      { label: B, price: 140, fp: "11004" },
    ],
  },
  {
    name: "Чай облепиха",
    match: ["чай облепиха"],
    volumes: [
      { label: M, price: 120, fp: "11005" },
      { label: B, price: 140, fp: "11006" },
    ],
  },
  {
    name: "Чай фейхоа",
    match: ["чай фейхоа"],
    volumes: [
      { label: M, price: 120, fp: "11007" },
      { label: B, price: 140, fp: "11008" },
    ],
  },
  {
    name: "Чай чёрный",
    match: ["чай чёрный", "чай черный"],
    volumes: [
      { label: M, price: 80, fp: "11009" },
      { label: B, price: 100, fp: "11010" },
    ],
  },
  {
    name: "Базилик Арбуз",
    match: ["базилик арбуз", "базилик-арбуз"],
    volumes: [
      { label: M, price: 190, fp: "11011" },
      { label: B, price: 220, fp: "11012" },
    ],
  },
  {
    name: "Голубая лагуна",
    volumes: [
      { label: M, price: 190, fp: "11053" },
      { label: B, price: 220, fp: "11054" },
    ],
  },
  {
    name: "Гранат-базилик",
    volumes: [
      { label: M, price: 190, fp: "11049" },
      { label: B, price: 220, fp: "11050" },
    ],
  },
  {
    name: "Лимонад киви-яблоко",
    match: ["лимонад киви", "киви-яблоко", "киви яблоко"],
    volumes: [
      { label: M, price: 190, fp: "11047" },
      { label: B, price: 220, fp: "11048" },
    ],
  },
  {
    name: "Лаванда-ананас",
    match: ["лаванда ананас", "лаванда-ананас"],
    volumes: [
      { label: M, price: 170, fp: "11013" },
      { label: B, price: 200, fp: "11014" },
    ],
  },
  {
    name: "Манго-маракуйя",
    volumes: [
      { label: M, price: 190, fp: "11051" },
      { label: B, price: 220, fp: "11052" },
    ],
  },
  {
    name: "Мохито",
    match: ["мохито"],
    exactOnly: true,
    volumes: [
      { label: M, price: 170, fp: "11015" },
      { label: B, price: 200, fp: "11016" },
    ],
  },
  {
    name: "Фрэш",
    price: 280,
    fp: "11017",
  },
  {
    name: "Цитрус-клубника",
    match: ["цитрус клубника", "цитрус-клубника"],
    volumes: [
      { label: M, price: 190, fp: "11018" },
      { label: B, price: 220, fp: "11019" },
    ],
  },
];

function norm(s) {
  return s
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim();
}

function buildVolumes(volumes) {
  return volumes.map((v) => ({
    id: `vol-${v.fp}`,
    label: v.label,
    price: v.price,
    frontpadArticle: v.fp,
  }));
}

function applyEntry(entry, item) {
  if (entry.volumes?.length) {
    const vols = buildVolumes(entry.volumes);
    item.volumes = vols;
    item.price = Math.min(...vols.map((v) => v.price));
    item.frontpadArticle = undefined;
  } else {
    item.volumes = undefined;
    item.price = entry.price;
    item.frontpadArticle = entry.fp;
  }
  item.name = entry.name;
  item.category = CATEGORY;
  item.available = item.available ?? true;
  item.description = item.description?.trim() || "Состав уточняется";
  if (!item.image?.trim()) {
    item.image = DEFAULT_IMAGE;
  }
}

function findItem(items, entry, usedIds) {
  const nameKey = norm(entry.name);
  const aliases = (entry.match ?? []).map(norm);
  return items.find((i) => {
    if (i.category !== CATEGORY || usedIds.has(i.id)) return false;
    const n = norm(i.name);
    if (n === nameKey) return true;
    if (entry.exactOnly) return false;
    return aliases.some((k) => n === k || (k.length >= 8 && n.includes(k)));
  });
}

const data = JSON.parse(readFileSync(MENUS_FILE, "utf8"));
const center = data.center ?? [];
const drinks = center.filter((i) => i.category === CATEGORY);
const other = center.filter((i) => i.category !== CATEGORY);

const usedIds = new Set();
const byId = new Map();
let updated = 0;
let added = 0;

for (const entry of CATALOG) {
  const existing = findItem(drinks, entry, usedIds);
  if (existing) {
    applyEntry(entry, existing);
    usedIds.add(existing.id);
    byId.set(existing.id, existing);
    updated++;
    console.log("update:", entry.name);
  } else {
    const id = `center-fp-${entry.volumes?.[0]?.fp ?? entry.fp}`;
    const item = {
      id,
      name: entry.name,
      description: "Состав уточняется",
      category: CATEGORY,
      image: DEFAULT_IMAGE,
      available: true,
    };
    applyEntry(entry, item);
    usedIds.add(id);
    byId.set(id, item);
    added++;
    console.log("add:", entry.name);
  }
}

const result = [...byId.values()];

for (const item of drinks) {
  if (!usedIds.has(item.id)) {
    // Переименовать объёмы у сохранённых позиций
    if (item.volumes?.length) {
      for (const vol of item.volumes) {
        if (vol.label === "Средний" || vol.label === "М" || vol.label === "м") {
          vol.label = M;
        }
      }
    }
    result.push(item);
    console.log("keep:", item.name);
  }
}

data.center = [...other, ...result];
writeFileSync(MENUS_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`\n✓ drinks-2: ${result.length} items (${updated} updated, ${added} new)`);
