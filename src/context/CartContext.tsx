"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, MenuItem } from "@/lib/types";
import {
  cartLineKey,
  getCartItemPrice,
  itemHasVolumes,
  quantityOfMenuItem,
  quantityOfVolume,
} from "@/lib/menu-volumes";
import { useFranchise } from "./FranchiseContext";

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  addItem: (item: MenuItem, volumeId?: string) => void;
  removeItem: (lineKey: string) => void;
  updateQty: (lineKey: string, quantity: number) => void;
  clear: () => void;
  /** Сколько штук этого блюда уже в корзине (все объёмы) */
  quantityOf: (id: string) => number;
  /** Сколько штук конкретного объёма в корзине */
  quantityOfVolume: (menuItemId: string, volumeId: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { franchiseId } = useFranchise();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const franchiseReadyRef = useRef(false);

  useEffect(() => {
    if (!franchiseReadyRef.current) {
      franchiseReadyRef.current = true;
      return;
    }
    setItems([]);
    setOpen(false);
  }, [franchiseId]);

  const addItem = useCallback((menuItem: MenuItem, volumeId?: string) => {
    if (itemHasVolumes(menuItem) && !volumeId) return;

    const key = cartLineKey(menuItem.id, volumeId);
    setItems((prev) => {
      const existing = prev.find(
        (i) => cartLineKey(i.menuItem.id, i.volumeId) === key,
      );
      if (existing) {
        return prev.map((i) =>
          cartLineKey(i.menuItem.id, i.volumeId) === key
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { menuItem, quantity: 1, volumeId }];
    });
  }, []);

  const removeItem = useCallback((lineKey: string) => {
    setItems((prev) =>
      prev.filter((i) => cartLineKey(i.menuItem.id, i.volumeId) !== lineKey),
    );
  }, []);

  const updateQty = useCallback((lineKey: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) =>
        prev.filter(
          (i) => cartLineKey(i.menuItem.id, i.volumeId) !== lineKey,
        ),
      );
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        cartLineKey(i.menuItem.id, i.volumeId) === lineKey
          ? { ...i, quantity }
          : i,
      ),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const quantityOf = useCallback(
    (id: string) => quantityOfMenuItem(items, id),
    [items],
  );

  const quantityOfVolumeFn = useCallback(
    (menuItemId: string, volumeId: string) =>
      quantityOfVolume(items, menuItemId, volumeId),
    [items],
  );

  const value = useMemo(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const total = items.reduce(
      (s, i) => s + getCartItemPrice(i.menuItem, i.volumeId) * i.quantity,
      0,
    );
    return {
      items,
      count,
      total,
      isOpen,
      setOpen,
      addItem,
      removeItem,
      updateQty,
      clear,
      quantityOf,
      quantityOfVolume: quantityOfVolumeFn,
    };
  }, [items, isOpen, addItem, removeItem, updateQty, clear, quantityOf, quantityOfVolumeFn]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export { cartLineKey };
