// One-time helper: attach imported (orphaned) cells to sensible lineage
// parents so the diagram renders as a connected tree. Best-effort based on
// standard hematopoiesis; refine any placement in the editor afterward.
//
// Run: pnpm tsx --env-file=.env.local src/db/link-lineage.ts          (dry run)
//      pnpm tsx --env-file=.env.local src/db/link-lineage.ts --commit
import { eq } from "drizzle-orm";
import { db, schema } from "./index";
import { wouldCreateLineageCycle } from "@/lib/mutations";

const COMMIT = process.argv.includes("--commit");

// child cell name -> parent cell name (matched case-insensitively).
const MAPPING: Record<string, string> = {
  "Erythroid progenitor": "Myeloid progenitor",
  "Granulocyte progenitor": "Myeloid progenitor",
  "Megakaryocytic progenitor": "Myeloid progenitor",
  "Eosinophil progenitors": "Myeloid progenitor",
  Fibroblast: "Myeloid progenitor",
  "Mature granulocyte": "Granulocyte (neutrophil / basophil / eosinophil)",
  Eosinophils: "Eosinophil progenitors",
  "Germinal center B cell": "Mature B cell",
  "Mature B cell": "Naive B cell",
  "Marginal zone B cell": "Mature B cell",
  "Post-germinal center B cell": "Germinal center B cell",
  "Late activated memory B cell": "Post-germinal center B cell",
  "Mature NK cell": "Lymphoid progenitor",
};

async function main() {
  const cells = await db.select().from(schema.cells);
  const idByName = new Map(cells.map((c) => [c.name.toLowerCase(), c.id]));
  const parentPairs = cells.map((c) => ({ id: c.id, parentId: c.parentId }));

  const updates: { childId: string; parentId: string; label: string }[] = [];
  for (const [childName, parentName] of Object.entries(MAPPING)) {
    const childId = idByName.get(childName.toLowerCase());
    const parentId = idByName.get(parentName.toLowerCase());
    if (!childId) {
      console.warn(`  SKIP: child not found: "${childName}"`);
      continue;
    }
    if (!parentId) {
      console.warn(`  SKIP: parent not found: "${parentName}" (for "${childName}")`);
      continue;
    }
    if (wouldCreateLineageCycle(parentPairs, childId, parentId)) {
      console.warn(`  SKIP: would create cycle: "${childName}" -> "${parentName}"`);
      continue;
    }
    updates.push({ childId, parentId, label: `${childName} -> ${parentName}` });
  }

  console.log(`Planned ${updates.length} lineage links:`);
  for (const u of updates) console.log("  " + u.label);

  if (!COMMIT) {
    console.log("\n--- DRY RUN (no writes). Re-run with --commit to apply. ---");
    return;
  }

  for (const u of updates) {
    await db
      .update(schema.cells)
      .set({ parentId: u.parentId })
      .where(eq(schema.cells.id, u.childId));
  }
  console.log("\nLineage links applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
