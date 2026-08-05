import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createUserSessionToken,
  userSessionCookieOptions,
} from "@/lib/user-auth";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { upsertUser } from "@/lib/users-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string; name?: string };
    const phone = String(body.phone ?? "").trim();
    const name = String(body.name ?? "").trim();

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { ok: false, message: "Введите корректный номер телефона" },
        { status: 400 },
      );
    }

    const normalized = normalizePhone(phone);
    const user = await upsertUser(normalized, name || undefined);
    const token = createUserSessionToken({
      phone: user.phone,
      name: user.name,
    });

    const jar = await cookies();
    jar.set(userSessionCookieOptions(token));

    return NextResponse.json({
      ok: true,
      user: { phone: user.phone, name: user.name },
    });
  } catch (error) {
    console.error("[api/account/login]", error);
    return NextResponse.json({ ok: false, message: "Ошибка сервера" }, { status: 500 });
  }
}
