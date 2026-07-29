import { NextResponse } from "next/server";
import { persistDataUrl } from "@/lib/content-store";
import { isAdminSession } from "@/lib/require-admin";

export async function POST(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { dataUrl?: string; prefix?: string };
    if (!body.dataUrl?.startsWith("data:image/")) {
      return NextResponse.json(
        { ok: false, message: "Invalid image" },
        { status: 400 },
      );
    }

    const url = await persistDataUrl(body.dataUrl, body.prefix || "upload");
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    console.error("[api/content/upload]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
