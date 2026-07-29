import { NextResponse } from "next/server";
import { readMenus, writeMenus } from "@/lib/content-store";
import { isAdminSession } from "@/lib/require-admin";
import type { FranchiseId, MenuItem } from "@/lib/types";

export async function GET() {
  try {
    const menus = await readMenus();
    return NextResponse.json({ ok: true, data: menus });
  } catch (error) {
    console.error("[api/content/menus GET]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<FranchiseId, MenuItem[]>;
    if (!body?.center || !body?.hippodrome) {
      return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
    }

    const saved = await writeMenus(body);
    return NextResponse.json({ ok: true, data: saved });
  } catch (error) {
    console.error("[api/content/menus PUT]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
