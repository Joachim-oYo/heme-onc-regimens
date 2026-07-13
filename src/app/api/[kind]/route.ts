import { NextResponse, type NextRequest } from "next/server";
import { PLURAL_TO_KIND, type EntityKind } from "@/lib/constants";
import { ENTITY_SCHEMA } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";
import { makeId } from "@/lib/ids";
import {
  readGraphData,
  existingIds,
  createCell,
  createDisease,
  createRegimen,
  createDrug,
} from "@/lib/dataStore";
import { wouldCreateLineageCycle } from "@/lib/mutations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveKind(raw: string): EntityKind | null {
  return PLURAL_TO_KIND[raw] ?? null;
}

/** GET /api/[kind] — list all entities of a kind. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ kind: string }> },
) {
  const kind = resolveKind((await params).kind);
  if (!kind) return NextResponse.json({ error: "Unknown kind" }, { status: 404 });
  const data = await readGraphData();
  const key = (kind + "s") as keyof typeof data;
  return NextResponse.json(data[key]);
}

/** POST /api/[kind] — create an entity (server assigns the id). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ kind: string }> },
) {
  const kind = resolveKind((await params).kind);
  if (!kind) return NextResponse.json({ error: "Unknown kind" }, { status: 404 });

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ENTITY_SCHEMA[kind].input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const ids = await existingIds(kind);
  const id = makeId(kind, input.name, ids);

  // Cell lineage cycle guard (a new cell can't cycle, but validate anyway).
  if (kind === "cell") {
    const cellInput = input as { parentId: string | null };
    const data = await readGraphData();
    if (wouldCreateLineageCycle(data.cells, id, cellInput.parentId)) {
      return NextResponse.json({ error: "Would create a lineage cycle" }, { status: 400 });
    }
  }

  try {
    switch (kind) {
      case "cell":
        await createCell(id, input as never);
        break;
      case "disease":
        await createDisease(id, input as never);
        break;
      case "regimen":
        await createRegimen(id, input as never);
        break;
      case "drug":
        await createDrug(id, input as never);
        break;
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Create failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id }, { status: 201 });
}
