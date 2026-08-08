"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useFranchise } from "@/context/FranchiseContext";

export function FranchiseEntryGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { needsPick, ready } = useFranchise();
  const [redirectStuck, setRedirectStuck] = useState(false);

  const isPick = pathname === "/pick";
  const isAdmin = pathname.startsWith("/admin");
  const isAccount = pathname.startsWith("/account");
  const needsEntryPick = ready && needsPick && !isPick && !isAdmin && !isAccount;

  useEffect(() => {
    if (!ready) return;

    if (isPick && !needsPick) {
      router.replace("/");
      return;
    }

    if (needsEntryPick) {
      router.replace("/pick");
    }
  }, [ready, needsPick, isPick, isAdmin, isAccount, needsEntryPick, router]);

  useEffect(() => {
    if (!needsEntryPick) {
      setRedirectStuck(false);
      return;
    }

    const timer = window.setTimeout(() => setRedirectStuck(true), 2500);
    return () => window.clearTimeout(timer);
  }, [needsEntryPick]);

  if (isPick || isAdmin || isAccount) {
    return <>{children}</>;
  }

  if (!ready || needsPick) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[var(--bg)] px-6">
        <div className="w-full max-w-md rounded-3xl border border-[var(--gold)]/40 bg-white p-6 text-center shadow-[var(--shadow-soft)]">
          <p className="font-display text-2xl font-semibold text-[var(--espresso)]">
            Выберите точку
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Чтобы показать меню и принять заказ, укажите кафе «Вечера»
          </p>
          <Link
            href="/pick"
            className="btn-soft mt-5 inline-flex w-full items-center justify-center"
          >
            Выбрать кафе
          </Link>
        </div>
        {!redirectStuck && (
          <p className="text-sm text-ink-muted">Переход…</p>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
