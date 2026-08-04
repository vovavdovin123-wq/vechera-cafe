"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { flushSync } from "react-dom";
import { FranchisePickScreen } from "@/components/FranchisePickScreen";
import { useFranchise } from "@/context/FranchiseContext";
import type { FranchiseId } from "@/lib/types";

export default function PickFranchisePage() {
  const router = useRouter();
  const { setFranchiseId } = useFranchise();
  const [busyId, setBusyId] = useState<FranchiseId | null>(null);

  function onPick(id: FranchiseId) {
    if (busyId) return;
    setBusyId(id);
    flushSync(() => {
      setFranchiseId(id);
    });
    router.replace("/");
  }

  return <FranchisePickScreen onPick={onPick} busyId={busyId} />;
}
