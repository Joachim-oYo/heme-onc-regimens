import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { SESSION_COOKIE } from "./authConstants";

/**
 * Minimal admin auth: a single shared password (ADMIN_PASSWORD) grants editing.
 * On success we set a signed, httpOnly cookie whose value is an HMAC over a
 * constant marker. This is intentionally lightweight — a clean seam to replace
 * with real per-user accounts later (see README).
 */

export { SESSION_COOKIE };
const SESSION_MARKER = "admin";

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set (see .env.example).");
  return s;
}

/** The value to store in the session cookie after a correct password. */
export function makeSessionToken(): string {
  return createHmac("sha256", secret()).update(SESSION_MARKER).digest("hex");
}

/** Constant-time check that a cookie value is a valid session token. */
export function isValidSession(token: string | undefined): boolean {
  if (!token) return false;
  const expected = makeSessionToken();
  if (token.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

/** Check a submitted password against ADMIN_PASSWORD (constant-time). */
export function checkPassword(submitted: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("ADMIN_PASSWORD is not set (see .env.example).");
  const a = Buffer.from(submitted);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
