// One-time importer for the Med Ed CSV. Best-effort: maps the Category/Disease/
// Cell/Therapy columns into the four-tier model, skipping fields with no home
// (HSCT, free-text notes). Upserts by NAME so re-running adds new entities and
// updates existing ones without creating duplicates.
//
// Run: pnpm tsx --env-file=.env.local src/db/import.ts          (dry run)
//      pnpm tsx --env-file=.env.local src/db/import.ts --commit (writes to DB)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";
import { db, schema } from "./index";
import { slugify } from "@/lib/ids";

const here = dirname(fileURLToPath(import.meta.url));
const COMMIT = process.argv.includes("--commit");

interface Row {
  Category: string;
  Disease: string;
  Cell: string;
  Therapy: string;
  "HSCT?": string;
  Notes: string;
}

/**
 * Known drug names to extract from the freeform Therapy prose. We match these
 * as whole words (case-insensitive). Anything not on this list is ignored to
 * avoid turning regimen acronyms and prose ("initial:", "refractory") into
 * bogus drugs. Extend this list as needed.
 */
const KNOWN_DRUGS = [
  "asciminib", "imatinib", "dasatinib", "aspirin", "hydroxyurea", "anagrelide",
  "ruxolitinib", "ruloxitinib", "momelotinib", "lenalidomide", "luspatercept",
  "azacitidine", "azacitadine", "azacidatine", "decitabine", "venetoclax",
  "ivosidenib", "ivosidinib", "cytarabine", "idarubicin", "doxorubicin",
  "daunorubicin", "cyclophosphamide", "vincristine", "dexamethasone",
  "methotrexate", "L-asparaginase", "asparaginase", "prednisone", "ibrutinib",
  "acalabrutinib", "zanubrutinib", "zanibrutinib", "obinutuzumab", "bendamustine",
  "rituximab", "cladribine", "pentostatin", "vemurafenib", "chlorambucil",
  "pirtobrutinib", "pritobrutinib", "etoposide", "phlebotomy", "IFNa",
];

// Normalize common misspellings to a canonical drug name.
const DRUG_CANONICAL: Record<string, string> = {
  ruloxitinib: "ruxolitinib",
  azacitadine: "azacitidine",
  azacidatine: "azacitidine",
  ivosidinib: "ivosidenib",
  zanibrutinib: "zanubrutinib",
  pritobrutinib: "pirtobrutinib",
  asparaginase: "L-asparaginase",
};

function titleCase(s: string): string {
  return s.length <= 3 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

function extractDrugs(therapy: string): string[] {
  if (!therapy) return [];
  const found = new Set<string>();
  const lower = therapy.toLowerCase();
  for (const drug of KNOWN_DRUGS) {
    const re = new RegExp(`\\b${drug.toLowerCase().replace(/[-]/g, "\\-?")}\\b`);
    if (re.test(lower)) {
      const canonical = DRUG_CANONICAL[drug.toLowerCase()] ?? drug;
      found.add(titleCase(canonical));
    }
  }
  return [...found];
}

/** Split a Cell cell into individual cell names, stripping parentheticals. */
function parseCells(cell: string): string[] {
  if (!cell) return [];
  return cell
    .split(",")
    .map((c) => c.replace(/\([^)]*\)/g, "").trim())
    .filter(Boolean)
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1));
}

/** Extract an abbreviation from a disease name like "... (CML)". */
function diseaseAbbrev(name: string): string | null {
  const m = name.match(/\(([^)]+)\)\s*$/);
  return m ? m[1] : null;
}

