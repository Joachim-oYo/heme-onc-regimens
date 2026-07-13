import type { GraphData, Cell } from "./types";

/**
 * Pure validation helpers used by both the seed script and the write API.
 * They operate on plain data with no DB or React dependency.
 */

/**
 * Check that every cross-tier edge and lineage parent points at an entity that
 * exists. Returns a list of human-readable problems (empty when valid).
 */
export function validateReferentialIntegrity(data: GraphData): string[] {
  const cellIds = new Set(data.cells.map((c) => c.id));
  const diseaseIds = new Set(data.diseases.map((d) => d.id));
  const regimenIds = new Set(data.regimens.map((r) => r.id));
  const problems: string[] = [];

  for (const c of data.cells) {
    if (c.parentId && !cellIds.has(c.parentId)) {
      problems.push(`Cell "${c.id}" has unknown parentId "${c.parentId}"`);
    }
  }
  for (const d of data.diseases) {
    for (const id of d.cellIds) {
      if (!cellIds.has(id)) problems.push(`Disease "${d.id}" references unknown cell "${id}"`);
    }
  }
  for (const r of data.regimens) {
    for (const id of r.diseaseIds) {
      if (!diseaseIds.has(id))
        problems.push(`Regimen "${r.id}" references unknown disease "${id}"`);
    }
  }
  for (const drug of data.drugs) {
    for (const id of drug.regimenIds) {
      if (!regimenIds.has(id))
        problems.push(`Drug "${drug.id}" references unknown regimen "${id}"`);
    }
  }
  return problems;
}

/**
 * Would setting `cellId`'s parent to `newParentId` create a cycle in the
 * lineage tree? Walks up from the proposed parent looking for `cellId`.
 * `cells` is the current set (excluding the pending change).
 */
export function wouldCreateLineageCycle(
  cells: Pick<Cell, "id" | "parentId">[],
  cellId: string,
  newParentId: string | null,
): boolean {
  if (newParentId === null) return false;
  if (newParentId === cellId) return true;
  const parentOf = new Map(cells.map((c) => [c.id, c.parentId]));
  let cursor: string | null | undefined = newParentId;
  const guard = new Set<string>();
  while (cursor) {
    if (cursor === cellId) return true;
    if (guard.has(cursor)) break; // pre-existing cycle; stop
    guard.add(cursor);
    cursor = parentOf.get(cursor) ?? null;
  }
  return false;
}
