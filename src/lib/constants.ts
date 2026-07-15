/**
 * Shared constants describing the four entity kinds and their relationships.
 * The app is a four-tier cascade: cells -> diseases -> regimens -> drugs.
 */

export const ENTITY_KINDS = ["cell", "disease", "regimen", "drug"] as const;
export type EntityKind = (typeof ENTITY_KINDS)[number];

/** Plural route/table segment for each kind, used in API paths and DB tables. */
export const KIND_PLURAL: Record<EntityKind, string> = {
  cell: "cells",
  disease: "diseases",
  regimen: "regimens",
  drug: "drugs",
};

/** Reverse lookup: plural segment -> singular kind. */
export const PLURAL_TO_KIND: Record<string, EntityKind> = Object.fromEntries(
  ENTITY_KINDS.map((k) => [KIND_PLURAL[k], k]),
) as Record<string, EntityKind>;

/** Human-readable singular / plural labels for UI. */
export const KIND_LABEL: Record<EntityKind, { singular: string; plural: string }> = {
  cell: { singular: "Cell", plural: "Cells" },
  disease: { singular: "Disease", plural: "Diseases" },
  regimen: { singular: "Regimen", plural: "Regimens" },
  drug: { singular: "Drug", plural: "Drugs" },
};

/** ID prefix per kind, e.g. `cell_hsc`, `dis_aml`. */
export const KIND_ID_PREFIX: Record<EntityKind, string> = {
  cell: "cell",
  disease: "dis",
  regimen: "reg",
  drug: "drug",
};

/**
 * The "up-chain" relationship for each kind: the kind it points to and the
 * field name that holds those IDs. Cells sit at the top and own no cross-tier
 * edge. This drives generic editor forms and the relationship pickers.
 */
export const UP_RELATION: Record<
  EntityKind,
  { targetKind: EntityKind; field: string } | null
> = {
  cell: null,
  disease: { targetKind: "cell", field: "cellIds" },
  regimen: { targetKind: "disease", field: "diseaseIds" },
  drug: { targetKind: "regimen", field: "regimenIds" },
};

export function isEntityKind(value: string): value is EntityKind {
  return (ENTITY_KINDS as readonly string[]).includes(value);
}
