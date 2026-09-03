import { NextResponse } from "next/server";
import { readSiteSettings, writeSiteSettings } from "@/lib/content-store";
import { isAdminSession } from "@/lib/require-admin";
import { normalizeSiteSettings, type SiteSettings } from "@/lib/site-settings";

export async function GET() {
  try {
    const data = await readSiteSettings();
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error("[api/content/site-settings GET]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<SiteSettings>;
    const saved = await writeSiteSettings(normalizeSiteSettings(body));
    return NextResponse.json({ ok: true, data: saved });
  } catch (error) {
    console.error("[api/content/site-settings PUT]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
