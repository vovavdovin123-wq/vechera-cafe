import { cookies } from "next/headers";
import { COOKIE_NAME, verifySessionToken } from "@/lib/admin-auth";

export async function isAdminSession(): Promise<boolean> {
  const jar = await cookies();
  return verifySessionToken(jar.get(COOKIE_NAME)?.value);
}
