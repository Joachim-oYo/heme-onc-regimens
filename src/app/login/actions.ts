"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, makeSessionToken, checkPassword } from "@/lib/auth";

/**
 * Server action: verify the admin password and, on success, set the signed
 * session cookie, then redirect to the intended destination.
 */
export async function login(formData: FormData): Promise<{ error?: string } | void> {
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/edit") || "/edit";

  if (!process.env.ADMIN_PASSWORD || !process.env.SESSION_SECRET) {
    return { error: "Server is missing ADMIN_PASSWORD / SESSION_SECRET." };
  }
  if (!checkPassword(password)) {
    return { error: "Incorrect password." };
  }

  const store = await cookies();
  store.set(SESSION_COOKIE, makeSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  // Only allow same-site relative redirects.
  redirect(next.startsWith("/") ? next : "/edit");
}

export async function logout(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/");
}
