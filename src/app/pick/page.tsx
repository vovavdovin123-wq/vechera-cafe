"use client";

import { useRouter } from "next/navigation";
import { FranchisePickScreen } from "@/components/FranchisePickScreen";
import { useFranchise } from "@/context/FranchiseContext";
import type { FranchiseId } from "@/lib/types";

export default function PickFranchisePage() {
  const router = useRouter();
  const { setFranchiseId } = useFranchise();

  function onPick(id: FranchiseId) {
    setFranchiseId(id);
    router.push("/");
  }

  return <FranchisePickScreen onPick={onPick} />;
}
