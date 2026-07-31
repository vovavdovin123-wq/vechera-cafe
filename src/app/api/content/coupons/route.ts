import { NextResponse } from "next/server";
import { isAdminSession } from "@/lib/require-admin";
import { readCoupons, writeCoupons } from "@/lib/content-store";
import type { Coupon } from "@/lib/coupons";

export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const items = await readCoupons();
  return NextResponse.json({ ok: true, items });
}

export async function PUT(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { items?: Coupon[] };
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ ok: false, message: "Bad payload" }, { status: 400 });
    }

    const normalized: Coupon[] = body.items
      .map((c) => {
        const type: Coupon["type"] = c.type === "amount" ? "amount" : "percent";
        return {
          id: String(c.id || `c-${Date.now().toString(36)}`),
          code: String(c.code || "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, ""),
          type,
          value: Math.max(0, Number(c.value) || 0),
          active: Boolean(c.active),
          minOrder:
            c.minOrder !== undefined && c.minOrder > 0
              ? Math.round(Number(c.minOrder))
              : undefined,
          expiresAt: c.expiresAt?.trim() || undefined,
          note: c.note?.trim() || undefined,
          createdAt: c.createdAt || new Date().toISOString(),
        };
      })
      .filter((c) => c.code.length >= 2 && c.value > 0);

    const items = await writeCoupons(normalized);
    return NextResponse.json({ ok: true, items });
  } catch (error) {
    console.error("[api/content/coupons]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
