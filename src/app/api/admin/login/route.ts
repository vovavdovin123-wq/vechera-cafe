import { NextResponse } from "next/server";
import {
  createSessionToken,
  getAdminCredentials,
  sessionCookieOptions,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      login?: string;
      password?: string;
    };
    const { login, password } = getAdminCredentials();

    if (body.login !== login || body.password !== password) {
      return NextResponse.json(
        { ok: false, message: "Неверный логин или пароль" },
        { status: 401 },
      );
    }

    const token = createSessionToken(login);
    const res = NextResponse.json({ ok: true });
    const cookie = sessionCookieOptions(token);
    res.cookies.set(cookie);
    return res;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Ошибка входа" },
      { status: 500 },
    );
  }
}
