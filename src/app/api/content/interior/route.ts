import { NextResponse } from "next/server";
import { readInterior, writeInterior } from "@/lib/content-store";
import type { InteriorPhoto } from "@/lib/interior-data";
import { isAdminSession } from "@/lib/require-admin";
import type { FranchiseId } from "@/lib/types";

export async function GET() {
  try {
    const data = await readInterior();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[api/content/interior GET]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<FranchiseId, InteriorPhoto[]>;
    if (!body?.center || !body?.hippodrome) {
      return NextResponse.json({ ok: false, message: "Invalid payload" }, { status: 400 });
    }

    const saved = await writeInterior(body);
    return NextResponse.json({ ok: true, data: saved });
  } catch (error) {
    console.error("[api/content/interior PUT]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
