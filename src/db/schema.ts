import {
  pgTable,
  text,
  integer,
  primaryKey,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { LINEAGES } from "@/lib/constants";

/**
 * Postgres schema. Entity tables hold intrinsic fields; many-to-many edges
 * live in explicit join tables so each edge is stored exactly once. Cascade
 * deletes on the join tables give referential cleanup for free.
 */

export const cells = pgTable("cells", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  // Lineage parent (self-reference). HSC has null. Deleting a parent nulls
  // children rather than deleting them.
  parentId: text("parent_id").references((): AnyPgColumn => cells.id, {
    onDelete: "set null",
  }),
  lineage: text("lineage", { enum: LINEAGES }),
  order: integer("order"),
});

export const diseases = pgTable("diseases", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  abbreviation: text("abbreviation"),
});

export const regimens = pgTable("regimens", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const drugs = pgTable("drugs", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  mechanism: text("mechanism").notNull().default(""),
  toxicities: text("toxicities").array().notNull().default([]),
});

// --- Join tables (each row is one many-to-many edge) ---

export const diseaseCells = pgTable(
  "disease_cells",
  {
    diseaseId: text("disease_id")
      .notNull()
      .references(() => diseases.id, { onDelete: "cascade" }),
    cellId: text("cell_id")
      .notNull()
      .references(() => cells.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.diseaseId, t.cellId] })],
);

export const regimenDiseases = pgTable(
  "regimen_diseases",
  {
    regimenId: text("regimen_id")
      .notNull()
      .references(() => regimens.id, { onDelete: "cascade" }),
    diseaseId: text("disease_id")
      .notNull()
      .references(() => diseases.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.regimenId, t.diseaseId] })],
);

export const drugRegimens = pgTable(
  "drug_regimens",
  {
    drugId: text("drug_id")
      .notNull()
      .references(() => drugs.id, { onDelete: "cascade" }),
    regimenId: text("regimen_id")
      .notNull()
      .references(() => regimens.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.drugId, t.regimenId] })],
);
