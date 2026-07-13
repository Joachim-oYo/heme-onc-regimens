import { NextResponse, type NextRequest } from "next/server";
import { PLURAL_TO_KIND, type EntityKind } from "@/lib/constants";
import { ENTITY_SCHEMA } from "@/lib/schema";
import { requireAdmin } from "@/lib/session";
import {
  readGraphData,
  updateCell,
  updateDisease,
  updateRegimen,
  updateDrug,
  deleteEntity,
} from "@/lib/dataStore";
import { wouldCreateLineageCycle } from "@/lib/mutations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveKind(raw: string): EntityKind | null {
  return PLURAL_TO_KIND[raw] ?? null;
}

/** PUT /api/[kind]/[id] — replace an entity and its owned edges. */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind: rawKind, id } = await params;
  const kind = resolveKind(rawKind);
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

  if (kind === "cell") {
    const cellInput = input as { parentId: string | null };
    if (cellInput.parentId === id) {
      return NextResponse.json({ error: "A cell cannot be its own parent" }, { status: 400 });
    }
    const data = await readGraphData();
    if (wouldCreateLineageCycle(data.cells, id, cellInput.parentId)) {
      return NextResponse.json({ error: "Would create a lineage cycle" }, { status: 400 });
    }
  }

  try {
    switch (kind) {
      case "cell":
        await updateCell(id, input as never);
        break;
      case "disease":
        await updateDisease(id, input as never);
        break;
      case "regimen":
        await updateRegimen(id, input as never);
        break;
      case "drug":
        await updateDrug(id, input as never);
        break;
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Update failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id });
}

/** DELETE /api/[kind]/[id] — delete; join edges cascade, cell children null. */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind: rawKind, id } = await params;
  const kind = resolveKind(rawKind);
  if (!kind) return NextResponse.json({ error: "Unknown kind" }, { status: 404 });

  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await deleteEntity(kind, id);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Delete failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ id });
}
