import type { z } from "zod";
import type {
  CellSchema,
  DiseaseSchema,
  RegimenSchema,
  DrugSchema,
  CellInput,
  DiseaseInput,
  RegimenInput,
  DrugInput,
} from "./schema";
import type { EntityKind } from "./constants";

/**
 * Canonical app-facing entity types, derived from the Zod schemas so there is
 * a single source of truth. Cross-tier edges are ID arrays pointing up the
 * chain; these shapes are what the graph engine, UI, and forms consume.
 */
export type Cell = z.infer<typeof CellSchema>;
export type Disease = z.infer<typeof DiseaseSchema>;
export type Regimen = z.infer<typeof RegimenSchema>;
export type Drug = z.infer<typeof DrugSchema>;

export type CellInputT = z.infer<typeof CellInput>;
export type DiseaseInputT = z.infer<typeof DiseaseInput>;
export type RegimenInputT = z.infer<typeof RegimenInput>;
export type DrugInputT = z.infer<typeof DrugInput>;

export type Entity = Cell | Disease | Regimen | Drug;

/** Map a kind to its entity / input type. */
export interface EntityByKind {
  cell: Cell;
  disease: Disease;
  regimen: Regimen;
  drug: Drug;
}
export interface InputByKind {
  cell: CellInputT;
  disease: DiseaseInputT;
  regimen: RegimenInputT;
  drug: DrugInputT;
}

/** The full graph, one array per kind. */
export interface GraphData {
  cells: Cell[];
  diseases: Disease[];
  regimens: Regimen[];
  drugs: Drug[];
}

/** A user's selection of a single entity. */
export interface Selection {
  kind: EntityKind;
  id: string;
}

export type { EntityKind };
