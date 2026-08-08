import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createUserSessionToken,
  userSessionCookieOptions,
} from "@/lib/user-auth";
import { verifyPassword } from "@/lib/password";
import { isValidPhone } from "@/lib/phone";
import { findUserByPhone, verifyUserPassword } from "@/lib/users-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      phone?: string;
      password?: string;
    };

    const phone = String(body.phone ?? "").trim();
    const password = String(body.password ?? "");

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { ok: false, message: "Введите корректный номер телефона" },
        { status: 400 },
      );
    }

    if (!password) {
      return NextResponse.json(
        { ok: false, message: "Введите пароль" },
        { status: 400 },
      );
    }

    const existing = await findUserByPhone(phone);
    if (!existing?.passwordHash) {
      return NextResponse.json(
        {
          ok: false,
          message: "Аккаунт не найден. Зарегистрируйтесь.",
        },
        { status: 401 },
      );
    }

    const user = await verifyUserPassword(phone, password, verifyPassword);
    if (!user) {
      return NextResponse.json(
        { ok: false, message: "Неверный телефон или пароль" },
        { status: 401 },
      );
    }

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
    return NextResponse.json(
      { ok: false, message: "Ошибка сервера" },
      { status: 500 },
    );
  }
}
