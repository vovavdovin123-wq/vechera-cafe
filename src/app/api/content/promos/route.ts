import { NextResponse } from "next/server";
import { readPromos, writePromos } from "@/lib/content-store";
import { isAdminSession } from "@/lib/require-admin";
import type { PromoSlide } from "@/lib/promos";

export async function GET() {
  try {
    const data = await readPromos();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[api/content/promos GET]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const body = (await request.json()) as PromoSlide[];
    if (!Array.isArray(body)) {
      return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
    }

    const saved = await writePromos(body);
    return NextResponse.json({ ok: true, data: saved });
  } catch (error) {
    console.error("[api/content/promos PUT]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
