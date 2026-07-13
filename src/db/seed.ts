import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { GraphDataSchema } from "@/lib/schema";
import { db, schema } from "./index";
import { validateReferentialIntegrity } from "@/lib/mutations";

const here = dirname(fileURLToPath(import.meta.url));

async function main() {
  const raw = JSON.parse(readFileSync(join(here, "seed-data.json"), "utf8"));
  const data = GraphDataSchema.parse(raw);

  // Fail loud if the seed references IDs that don't exist.
  const problems = validateReferentialIntegrity(data);
  if (problems.length > 0) {
    console.error("Seed data has dangling references:");
    for (const p of problems) console.error("  - " + p);
    process.exit(1);
  }

  console.log("Clearing existing data...");
  // Delete children before parents; join tables cascade but be explicit.
  await db.delete(schema.drugRegimens);
  await db.delete(schema.regimenDiseases);
  await db.delete(schema.diseaseCells);
  await db.delete(schema.drugs);
  await db.delete(schema.regimens);
  await db.delete(schema.diseases);
  await db.delete(schema.cells);

  console.log(`Inserting ${data.cells.length} cells...`);
  // Insert cells parent-before-child so the self-FK is satisfied. A simple
  // topological pass by walking down from roots.
  for (const cell of topoSortCells(data.cells)) {
    await db.insert(schema.cells).values({
      id: cell.id,
      name: cell.name,
      parentId: cell.parentId,
      lineage: cell.lineage,
      order: cell.order,
    });
  }

  console.log(`Inserting ${data.diseases.length} diseases...`);
  for (const d of data.diseases) {
    await db.insert(schema.diseases).values({
      id: d.id,
      name: d.name,
      abbreviation: d.abbreviation,
    });
    if (d.cellIds.length) {
      await db
        .insert(schema.diseaseCells)
        .values(d.cellIds.map((cellId) => ({ diseaseId: d.id, cellId })));
    }
  }

  console.log(`Inserting ${data.regimens.length} regimens...`);
  for (const r of data.regimens) {
    await db.insert(schema.regimens).values({ id: r.id, name: r.name });
    if (r.diseaseIds.length) {
      await db
        .insert(schema.regimenDiseases)
        .values(r.diseaseIds.map((diseaseId) => ({ regimenId: r.id, diseaseId })));
    }
  }

  console.log(`Inserting ${data.drugs.length} drugs...`);
  for (const drug of data.drugs) {
    await db.insert(schema.drugs).values({
      id: drug.id,
      name: drug.name,
      mechanism: drug.mechanism,
      toxicities: drug.toxicities,
    });
    if (drug.regimenIds.length) {
      await db
        .insert(schema.drugRegimens)
        .values(drug.regimenIds.map((regimenId) => ({ drugId: drug.id, regimenId })));
    }
  }

  console.log("Seed complete.");
}

/** Order cells so a parent always precedes its children (self-FK safe). */
function topoSortCells<T extends { id: string; parentId: string | null }>(
  cells: T[],
): T[] {
  const byId = new Map(cells.map((c) => [c.id, c]));
  const result: T[] = [];
  const seen = new Set<string>();
  function visit(cell: T) {
    if (seen.has(cell.id)) return;
    if (cell.parentId && byId.has(cell.parentId)) {
      visit(byId.get(cell.parentId)!);
    }
    seen.add(cell.id);
    result.push(cell);
  }
  for (const c of cells) visit(c);
  return result;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
