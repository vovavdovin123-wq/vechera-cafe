import type { AccountUser } from "@/context/UserContext";
import { saveCheckoutDraft } from "@/lib/checkout-storage";

/** Имя и телефон из аккаунта → черновик корзины. */
export function syncUserToCheckout(user: AccountUser) {
  saveCheckoutDraft({
    name: user.name,
    phone: user.phoneDisplay,
  });
}
