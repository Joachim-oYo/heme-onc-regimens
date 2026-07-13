"use client";
import { useMemo } from "react";
import { GraphProvider } from "@/state/GraphProvider";
import { AppShell } from "./AppShell";
import { CellLineageDiagram } from "./CellLineageDiagram";
import { EntityColumn, type ColumnItem } from "./EntityColumn";
import { InfoPanel } from "./InfoPanel";
import { LiveRegion } from "./LiveRegion";
import type { GraphData } from "@/lib/types";

/**
 * The read-only cross-highlighter: lineage diagram on top, then three entity
 * columns (diseases, regimens, drugs) and an info panel. All highlight state
 * lives in the selection store and is derived per-node, so only affected nodes
 * re-render.
 */
export function Viewer({ data }: { data: GraphData }) {
  return (
    <GraphProvider data={data}>
      <AppShell>
        <ViewerBody data={data} />
        <LiveRegion />
      </AppShell>
    </GraphProvider>
  );
}

function ViewerBody({ data }: { data: GraphData }) {
  const diseaseItems = useMemo<ColumnItem[]>(
    () =>
      [...data.diseases]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((d) => ({ id: d.id, name: d.name, sublabel: d.abbreviation ?? undefined })),
    [data.diseases],
  );
  const regimenItems = useMemo<ColumnItem[]>(
    () =>
      [...data.regimens]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((r) => ({ id: r.id, name: r.name })),
    [data.regimens],
  );
  const drugItems = useMemo<ColumnItem[]>(
    () =>
      [...data.drugs]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((d) => ({ id: d.id, name: d.name })),
    [data.drugs],
  );

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 p-4">
      <div className="bg-card/40 shrink-0 rounded-lg border p-2">
        <h2 className="text-muted-foreground mb-1 px-1 text-xs font-semibold tracking-wide uppercase">
          Cell lineage
        </h2>
        <CellLineageDiagram />
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 pb-2 md:grid-cols-3 lg:grid-cols-4">
        <EntityColumn kind="disease" items={diseaseItems} />
        <EntityColumn kind="regimen" items={regimenItems} />
        <EntityColumn kind="drug" items={drugItems} />
        <InfoPanel variant="column" />
      </div>
      {/* Mobile: info slides up from the bottom only when a drug is resolved. */}
      <InfoPanel variant="dock" />
    </main>
  );
}
