import { KIND_ID_PREFIX, type EntityKind } from "./constants";

/** Lowercase, hyphenate, strip non-alphanumerics. `7+3 induction` -> `7-3-induction`. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/**
 * Generate a stable, human-readable, prefixed ID from a name, avoiding
 * collisions with `existingIds` by appending `_2`, `_3`, ... IDs are immutable
 * once assigned so relationship edges never break on rename.
 */
export function makeId(
  kind: EntityKind,
  name: string,
  existingIds: Iterable<string>,
): string {
  const prefix = KIND_ID_PREFIX[kind];
  const slug = slugify(name) || "item";
  const base = `${prefix}_${slug}`;
  const taken = new Set(existingIds);
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}_${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}
