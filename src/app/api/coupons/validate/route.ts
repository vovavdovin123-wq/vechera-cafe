import { NextResponse } from "next/server";
import { readCoupons } from "@/lib/content-store";

/** Публичная проверка промокода (созданного в админ панели). */
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code")?.trim().toUpperCase();
  const totalRaw = new URL(request.url).searchParams.get("total");
  const total = totalRaw ? Number(totalRaw) : 0;

  if (!code || code.length < 2) {
    return NextResponse.json(
      { ok: false, message: "Введите промокод" },
      { status: 400 },
    );
  }

  const list = await readCoupons();
  const coupon = list.find((c) => c.code === code && c.active);

  if (!coupon) {
    return NextResponse.json(
      { ok: false, message: "Промокод не найден или выключен" },
      { status: 404 },
    );
  }

  if (coupon.expiresAt) {
    const end = new Date(coupon.expiresAt);
    if (Number.isFinite(end.getTime()) && end.getTime() < Date.now()) {
      return NextResponse.json(
        { ok: false, message: "Срок действия промокода истёк" },
        { status: 410 },
      );
    }
  }

  if (coupon.minOrder && total > 0 && total < coupon.minOrder) {
    return NextResponse.json(
      {
        ok: false,
        message: `Минимальная сумма заказа для промокода — ${coupon.minOrder} ₽`,
      },
      { status: 400 },
    );
  }

  if (coupon.type === "percent") {
    const percent = Math.min(100, Math.max(1, Math.round(coupon.value)));
    return NextResponse.json({
      ok: true,
      kind: "sale" as const,
      code: coupon.code,
      percent,
      message: `Скидка ${percent}%`,
    });
  }

  const amount = Math.max(1, Math.round(coupon.value));
  return NextResponse.json({
    ok: true,
    kind: "amount" as const,
    code: coupon.code,
    amount,
    message: `Скидка ${amount} ₽`,
  });
}
