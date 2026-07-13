"use client";
import { useMemo } from "react";
import Link from "next/link";
import { EditorColumn } from "./EditorColumn";
import { Button, buttonVariants } from "@/components/ui/button";
import { logout } from "@/app/login/actions";
import type { GraphData } from "@/lib/types";
import { Eye } from "lucide-react";

/**
 * The editor shell: four columns (cells, diseases, regimens, drugs), each with
 * add/edit/delete. Dependent counts (how many entities reference a given one)
 * are computed once per kind from the current data so delete dialogs can warn.
 */
export function Editor({ data }: { data: GraphData }) {
  const deps = useMemo(() => {
    const cell = new Map<string, number>();
    const disease = new Map<string, number>();
    const regimen = new Map<string, number>();
    const bump = (m: Map<string, number>, id: string) =>
      m.set(id, (m.get(id) ?? 0) + 1);

    for (const d of data.diseases) for (const c of d.cellIds) bump(cell, c);
    for (const r of data.regimens) for (const d of r.diseaseIds) bump(disease, d);
    for (const dr of data.drugs) for (const r of dr.regimenIds) bump(regimen, r);
    // Cell also counts children as dependents.
    for (const c of data.cells) if (c.parentId) bump(cell, c.parentId);

    return { cell, disease, regimen, drug: new Map<string, number>() };
  }, [data]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight">
            Heme-Onc Regimens — Editor
          </span>
          <span className="text-muted-foreground hidden text-xs sm:inline">
            add, edit, and connect entities
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
            <Eye className="size-4" />
            <span className="hidden sm:inline">View</span>
          </Link>
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              Sign out
            </Button>
          </form>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-y-auto p-4 sm:grid-cols-2 lg:grid-cols-4">
        <EditorColumn
          kind="cell"
          items={[...data.cells].sort((a, b) => a.name.localeCompare(b.name))}
          data={data}
          dependentCount={(id) => deps.cell.get(id) ?? 0}
        />
        <EditorColumn
          kind="disease"
          items={[...data.diseases].sort((a, b) => a.name.localeCompare(b.name))}
          data={data}
          dependentCount={(id) => deps.disease.get(id) ?? 0}
        />
        <EditorColumn
          kind="regimen"
          items={[...data.regimens].sort((a, b) => a.name.localeCompare(b.name))}
          data={data}
          dependentCount={(id) => deps.regimen.get(id) ?? 0}
        />
        <EditorColumn
          kind="drug"
          items={[...data.drugs].sort((a, b) => a.name.localeCompare(b.name))}
          data={data}
          dependentCount={() => 0}
        />
      </main>
    </div>
  );
}
