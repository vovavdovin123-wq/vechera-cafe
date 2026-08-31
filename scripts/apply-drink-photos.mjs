#!/usr/bin/env node
/**
 * Копирует фото напитков в data/uploads и обновляет center drinks-2 в menus.json
 */
import { copyFileSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { randomBytes } from "crypto";
import { join } from "path";

const ROOT = process.cwd();
const UPLOADS = join(ROOT, "data", "uploads");
const MENUS = join(ROOT, "data", "menus.json");
const ASSETS =
  process.env.DRINK_ASSETS_DIR ??
  "C:\\Users\\Руссач\\.cursor\\projects\\c-Users-Desktop-Projects-vechera-cafe\\assets";

mkdirSync(UPLOADS, { recursive: true });

function saveImage(srcName, slug) {
  const src = join(ASSETS, srcName);
  const ext = srcName.endsWith(".png") ? "jpg" : srcName.split(".").pop();
  const outExt = ext === "png" ? "png" : "jpg";
  const name = `menu-drink-${slug}-${randomBytes(4).toString("hex")}.${outExt}`;
  copyFileSync(src, join(UPLOADS, name));
  return `/api/uploads/${name}`;
}

const RAF_IMAGE = saveImage(
  "c__Users________AppData_Roaming_Cursor_User_workspaceStorage_12b19c15642da2753b9a218157abbc17_images_Raf-1f4f19a7-3b57-40ce-bad6-abaedad4fe07.jpg",
  "raf",
);

/** @type {Array<{ names: string[], image: string, add?: { name: string, price?: number, volumes?: {label:string,price:number}[] } }>} */
const MAP = [
  {
    names: ["Лимонад киви-яблоко", "киви-яблоко", "киви яблоко"],
    image: saveImage(
      "c__Users________AppData_Roaming_Cursor_User_workspaceStorage_12b19c15642da2753b9a218157abbc17_images_Max_a_sdelay_tsvet_napitka-99776dc0-3fed-4d12-9209-a8c04ebab2da.jpg",
      "kiwi-apple",
    ),
    add: {
      name: "Лимонад киви-яблоко",
      volumes: [
        { label: "Средний", price: 190 },
        { label: "Большой", price: 220 },
      ],
    },
  },
  {
    names: ["Лимонад Анчан-вишня", "Анчан-вишня", "анчан вишня"],
    image: saveImage(
      "c__Users________AppData_Roaming_Cursor_User_workspaceStorage_12b19c15642da2753b9a218157abbc17_images_Max_a_uluchshi_kachestvo_izob_10-48f5e8a5-0d0d-492f-8401-d4355cf00a21.jpg",
      "anchan-cherry",
    ),
    add: {
      name: "Лимонад Анчан-вишня",
      volumes: [
        { label: "Средний", price: 190 },
        { label: "Большой", price: 220 },
      ],
    },
  },
  {
    names: ["Мохито"],
    image: saveImage(
      "c__Users________AppData_Roaming_Cursor_User_workspaceStorage_12b19c15642da2753b9a218157abbc17_images_Max_a_zameni_napitok_s_per_5-1c1be91f-9541-4d46-8ca4-582136797d61.png",
      "mojito",
    ),
  },
  {
    names: ["Цитрус клубника", "Цитрус-клубника"],
    image: saveImage(
      "c__Users________AppData_Roaming_Cursor_User_workspaceStorage_12b19c15642da2753b9a218157abbc17_images_Max_a_uluchshi_kachestvo_izob_9-43c285c3-86d5-4c4d-bb75-904a43d5f92b.jpg",
      "citrus-strawberry",
    ),
  },
  {
    names: ["Лаванда Ананас", "Лаванда-ананас"],
    image: saveImage(
      "c__Users________AppData_Roaming_Cursor_User_workspaceStorage_12b19c15642da2753b9a218157abbc17_images_Max_a_polnostyu_uberi_edu__33-51788451-487f-4507-bf56-751d6cb29838.jpg",
      "lavender-pineapple",
    ),
  },
  {
    names: ["Пьяная вишня"],
    image: saveImage(
      "c__Users________AppData_Roaming_Cursor_User_workspaceStorage_12b19c15642da2753b9a218157abbc17_images_Max_a_zameni_napitok_na_pe_2-d49f08b7-96c7-4909-8009-560644666004.jpg",
      "drunk-cherry",
    ),
    add: {
      name: "Пьяная вишня",
      volumes: [
        { label: "Средний", price: 190 },
        { label: "Большой", price: 220 },
      ],
    },
  },
  {
    names: ["Матча клубника-банан", "матча клубника-банан"],
    image: saveImage(
      "c__Users________AppData_Roaming_Cursor_User_workspaceStorage_12b19c15642da2753b9a218157abbc17_images_Max_a_zameni_napitok_na_pe_1-33b3fd15-905e-48e7-ba0f-db8114530c5f.jpg",
      "matcha-strawberry-banana",
    ),
    add: {
      name: "Матча клубника-банан",
      volumes: [
        { label: "Средний", price: 190 },
        { label: "Большой", price: 220 },
      ],
    },
  },
  {
    names: ["Раф", "Раф апельсин", "Раф карамель миндаль", "Раф фисташка малина"],
    image: RAF_IMAGE,
  },
];

function norm(s) {
  return s.toLowerCase().replace(/-/g, " ").replace(/ё/g, "е").replace(/\s+/g, " ").trim();
}

function matches(item, keys) {
  const n = norm(item.name);
  return keys.some((k) => norm(k) === n || n.includes(norm(k)));
}

const data = JSON.parse(readFileSync(MENUS, "utf8"));
const center = data.center ?? [];
let updated = 0;
let added = 0;

for (const entry of MAP) {
  const hits = center.filter(
    (i) => i.category === "drinks-2" && matches(i, entry.names),
  );

  if (hits.length === 0 && entry.add) {
    const vols = entry.add.volumes?.map((v, i) => ({
      id: `vol-new-${entry.add.name.slice(0, 8)}-${i}`,
      label: v.label,
      price: v.price,
    }));
    const hit = {
      id: `center-drink-${randomBytes(4).toString("hex")}`,
      name: entry.add.name,
      description: "Состав уточняется",
      category: "drinks-2",
      available: true,
      image: entry.image,
      price: vols ? Math.min(...vols.map((v) => v.price)) : entry.add.price ?? 190,
      volumes: vols,
    };
    center.push(hit);
    added++;
    console.log("add:", entry.add.name);
    continue;
  }

  if (hits.length === 0) {
    console.warn("skip (not found, no add):", entry.names[0]);
    continue;
  }

  for (const hit of hits) {
    hit.image = entry.image;
    if (entry.add?.name) hit.name = entry.add.name;
    updated++;
    console.log("update:", hit.name);
  }
}

// Нормализуем названия существующих позиций под пользовательский список
const renames = [
  ["Цитрус клубника", "Цитрус-клубника"],
  ["Лаванда Ананас", "Лаванда-ананас"],
];
for (const [from, to] of renames) {
  const item = center.find((i) => i.category === "drinks-2" && i.name === from);
  if (item) item.name = to;
}

data.center = center;
writeFileSync(MENUS, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`\n✓ ${updated} updated, ${added} added`);
