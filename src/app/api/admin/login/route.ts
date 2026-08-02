import { NextResponse } from "next/server";
import {
  createSessionToken,
  verifyAdminCredentials,
  sessionCookieOptions,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      login?: string;
      password?: string;
    };

    const account = verifyAdminCredentials(
      body.login?.trim() ?? "",
      body.password ?? "",
    );

    if (!account) {
      return NextResponse.json(
        { ok: false, message: "Неверный логин или пароль" },
        { status: 401 },
      );
    }

    const token = createSessionToken(account.login, account.scope);
    const res = NextResponse.json({
      ok: true,
      login: account.login,
      scope: account.scope,
    });
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
