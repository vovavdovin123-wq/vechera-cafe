import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createUserSessionToken,
  userSessionCookieOptions,
} from "@/lib/user-auth";
import { hashPassword, validatePassword } from "@/lib/password";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { registerUser } from "@/lib/users-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      phone?: string;
      name?: string;
      password?: string;
      passwordConfirm?: string;
    };

    const phone = String(body.phone ?? "").trim();
    const name = String(body.name ?? "").trim();
    const password = String(body.password ?? "");
    const passwordConfirm = String(body.passwordConfirm ?? "");

    if (!name) {
      return NextResponse.json(
        { ok: false, message: "Введите имя" },
        { status: 400 },
      );
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { ok: false, message: "Введите корректный номер телефона" },
        { status: 400 },
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json(
        { ok: false, message: passwordError },
        { status: 400 },
      );
    }

    if (password !== passwordConfirm) {
      return NextResponse.json(
        { ok: false, message: "Пароли не совпадают" },
        { status: 400 },
      );
    }

    const result = await registerUser(
      normalizePhone(phone),
      name,
      hashPassword(password),
    );

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, message: result.message },
        { status: 409 },
      );
    }

    const token = createUserSessionToken({
      phone: result.user.phone,
      name: result.user.name,
    });

    const jar = await cookies();
    jar.set(userSessionCookieOptions(token));

    return NextResponse.json({
      ok: true,
      user: { phone: result.user.phone, name: result.user.name },
    });
  } catch (error) {
    console.error("[api/account/register]", error);
    return NextResponse.json(
      { ok: false, message: "Ошибка сервера" },
      { status: 500 },
    );
  }
}
