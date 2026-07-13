"use client";
import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EntityForm } from "./EntityForm";
import { DeleteConfirm } from "./DeleteConfirm";
import { KIND_LABEL, type EntityKind } from "@/lib/constants";
import type { GraphData, EntityByKind } from "@/lib/types";

/**
 * One editor column for a kind: a header with an Add button and a list of rows,
 * each with edit + delete affordances. Add/edit open a dialog with EntityForm.
 */
export function EditorColumn<K extends EntityKind>({
  kind,
  items,
  data,
  dependentCount,
}: {
  kind: K;
  items: EntityByKind[K][];
  data: GraphData;
  dependentCount: (id: string) => number;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EntityByKind[K] | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<EntityByKind[K] | null>(null);

  function openAdd() {
    setEditing(undefined);
    setDialogOpen(true);
  }
  function openEdit(item: EntityByKind[K]) {
    setEditing(item);
    setDialogOpen(true);
  }

  return (
    <section className="flex min-h-0 flex-col">
      <header className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase">
          {KIND_LABEL[kind].plural}
          <span className="text-muted-foreground ml-1.5 text-xs">{items.length}</span>
        </h2>
        <Button size="xs" variant="outline" onClick={openAdd}>
          <Plus className="size-3.5" />
          Add
        </Button>
      </header>

      <ul className="flex min-h-0 flex-col gap-1 overflow-y-auto pr-1">
        {items.map((item) => (
          <li
            key={item.id}
            className="group hover:bg-muted/60 flex items-center gap-1 rounded-md border px-2.5 py-1.5"
          >
            <span className="flex-1 truncate text-sm">{item.name}</span>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label={`Edit ${item.name}`}
              onClick={() => openEdit(item)}
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              aria-label={`Delete ${item.name}`}
              onClick={() => setDeleteTarget(item)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="text-muted-foreground py-4 text-center text-sm">
            None yet — click Add.
          </li>
        ) : null}
      </ul>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Edit ${KIND_LABEL[kind].singular}` : `Add ${KIND_LABEL[kind].singular}`}
            </DialogTitle>
          </DialogHeader>
          <EntityForm
            kind={kind}
            data={data}
            existing={editing}
            onDone={() => setDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {deleteTarget ? (
        <DeleteConfirm
          open={Boolean(deleteTarget)}
          onOpenChange={(o) => !o && setDeleteTarget(null)}
          kind={kind}
          id={deleteTarget.id}
          name={deleteTarget.name}
          dependentCount={dependentCount(deleteTarget.id)}
        />
      ) : null}
    </section>
  );
}