async function main() {
  const csv = readFileSync(join(here, "import-source.csv"), "utf8");
  const rows: Row[] = parse(csv, { columns: true, skip_empty_lines: true });

  // Accumulate unique entities by display name.
  const cells = new Map<string, { name: string }>();
  const diseases = new Map<
    string,
    { name: string; abbreviation: string | null; cellNames: string[] }
  >();
  const regimens = new Map<string, { name: string; diseaseNames: string[] }>();
  const drugs = new Map<string, { name: string; regimenNames: string[] }>();

  for (const row of rows) {
    const diseaseName = row.Disease?.trim();
    if (!diseaseName) continue;

    const cellNames = parseCells(row.Cell);
    for (const c of cellNames) if (!cells.has(c)) cells.set(c, { name: c });

    diseases.set(diseaseName, {
      name: diseaseName,
      abbreviation: diseaseAbbrev(diseaseName),
      cellNames,
    });

    const drugNames = extractDrugs(row.Therapy);
    if (drugNames.length) {
      // One regimen per disease, named after the disease's abbreviation.
      const abbr = diseaseAbbrev(diseaseName) ?? diseaseName;
      const regName = `${abbr} therapy`;
      regimens.set(regName, { name: regName, diseaseNames: [diseaseName] });
      for (const d of drugNames) {
        const existing = drugs.get(d);
        if (existing) existing.regimenNames.push(regName);
        else drugs.set(d, { name: d, regimenNames: [regName] });
      }
    }
  }

  console.log("Parsed from CSV:");
  console.log(`  ${cells.size} cells, ${diseases.size} diseases, ${regimens.size} regimens, ${drugs.size} drugs`);
  console.log("\nDrugs extracted:", [...drugs.keys()].sort().join(", "));
  console.log("\nSample disease -> cells:");
  for (const d of [...diseases.values()].slice(0, 5)) {
    console.log(`  ${d.name}  [${d.abbreviation ?? "-"}]  cells: ${d.cellNames.join(", ") || "(none)"}`);
  }

  if (!COMMIT) {
    console.log("\n--- DRY RUN (no writes). Re-run with --commit to apply. ---");
    return;
  }

  console.log("\nApplying to database (upsert by name)...");

  // Preload existing rows so we upsert by name.
  const existingCells = await db.select().from(schema.cells);
  const existingDiseases = await db.select().from(schema.diseases);
  const existingRegimens = await db.select().from(schema.regimens);
  const existingDrugs = await db.select().from(schema.drugs);

  const cellIdByName = new Map(existingCells.map((c) => [c.name.toLowerCase(), c.id]));
  const diseaseIdByName = new Map(existingDiseases.map((d) => [d.name.toLowerCase(), d.id]));
  const regimenIdByName = new Map(existingRegimens.map((r) => [r.name.toLowerCase(), r.id]));
  const drugIdByName = new Map(existingDrugs.map((d) => [d.name.toLowerCase(), d.id]));
  const usedIds = new Set([
    ...existingCells.map((c) => c.id),
    ...existingDiseases.map((d) => d.id),
    ...existingRegimens.map((r) => r.id),
    ...existingDrugs.map((d) => d.id),
  ]);

  function idFor(prefix: string, name: string, byName: Map<string, string>): string {
    const key = name.toLowerCase();
    const existing = byName.get(key);
    if (existing) return existing;
    let base = `${prefix}_${slugify(name) || "item"}`;
    let id = base;
    for (let n = 2; usedIds.has(id); n++) id = `${base}_${n}`;
    usedIds.add(id);
    byName.set(key, id);
    return id;
  }

  // Cells (no cross-tier edges; lineage parent left null for imported cells).
  for (const c of cells.values()) {
    const id = idFor("cell", c.name, cellIdByName);
    await db
      .insert(schema.cells)
      .values({ id, name: c.name, parentId: null, lineage: null, order: null })
      .onConflictDoUpdate({ target: schema.cells.id, set: { name: c.name } });
  }

  // Diseases + disease->cell edges.
  for (const d of diseases.values()) {
    const id = idFor("dis", d.name, diseaseIdByName);
    await db
      .insert(schema.diseases)
      .values({ id, name: d.name, abbreviation: d.abbreviation })
      .onConflictDoUpdate({
        target: schema.diseases.id,
        set: { name: d.name, abbreviation: d.abbreviation },
      });
    await db.delete(schema.diseaseCells).where(eq(schema.diseaseCells.diseaseId, id));
    const cellIds = d.cellNames
      .map((n) => cellIdByName.get(n.toLowerCase()))
      .filter((x): x is string => Boolean(x));
    if (cellIds.length) {
      await db
        .insert(schema.diseaseCells)
        .values(cellIds.map((cellId) => ({ diseaseId: id, cellId })))
        .onConflictDoNothing();
    }
  }

  // Regimens + regimen->disease edges.
  for (const r of regimens.values()) {
    const id = idFor("reg", r.name, regimenIdByName);
    await db
      .insert(schema.regimens)
      .values({ id, name: r.name })
      .onConflictDoUpdate({ target: schema.regimens.id, set: { name: r.name } });
    await db.delete(schema.regimenDiseases).where(eq(schema.regimenDiseases.regimenId, id));
    const diseaseIds = r.diseaseNames
      .map((n) => diseaseIdByName.get(n.toLowerCase()))
      .filter((x): x is string => Boolean(x));
    if (diseaseIds.length) {
      await db
        .insert(schema.regimenDiseases)
        .values(diseaseIds.map((diseaseId) => ({ regimenId: id, diseaseId })))
        .onConflictDoNothing();
    }
  }

  // Drugs + drug->regimen edges. Preserve existing mechanism/toxicities.
  for (const drug of drugs.values()) {
    const id = idFor("drug", drug.name, drugIdByName);
    const already = existingDrugs.find((x) => x.id === id);
    await db
      .insert(schema.drugs)
      .values({
        id,
        name: drug.name,
        mechanism: already?.mechanism ?? "",
        toxicities: already?.toxicities ?? [],
      })
      .onConflictDoUpdate({ target: schema.drugs.id, set: { name: drug.name } });
    const regimenIds = drug.regimenNames
      .map((n) => regimenIdByName.get(n.toLowerCase()))
      .filter((x): x is string => Boolean(x));
    if (regimenIds.length) {
      await db
        .insert(schema.drugRegimens)
        .values(regimenIds.map((regimenId) => ({ drugId: id, regimenId })))
        .onConflictDoNothing();
    }
  }

  console.log("Import complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
