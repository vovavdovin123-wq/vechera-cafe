import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "vechera_admin";
const MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 дней

function secret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "vechera-dev-secret-change-me"
  );
}

export function getAdminCredentials() {
  return {
    login: process.env.ADMIN_LOGIN || "admin",
    password: process.env.ADMIN_PASSWORD || "vechera2024",
  };
}

export function createSessionToken(login: string): string {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const payload = `${login}.${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [login, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!login || !Number.isFinite(exp) || Date.now() > exp) return false;

  const payload = `${login}.${expStr}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SEC,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

export { COOKIE_NAME };
