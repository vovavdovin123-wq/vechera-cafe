export type CouponType = "percent" | "amount";

export interface Coupon {
  id: string;
  /** Код без пробелов, храним в верхнем регистре */
  code: string;
  type: CouponType;
  /** % (1–100) или сумма в рублях */
  value: number;
  active: boolean;
  /** Минимальная сумма заказа, опционально */
  minOrder?: number;
  /** ISO дата окончания, опционально */
  expiresAt?: string;
  note?: string;
  createdAt: string;
}

export const EMPTY_COUPONS: Coupon[] = [];
