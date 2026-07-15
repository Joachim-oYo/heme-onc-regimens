import { z } from "zod";

/**
 * Zod schemas for the four entity kinds. These validate API payloads and are
 * shared with client forms via `@hookform/resolvers`. Cross-tier edges are
 * stored as arrays of IDs pointing UP the chain (a disease knows its cells,
 * etc.); the reverse direction is derived by the graph engine, never stored.
 *
 * `id` is optional on input (the server generates it on create); the full
 * entity schemas below require it.
 */

const nonEmpty = z.string().trim().min(1, "Required");

export const CellSchema = z.object({
  id: z.string(),
  name: nonEmpty,
  parentId: z.string().nullable(),
  order: z.number().int().nullable(),
});

export const DiseaseSchema = z.object({
  id: z.string(),
  name: nonEmpty,
  abbreviation: z.string().trim().nullable(),
  cellIds: z.array(z.string()),
});

export const RegimenSchema = z.object({
  id: z.string(),
  name: nonEmpty,
  diseaseIds: z.array(z.string()),
});

export const DrugSchema = z.object({
  id: z.string(),
  name: nonEmpty,
  mechanism: z.string().trim(),
  toxicities: z.array(z.string().trim().min(1)),
  regimenIds: z.array(z.string()),
});

/** Input schemas: same shape but `id` omitted (assigned server-side). */
export const CellInput = CellSchema.omit({ id: true });
export const DiseaseInput = DiseaseSchema.omit({ id: true });
export const RegimenInput = RegimenSchema.omit({ id: true });
export const DrugInput = DrugSchema.omit({ id: true });

export const GraphDataSchema = z.object({
  cells: z.array(CellSchema),
  diseases: z.array(DiseaseSchema),
  regimens: z.array(RegimenSchema),
  drugs: z.array(DrugSchema),
});

/** Map a kind to its full entity and input schemas for generic handlers. */
export const ENTITY_SCHEMA = {
  cell: { full: CellSchema, input: CellInput },
  disease: { full: DiseaseSchema, input: DiseaseInput },
  regimen: { full: RegimenSchema, input: RegimenInput },
  drug: { full: DrugSchema, input: DrugInput },
} as const;
