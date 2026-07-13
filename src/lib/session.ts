import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, isValidSession } from "./auth";

/** Is the current request authenticated as admin? (Node runtime.) */
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return isValidSession(store.get(SESSION_COOKIE)?.value);
}

/** Throw a 401-style error if not admin; used by mutating API routes. */
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    const err = new Error("Unauthorized");
    err.name = "UnauthorizedError";
    throw err;
  }
}
