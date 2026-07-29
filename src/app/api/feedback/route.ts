import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  appendFeedback,
  deleteFeedback,
  readFeedback,
} from "@/lib/feedback-store";
import { COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";
import { notifyFeedback } from "@/lib/notify";
import type { FeedbackPayload } from "@/lib/types";

export async function GET() {
  const jar = await cookies();
  if (!verifySessionToken(jar.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const items = await readFeedback();
  return NextResponse.json({ ok: true, items });
}

export async function DELETE(request: Request) {
  const jar = await cookies();
  if (!verifySessionToken(jar.get(COOKIE_NAME)?.value)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, message: "Missing id" }, { status: 400 });
  }

  const deleted = await deleteFeedback(id);
  if (!deleted) {
    return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as FeedbackPayload;

    if (!body?.message?.trim() || !body.franchiseId) {
      return NextResponse.json(
        { ok: false, message: "Напишите сообщение" },
        { status: 400 },
      );
    }

    const entry = await appendFeedback({
      franchiseId: body.franchiseId,
      message: body.message.trim(),
      name: body.name?.trim() || undefined,
      phone: body.phone?.trim() || undefined,
    });

    await notifyFeedback(entry);

    return NextResponse.json({
      ok: true,
      message: "Спасибо! Сообщение отправлено анонимно.",
      id: entry.id,
    });
  } catch (error) {
    console.error("[api/feedback]", error);
    return NextResponse.json(
      { ok: false, message: "Ошибка сервера" },
      { status: 500 },
    );
  }
}
