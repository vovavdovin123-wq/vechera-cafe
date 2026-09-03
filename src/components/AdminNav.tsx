"use client";

import Link from "next/link";
import {
  Armchair,
  BadgePercent,
  MessageSquareText,
  Settings,
  ShoppingBag,
  TicketPercent,
  UtensilsCrossed,
} from "lucide-react";

const links = [
  { href: "/admin", id: "menu" as const, label: "Меню", short: "Меню", icon: UtensilsCrossed },
  { href: "/admin/interior", id: "interior" as const, label: "Интерьер", short: "Интерьер", icon: Armchair },
  { href: "/admin/promos", id: "promos" as const, label: "Акции", short: "Акции", icon: BadgePercent },
  {
    href: "/admin/coupons",
    id: "coupons" as const,
    label: "Промокоды",
    short: "Промо",
    icon: TicketPercent,
  },
  { href: "/admin/orders", id: "orders" as const, label: "Заказы", short: "Заказы", icon: ShoppingBag },
  { href: "/admin/feedback", id: "feedback" as const, label: "Связь", short: "Связь", icon: MessageSquareText },
  { href: "/admin/settings", id: "settings" as const, label: "Настройки", short: "Настр.", icon: Settings },
];

export type AdminTab = (typeof links)[number]["id"];

export function AdminNav({ active }: { active: AdminTab }) {
  return (
    <nav
      className="flex w-full flex-wrap gap-1.5"
      aria-label="Разделы админки"
    >
      {links.map((link) => {
        const Icon = link.icon;
        const on = active === link.id;
        return (
          <Link
            key={link.id}
            href={link.href}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition sm:gap-2 sm:px-3 sm:text-sm ${
              on
                ? "bg-[var(--gold)] text-[var(--espresso)]"
                : "border border-white/25 bg-white/10 text-white hover:border-[var(--gold)] hover:bg-white/15"
            }`}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
            <span className="sm:hidden">{link.short}</span>
            <span className="hidden sm:inline">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
