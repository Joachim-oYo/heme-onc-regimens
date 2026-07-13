import { KIND_PLURAL, type EntityKind } from "./constants";
import type { InputByKind } from "./types";

/**
 * Thin client-side wrapper over the /api/[kind] route handlers. Throws an
 * Error with the server message on non-2xx so callers can surface it.
 */

async function handle(res: Response) {
  if (res.ok) return res.json().catch(() => ({}));
  const body = await res.json().catch(() => ({}));
  throw new Error(body?.error || `Request failed (${res.status})`);
}

export async function createEntity<K extends EntityKind>(
  kind: K,
  input: InputByKind[K],
): Promise<{ id: string }> {
  const res = await fetch(`/api/${KIND_PLURAL[kind]}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return handle(res);
}

export async function updateEntity<K extends EntityKind>(
  kind: K,
  id: string,
  input: InputByKind[K],
): Promise<{ id: string }> {
  const res = await fetch(`/api/${KIND_PLURAL[kind]}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return handle(res);
}

export async function deleteEntity(kind: EntityKind, id: string): Promise<void> {
  const res = await fetch(`/api/${KIND_PLURAL[kind]}/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  await handle(res);
}
