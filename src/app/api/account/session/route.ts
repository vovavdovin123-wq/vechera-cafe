import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  parseUserSessionToken,
  USER_COOKIE_NAME,
} from "@/lib/user-auth";
import { formatPhoneDisplay } from "@/lib/phone";
import { findUserByPhone } from "@/lib/users-store";

export async function GET() {
  const jar = await cookies();
  const session = parseUserSessionToken(jar.get(USER_COOKIE_NAME)?.value);

  if (!session) {
    return NextResponse.json({ ok: true, user: null });
  }

  const stored = await findUserByPhone(session.phone);

  return NextResponse.json({
    ok: true,
    user: {
      phone: session.phone,
      phoneDisplay: formatPhoneDisplay(session.phone),
      name: stored?.name ?? session.name,
    },
  });
}
