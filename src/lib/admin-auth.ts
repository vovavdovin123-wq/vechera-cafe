import { createHmac, timingSafeEqual } from "crypto";
import type { FranchiseId } from "./types";

const COOKIE_NAME = "vechera_admin";
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

export type AdminScope = "all" | FranchiseId;

export type AdminAccount = {
  login: string;
  password: string;
  scope: AdminScope;
};

export type AdminSession = {
  login: string;
  scope: AdminScope;
};

function secret() {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "vechera-dev-secret-change-me"
  );
}

function normalizeScope(raw?: string): AdminScope {
  const s = raw?.trim().toLowerCase();
  if (s === "center" || s === "hippodrome") return s;
  return "all";
}

/** Все аккаунты админки из .env */
export function getAdminAccounts(): AdminAccount[] {
  const fromList = process.env.ADMIN_USERS?.trim();
  if (fromList) {
    return fromList
      .split(",")
      .map((chunk) => {
        const [login, password, scopeRaw] = chunk.split(":");
        if (!login?.trim() || !password?.trim()) return null;
        return {
          login: login.trim(),
          password: password.trim(),
          scope: normalizeScope(scopeRaw),
        };
      })
      .filter((a): a is AdminAccount => Boolean(a));
  }

  const accounts: AdminAccount[] = [];
  const mainLogin = process.env.ADMIN_LOGIN?.trim();
  const mainPass = process.env.ADMIN_PASSWORD?.trim();
  if (mainLogin && mainPass) {
    accounts.push({
      login: mainLogin,
      password: mainPass,
      scope: normalizeScope(process.env.ADMIN_SCOPE) || "all",
    });
  }

  const hipLogin = process.env.ADMIN_LOGIN_HIPPODROME?.trim();
  const hipPass = process.env.ADMIN_PASSWORD_HIPPODROME?.trim();
  if (hipLogin && hipPass) {
    accounts.push({
      login: hipLogin,
      password: hipPass,
      scope: "hippodrome",
    });
  }

  if (accounts.length) return accounts;

  return [
    {
      login: process.env.ADMIN_LOGIN || "admin",
      password: process.env.ADMIN_PASSWORD || "vechera2024",
      scope: "all",
    },
  ];
}

export function verifyAdminCredentials(
  login: string,
  password: string,
): AdminAccount | null {
  const normalized = login.trim();
  return (
    getAdminAccounts().find(
      (a) => a.login === normalized && a.password === password,
    ) ?? null
  );
}

/** @deprecated используйте getAdminAccounts */
export function getAdminCredentials() {
  const first = getAdminAccounts()[0];
  return { login: first.login, password: first.password };
}

export function createSessionToken(login: string, scope: AdminScope): string {
  const exp = Date.now() + MAX_AGE_SEC * 1000;
  const payload = `${login}.${exp}.${scope}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function parseSessionToken(
  token: string | undefined,
): AdminSession | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3 && parts.length !== 4) return null;

  const login = parts[0];
  const expStr = parts[1];
  const scope: AdminScope =
    parts.length === 4 ? normalizeScope(parts[2]) : "all";
  const sig = parts.length === 4 ? parts[3] : parts[2];
  const exp = Number(expStr);

  if (!login || !Number.isFinite(exp) || Date.now() > exp) return null;

  const payload =
    parts.length === 4 ? `${login}.${expStr}.${scope}` : `${login}.${expStr}`;
  const expected = createHmac("sha256", secret()).update(payload).digest("hex");

  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    return { login, scope };
  } catch {
    return null;
  }
}

export function verifySessionToken(token: string | undefined): boolean {
  return parseSessionToken(token) !== null;
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
