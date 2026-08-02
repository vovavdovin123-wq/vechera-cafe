"use client";

import Link from "next/link";
import {
  Armchair,
  BadgePercent,
  MessageSquareText,
  Plug,
  ShoppingBag,
  TicketPercent,
  UtensilsCrossed,
} from "lucide-react";

const links = [
  { href: "/admin", id: "menu" as const, label: "Меню", icon: UtensilsCrossed },
  { href: "/admin/interior", id: "interior" as const, label: "Интерьер", icon: Armchair },
  { href: "/admin/promos", id: "promos" as const, label: "Акции", icon: BadgePercent },
  {
    href: "/admin/coupons",
    id: "coupons" as const,
    label: "Промокоды",
    icon: TicketPercent,
  },
  { href: "/admin/orders", id: "orders" as const, label: "Заказы", icon: ShoppingBag },
  {
    href: "/admin/frontpad",
    id: "frontpad" as const,
    label: "FrontPad",
    icon: Plug,
  },
  { href: "/admin/feedback", id: "feedback" as const, label: "Связь", icon: MessageSquareText },
];

export type AdminTab = (typeof links)[number]["id"];

export function AdminNav({ active }: { active: AdminTab }) {
  const item =
    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-[background,border-color] duration-300 sm:gap-2 sm:px-3.5 sm:py-2 sm:text-sm";
  const on = "bg-[var(--gold)] text-[var(--espresso)]";
  const off =
    "border border-white/25 bg-white/10 text-white hover:border-[var(--gold)] hover:bg-white/15";

  return (
    <nav className="-mx-1 flex max-w-full items-center gap-1.5 overflow-x-auto px-1 pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-2 [&::-webkit-scrollbar]:hidden">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.id}
            href={link.href}
            className={`${item} ${active === link.id ? on : off}`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
