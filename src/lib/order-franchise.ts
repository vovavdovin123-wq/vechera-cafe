import type { FranchiseId } from "./types";

/** Точка по префиксу id блюда (c- / h- / center- / hippodrome-). */
export function franchiseFromItemId(id: string): FranchiseId | null {
  const itemId = String(id ?? "").trim();
  if (!itemId) return null;
  if (itemId.startsWith("h-") || itemId.startsWith("hippodrome-")) {
    return "hippodrome";
  }
  if (itemId.startsWith("c-") || itemId.startsWith("center-")) {
    return "center";
  }
  return null;
}

export function itemMatchesFranchise(
  itemId: string,
  franchiseId: FranchiseId,
): boolean {
  const fromId = franchiseFromItemId(itemId);
  if (fromId) return fromId === franchiseId;
  return false;
}

/**
 * Точка заказа по составу корзины — надёжнее, чем franchiseId из тела запроса.
 */
export function franchiseFromOrderItems(
  items: Array<{ id: string }>,
): FranchiseId | null {
  const seen = new Set<FranchiseId>();
  for (const item of items) {
    const f = franchiseFromItemId(item.id);
    if (f) seen.add(f);
  }
  if (seen.size === 1) return [...seen][0];
  return null;
}

export function resolveOrderFranchise(
  claimed: FranchiseId,
  items: Array<{ id: string }>,
):
  | { ok: true; franchiseId: FranchiseId; corrected: boolean }
  | { ok: false; message: string } {
  const fromItems = franchiseFromOrderItems(items);

  if (fromItems) {
    if (fromItems !== claimed) {
      console.warn("[orders] franchise corrected from items", {
        claimed,
        resolved: fromItems,
        itemIds: items.map((i) => i.id),
      });
    }
    return { ok: true, franchiseId: fromItems, corrected: fromItems !== claimed };
  }

  if (items.some((item) => !itemMatchesFranchise(item.id, claimed))) {
    return {
      ok: false,
      message: "Состав заказа не соответствует выбранной точке",
    };
  }

  return { ok: true, franchiseId: claimed, corrected: false };
}
