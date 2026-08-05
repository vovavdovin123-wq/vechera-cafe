import { createHmac, timingSafeEqual } from "crypto";
import { normalizePhone } from "./phone";

export const USER_COOKIE_NAME = "vechera_user";
const MAX_AGE_SEC = 60 * 60 * 24 * 30;

export type UserSession = {
  phone: string;
  name?: string;
};

function secret() {
  return (
    process.env.USER_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "vechera-user-dev-secret"
  );
}

export function createUserSessionToken(session: UserSession): string {
  const phone = normalizePhone(session.phone);
  const name = (session.name ?? "").trim().slice(0, 50);
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const payload = `${phone}.${exp}.${encodeURIComponent(name)}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function parseUserSessionToken(
  token: string | undefined,
): UserSession | null {
  if (!token) return null;
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;

  const sig = token.slice(lastDot + 1);
  const body = token.slice(0, lastDot);
  const parts = body.split(".");
  if (parts.length !== 3) return null;

  const [phoneRaw, expStr, nameEnc] = parts;
  const exp = Number(expStr);
  if (!phoneRaw || !Number.isFinite(exp) || Date.now() > exp) return null;

  const payload = `${phoneRaw}.${expStr}.${nameEnc}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");

  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    let name = "";
    try {
      name = decodeURIComponent(nameEnc);
    } catch {
      name = nameEnc;
    }

    return {
      phone: normalizePhone(phoneRaw),
      name: name || undefined,
    };
  } catch {
    return null;
  }
}

export function userSessionCookieOptions(token: string) {
  return {
    name: USER_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}

export function clearUserSessionCookieOptions() {
  return {
    name: USER_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}
