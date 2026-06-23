import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "confiance_admin";

function adminToken(): string | null {
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!password) return null;
  return createHmac("sha256", password).update("confiance-admin").digest("hex");
}

export function isAdminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.trim());
}

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  return password === expected;
}

export function createAdminSessionCookie(): { name: string; value: string } | null {
  const token = adminToken();
  if (!token) return null;
  return { name: ADMIN_COOKIE, value: token };
}

export function isAdminAuthenticated(): boolean {
  const token = adminToken();
  if (!token) return false;

  const session = cookies().get(ADMIN_COOKIE)?.value;
  if (!session) return false;

  try {
    return timingSafeEqual(Buffer.from(session), Buffer.from(token));
  } catch {
    return false;
  }
}

export function adminCookieName(): string {
  return ADMIN_COOKIE;
}
