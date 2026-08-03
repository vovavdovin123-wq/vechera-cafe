"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import {
  hasStoredFranchise,
  useFranchise,
} from "@/context/FranchiseContext";

export function FranchiseEntryGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { needsPick, ready } = useFranchise();

  const isPick = pathname === "/pick";
  const isAdmin = pathname.startsWith("/admin");
  const picked = hasStoredFranchise();

  useEffect(() => {
    if (!ready) return;

    if (isPick && picked) {
      router.replace("/");
      return;
    }

    if (!isPick && !isAdmin && !picked) {
      router.replace("/pick");
    }
  }, [ready, picked, isPick, isAdmin, router]);

  if (isPick || isAdmin) {
    return <>{children}</>;
  }

  if (!ready || (needsPick && !picked)) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-muted">
        Загрузка…
      </div>
    );
  }

  return <>{children}</>;
}
