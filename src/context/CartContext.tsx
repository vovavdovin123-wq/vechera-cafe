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
import { useFranchise } from "./FranchiseContext";

interface CartContextValue {
  items: CartItem[];
  count: number;
  total: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  addItem: (item: MenuItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, quantity: number) => void;
  clear: () => void;
  /** Сколько штук этого блюда уже в корзине */
  quantityOf: (id: string) => number;
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

  const addItem = useCallback((menuItem: MenuItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === menuItem.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [...prev, { menuItem, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.menuItem.id !== id));
  }, []);

  const updateQty = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.menuItem.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.menuItem.id === id ? { ...i, quantity } : i)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const quantityOf = useCallback(
    (id: string) => items.find((i) => i.menuItem.id === id)?.quantity ?? 0,
    [items],
  );

  const value = useMemo(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const total = items.reduce(
      (s, i) => s + i.menuItem.price * i.quantity,
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
    };
  }, [items, isOpen, addItem, removeItem, updateQty, clear, quantityOf]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
