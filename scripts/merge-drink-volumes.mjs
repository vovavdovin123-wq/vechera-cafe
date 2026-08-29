#!/usr/bin/env node
/**
 * Объединяет пары напитков «Название (М)» + «Название (Б)» в одну позицию с volumes.
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const MENUS_FILE = join(process.cwd(), "data", "menus.json");
const SIZE_RE = /\s*\((М|Б|С)\)\s*$/i;

function baseName(name) {
  return name.replace(SIZE_RE, "").trim();
}

function sizeFromName(name) {
  const m = name.match(SIZE_RE);
  if (!m) return null;
  const s = m[1].toUpperCase();
  if (s === "М") return "M";
  if (s === "Б") return "B";
  if (s === "С") return "S";
  return null;
}

function mergeFranchiseItems(items) {
  const groups = new Map();

  for (const item of items) {
    const base = baseName(item.name);
    const size = sizeFromName(item.name);
    if (!size) continue;

    const key = `${item.category}::${base.toLowerCase()}`;
    if (!groups.has(key)) {
      groups.set(key, { base, category: item.category, entries: [] });
    }
    groups.get(key).entries.push({ item, size, price: item.price });
  }

  const removeIds = new Set();
  const mergedItems = [];

  for (const group of groups.values()) {
    const { entries, base, category } = group;
    if (entries.length < 2) continue;

    const bySize = new Map();
    for (const e of entries) {
      const prev = bySize.get(e.size);
      if (!prev || e.price < prev.price) {
        bySize.set(e.size, e);
      } else if (e.size === "M" && !bySize.has("B")) {
        bySize.set("B", e);
      }
    }

    // Два «(М)» с разными ценами — меньший = М, больший = Б
    if (bySize.size < 2 && entries.length >= 2) {
      const sorted = [...entries].sort((a, b) => a.price - b.price);
      bySize.clear();
      bySize.set("M", sorted[0]);
      bySize.set("B", sorted[sorted.length - 1]);
    }

    if (bySize.size < 2) continue;

    const order = ["M", "S", "B"];
    const labelMap = { M: "М", S: "С", B: "Б" };
    const volumes = order
      .filter((s) => bySize.has(s))
      .map((s) => {
        const { item, price } = bySize.get(s);
        removeIds.add(item.id);
        return {
          id: `vol-${s.toLowerCase()}-${item.id.replace(/^hippodrome-|^center-/, "")}`,
          label: labelMap[s],
          price,
          frontpadArticle: item.frontpadArticle || undefined,
        };
      });

    if (volumes.length < 2) continue;

    const template =
      bySize.get("M")?.item ?? bySize.get("S")?.item ?? entries[0].item;
    for (const e of entries) removeIds.add(e.item.id);

    const prices = volumes.map((v) => v.price);
    mergedItems.push({
      insertBeforeId: template.id,
      item: {
        ...template,
        id: template.id,
        name: base,
        price: Math.min(...prices),
        frontpadArticle: undefined,
        volumes,
        category,
        description: template.description || "Состав уточняется",
        image: template.image || "/menu/dish.png",
        available: entries.every((e) => e.item.available !== false),
      },
    });
  }

  if (!mergedItems.length) return { items, merged: 0 };

  const mergedByAnchorId = new Map(
    mergedItems.map((m) => [m.insertBeforeId, m.item]),
  );
  const out = [];
  for (const item of items) {
    if (removeIds.has(item.id)) {
      const merged = mergedByAnchorId.get(item.id);
      if (merged) out.push(merged);
      continue;
    }
    out.push(item);
  }

  return { items: out, merged: mergedItems.length };
}

const data = JSON.parse(readFileSync(MENUS_FILE, "utf8"));
let total = 0;

for (const key of ["center", "hippodrome"]) {
  const result = mergeFranchiseItems(data[key] ?? []);
  data[key] = result.items;
  total += result.merged;
  console.log(`${key}: merged ${result.merged} drink(s), ${data[key].length} items total`);
}

writeFileSync(MENUS_FILE, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(`\n✓ Saved ${MENUS_FILE} (${total} groups merged)`);
