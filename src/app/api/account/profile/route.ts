import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createUserSessionToken,
  parseUserSessionToken,
  USER_COOKIE_NAME,
  userSessionCookieOptions,
} from "@/lib/user-auth";
import { formatPhoneDisplay } from "@/lib/phone";
import { upsertUser } from "@/lib/users-store";

export async function PATCH(request: Request) {
  const jar = await cookies();
  const session = parseUserSessionToken(jar.get(USER_COOKIE_NAME)?.value);

  if (!session) {
    return NextResponse.json(
      { ok: false, message: "Войдите в кабинет" },
      { status: 401 },
    );
  }

  try {
    const body = (await request.json()) as { name?: string };
    const name = String(body.name ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { ok: false, message: "Введите имя" },
        { status: 400 },
      );
    }

    const user = await upsertUser(session.phone, name);
    const token = createUserSessionToken({
      phone: user.phone,
      name: user.name,
    });
    jar.set(userSessionCookieOptions(token));

    return NextResponse.json({
      ok: true,
      user: {
        phone: user.phone,
        phoneDisplay: formatPhoneDisplay(user.phone),
        name: user.name,
      },
    });
  } catch (error) {
    console.error("[api/account/profile]", error);
    return NextResponse.json(
      { ok: false, message: "Ошибка сервера" },
      { status: 500 },
    );
  }
}
