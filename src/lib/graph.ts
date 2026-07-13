import type {
  GraphData,
  Cell,
  Disease,
  Regimen,
  Drug,
  Selection,
  EntityKind,
} from "./types";

/**
 * The relationship / highlighting engine. Pure and framework-free.
 *
 * The graph is a four-layer chain where every hop is many-to-many:
 *   cells -> diseases -> regimens -> drugs
 * Edges are stored pointing UP the chain (disease.cellIds, regimen.diseaseIds,
 * drug.regimenIds). This module builds an index with the reverse (downward)
 * adjacency derived once, then computes the highlight set for a selection by
 * sweeping both directions.
 */

export interface GraphIndex {
  cell: Map<string, Cell>;
  disease: Map<string, Disease>;
  regimen: Map<string, Regimen>;
  drug: Map<string, Drug>;

  // Derived downward adjacency (reverse of the stored up-edges).
  cellToDiseases: Map<string, string[]>;
  diseaseToRegimens: Map<string, string[]>;
  regimenToDrugs: Map<string, string[]>;

  // Lineage tree, derived from cell.parentId.
  cellChildren: Map<string, string[]>;
}

export interface HighlightSet {
  cells: Set<string>;
  diseases: Set<string>;
  regimens: Set<string>;
  drugs: Set<string>;
  /** The originally selected entity. */
  source: Selection;
}

function pushInto(map: Map<string, string[]>, key: string, value: string) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

/** Build the in-memory index. O(V + E). */
export function buildIndex(data: GraphData): GraphIndex {
  const cell = new Map(data.cells.map((c) => [c.id, c]));
  const disease = new Map(data.diseases.map((d) => [d.id, d]));
  const regimen = new Map(data.regimens.map((r) => [r.id, r]));
  const drug = new Map(data.drugs.map((d) => [d.id, d]));

  const cellToDiseases = new Map<string, string[]>();
  const diseaseToRegimens = new Map<string, string[]>();
  const regimenToDrugs = new Map<string, string[]>();
  const cellChildren = new Map<string, string[]>();

  for (const d of data.diseases) {
    for (const cellId of d.cellIds) pushInto(cellToDiseases, cellId, d.id);
  }
  for (const r of data.regimens) {
    for (const diseaseId of r.diseaseIds) pushInto(diseaseToRegimens, diseaseId, r.id);
  }
  for (const drg of data.drugs) {
    for (const regimenId of drg.regimenIds) pushInto(regimenToDrugs, regimenId, drg.id);
  }
  for (const c of data.cells) {
    if (c.parentId) pushInto(cellChildren, c.parentId, c.id);
  }

  return {
    cell,
    disease,
    regimen,
    drug,
    cellToDiseases,
    diseaseToRegimens,
    regimenToDrugs,
    cellChildren,
  };
}

/**
 * Given a selection of any kind, compute the full set of related entities
 * across all four tiers. Sweeps DOWN (toward drugs) and UP (toward cells) from
 * the selected tier. Because tiers only connect to adjacent tiers there are no
 * cross-tier cycles, so plain forward/backward passes suffice.
 */
export function computeHighlights(index: GraphIndex, sel: Selection): HighlightSet {
  const cells = new Set<string>();
  const diseases = new Set<string>();
  const regimens = new Set<string>();
  const drugs = new Set<string>();

  // Seed the selected tier.
  if (sel.kind === "cell") cells.add(sel.id);
  else if (sel.kind === "disease") diseases.add(sel.id);
  else if (sel.kind === "regimen") regimens.add(sel.id);
  else drugs.add(sel.id);

  // --- Sweep DOWN: cells -> diseases -> regimens -> drugs ---
  // Only expand from tiers at or above the selected one.
  if (sel.kind === "cell") {
    for (const cellId of cells) {
      for (const dId of index.cellToDiseases.get(cellId) ?? []) diseases.add(dId);
    }
  }
  if (sel.kind === "cell" || sel.kind === "disease") {
    for (const dId of diseases) {
      for (const rId of index.diseaseToRegimens.get(dId) ?? []) regimens.add(rId);
    }
  }
  if (sel.kind === "cell" || sel.kind === "disease" || sel.kind === "regimen") {
    for (const rId of regimens) {
      for (const drgId of index.regimenToDrugs.get(rId) ?? []) drugs.add(drgId);
    }
  }

  // --- Sweep UP: drugs -> regimens -> diseases -> cells ---
  // Only expand from tiers at or below the selected one.
  if (sel.kind === "drug") {
    for (const drgId of drugs) {
      for (const rId of index.drug.get(drgId)?.regimenIds ?? []) regimens.add(rId);
    }
  }
  if (sel.kind === "drug" || sel.kind === "regimen") {
    for (const rId of regimens) {
      for (const dId of index.regimen.get(rId)?.diseaseIds ?? []) diseases.add(dId);
    }
  }
  if (sel.kind === "drug" || sel.kind === "regimen" || sel.kind === "disease") {
    for (const dId of diseases) {
      for (const cId of index.disease.get(dId)?.cellIds ?? []) cells.add(cId);
    }
  }

  return { cells, diseases, regimens, drugs, source: sel };
}

/**
 * Ancestors + descendants of a cell in the lineage tree (excluding the cell
 * itself). Used to render a lighter secondary tint along the lineage path when
 * a cell is the directly-selected source. Kept separate from HighlightSet so
 * the UI can style it distinctly.
 */
export function computeLineagePath(index: GraphIndex, cellId: string): Set<string> {
  const path = new Set<string>();

  // Ancestors.
  let cursor = index.cell.get(cellId)?.parentId ?? null;
  const guard = new Set<string>();
  while (cursor && !guard.has(cursor)) {
    guard.add(cursor);
    path.add(cursor);
    cursor = index.cell.get(cursor)?.parentId ?? null;
  }

  // Descendants (BFS down the children map).
  const queue = [...(index.cellChildren.get(cellId) ?? [])];
  while (queue.length) {
    const id = queue.shift()!;
    if (path.has(id)) continue;
    path.add(id);
    queue.push(...(index.cellChildren.get(id) ?? []));
  }

  return path;
}

/** Convenience: does a highlight set contain this entity? */
export function isInHighlight(
  hl: HighlightSet | null,
  kind: EntityKind,
  id: string,
): boolean {
  if (!hl) return false;
  switch (kind) {
    case "cell":
      return hl.cells.has(id);
    case "disease":
      return hl.diseases.has(id);
    case "regimen":
      return hl.regimens.has(id);
    case "drug":
      return hl.drugs.has(id);
  }
}
