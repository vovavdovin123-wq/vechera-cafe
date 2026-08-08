const STORAGE_KEY = "vechera-checkout";

export type CheckoutDraft = {
  name?: string;
  phone?: string;
  street?: string;
  entrance?: string;
  addressNote?: string;
  mode?: "delivery" | "pickup";
};

export function loadCheckoutDraft(): CheckoutDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CheckoutDraft;
  } catch {
    return {};
  }
}

export function saveCheckoutDraft(patch: CheckoutDraft) {
  try {
    const prev = loadCheckoutDraft();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...prev, ...patch }),
    );
  } catch {
    /* private mode */
  }
}
