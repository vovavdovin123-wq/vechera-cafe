import { promises as fs } from "fs";
import path from "path";
import { normalizePhone } from "./phone";
import type { OrderPayload } from "./types";

export interface StoredOrder extends OrderPayload {
  id: string;
  orderId: string;
  createdAt: string;
  status: "new" | "paid_stub" | "frontpad";
  frontpadMode?: "live" | "stub";
  frontpadOrderNumber?: string;
  /** Статус из webhook FrontPad (число или код) */
  frontpadStatus?: string;
  frontpadStatusAt?: string;
}

const FILE = path.join(process.cwd(), "data", "orders.json");

async function ensureFile() {
  const dir = path.dirname(FILE);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(FILE);
  } catch {
    await fs.writeFile(FILE, "[]", "utf8");
  }
}

export async function readOrders(): Promise<StoredOrder[]> {
  await ensureFile();
  const raw = await fs.readFile(FILE, "utf8");
  try {
    return JSON.parse(raw) as StoredOrder[];
  } catch {
    return [];
  }
}

export async function appendOrder(
  payload: OrderPayload,
  meta: {
    orderId: string;
    mode?: "live" | "stub";
    orderNumber?: string;
  },
): Promise<StoredOrder> {
  const list = await readOrders();
  const entry: StoredOrder = {
    ...payload,
    id: `ord-${Date.now().toString(36)}`,
    orderId: meta.orderId,
    createdAt: new Date().toISOString(),
    status: meta.mode === "live" ? "frontpad" : "paid_stub",
    frontpadMode: meta.mode,
    frontpadOrderNumber: meta.orderNumber,
  };
  list.unshift(entry);
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");
  return entry;
}

export async function updateOrderByFrontPadId(
  frontpadOrderId: string,
  patch: Partial<Pick<StoredOrder, "frontpadStatus" | "frontpadStatusAt">>,
): Promise<StoredOrder | null> {
  const list = await readOrders();
  const id = String(frontpadOrderId);
  const idx = list.findIndex(
    (o) => o.orderId === id || o.frontpadOrderNumber === id,
  );
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch };
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), "utf8");
  return list[idx];
}

export async function findOrderByFrontPadId(
  frontpadOrderId: string,
): Promise<StoredOrder | null> {
  const list = await readOrders();
  const id = String(frontpadOrderId);
  return (
    list.find((o) => o.orderId === id || o.frontpadOrderNumber === id) ?? null
  );
}

export async function deleteOrder(id: string): Promise<boolean> {
  const list = await readOrders();
  const next = list.filter((item) => item.id !== id);
  if (next.length === list.length) return false;
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf8");
  return true;
}

/** Заказы гостя по номеру телефона (новые первыми) */
export async function findOrdersByPhone(phone: string): Promise<StoredOrder[]> {
  const target = normalizePhone(phone);
  if (!target) return [];

  const list = await readOrders();
  return list.filter((order) => {
    const orderPhone = order.customerPhone
      ? normalizePhone(order.customerPhone)
      : "";
    return orderPhone === target;
  });
}
