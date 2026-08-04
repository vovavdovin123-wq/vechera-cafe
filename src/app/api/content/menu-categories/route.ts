import { NextResponse } from "next/server";
import {
  readMenuCategories,
  writeMenuCategories,
} from "@/lib/content-store";
import { isAdminSession } from "@/lib/require-admin";
import type { FranchiseId, MenuCategoryDef } from "@/lib/types";

export async function GET() {
  try {
    const categories = await readMenuCategories();
    return NextResponse.json({ ok: true, data: categories });
  } catch (error) {
    console.error("[api/content/menu-categories GET]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<
      FranchiseId,
      MenuCategoryDef[]
    >;
    if (!body?.center || !body?.hippodrome) {
      return NextResponse.json(
        { ok: false, message: "Invalid payload" },
        { status: 400 },
      );
    }

    const saved = await writeMenuCategories(body);
    return NextResponse.json({ ok: true, data: saved });
  } catch (error) {
    console.error("[api/content/menu-categories PUT]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
