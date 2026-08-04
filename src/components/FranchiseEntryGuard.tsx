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
  const needsEntryPick = ready && needsPick && !isPick && !isAdmin;

  useEffect(() => {
    if (!ready) return;

    if (isPick && !needsPick) {
      router.replace("/");
      return;
    }

    if (needsEntryPick) {
      router.replace("/pick");
    }
  }, [ready, needsPick, isPick, isAdmin, needsEntryPick, router]);

  useEffect(() => {
    if (!needsEntryPick) {
      setRedirectStuck(false);
      return;
    }

    const timer = window.setTimeout(() => setRedirectStuck(true), 2500);
    return () => window.clearTimeout(timer);
  }, [needsEntryPick]);

  if (isPick || isAdmin) {
    return <>{children}</>;
  }

  if (!ready || needsPick) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center text-ink-muted">
        <p>Загрузка…</p>
        {redirectStuck && (
          <Link
            href="/pick"
            className="rounded-full bg-[var(--gold)] px-5 py-2.5 text-sm font-semibold text-[var(--espresso)]"
          >
            Выбрать точку
          </Link>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
