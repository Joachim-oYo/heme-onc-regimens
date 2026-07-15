"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RelationshipMultiSelect, type Option } from "./RelationshipMultiSelect";
import { ToxicityInput } from "./ToxicityInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { KIND_LABEL, type EntityKind } from "@/lib/constants";
import type { GraphData, EntityByKind } from "@/lib/types";
import { createEntity, updateEntity } from "@/lib/apiClient";

/**
 * Generic create/edit form for any entity kind. Fields are driven by `kind`:
 * every kind has a name; drugs add mechanism + toxicities; cells add a tree
 * parent; disease/regimen/drug add an up-chain relationship
 * multi-select. Submits to the API and refreshes the router on success.
 */
export function EntityForm<K extends EntityKind>({
  kind,
  data,
  existing,
  onDone,
}: {
  kind: K;
  data: GraphData;
  existing?: EntityByKind[K];
  onDone: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Local field state (kept simple; validated server-side by Zod).
  const [name, setName] = useState(existing?.name ?? "");
  const [abbreviation, setAbbreviation] = useState(
    (existing as EntityByKind["disease"] | undefined)?.abbreviation ?? "",
  );
  const [mechanism, setMechanism] = useState(
    (existing as EntityByKind["drug"] | undefined)?.mechanism ?? "",
  );
  const [toxicities, setToxicities] = useState<string[]>(
    (existing as EntityByKind["drug"] | undefined)?.toxicities ?? [],
  );
  const [parentId, setParentId] = useState<string | null>(
    (existing as EntityByKind["cell"] | undefined)?.parentId ?? null,
  );
  const [relIds, setRelIds] = useState<string[]>(
    kind === "disease"
      ? ((existing as EntityByKind["disease"] | undefined)?.cellIds ?? [])
      : kind === "regimen"
        ? ((existing as EntityByKind["regimen"] | undefined)?.diseaseIds ?? [])
        : kind === "drug"
          ? ((existing as EntityByKind["drug"] | undefined)?.regimenIds ?? [])
          : [],
  );

  const relConfig: { label: string; options: Option[] } | null =
    kind === "disease"
      ? {
          label: "Arises from cells",
          options: data.cells.map((c) => ({ id: c.id, label: c.name })),
        }
      : kind === "regimen"
        ? {
            label: "Treats diseases",
            options: data.diseases.map((d) => ({ id: d.id, label: d.name })),
          }
        : kind === "drug"
          ? {
              label: "Part of regimens",
              options: data.regimens.map((r) => ({ id: r.id, label: r.name })),
            }
          : null;

  // Cell parent options exclude the cell itself.
  const parentOptions: Option[] = data.cells
    .filter((c) => c.id !== existing?.id)
    .map((c) => ({ id: c.id, label: c.name }));

  function buildInput() {
    switch (kind) {
      case "cell":
        return {
          name,
          parentId,
          order: (existing as EntityByKind["cell"] | undefined)?.order ?? null,
        };
      case "disease":
        return { name, abbreviation: abbreviation || null, cellIds: relIds };
      case "regimen":
        return { name, diseaseIds: relIds };
      case "drug":
        return { name, mechanism, toxicities, regimenIds: relIds };
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const input = buildInput();
    startTransition(async () => {
      try {
        if (existing) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await updateEntity(kind, existing.id, input as any);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await createEntity(kind, input as any);
        }
        router.refresh();
        onDone();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="ef-name">Name</Label>
        <Input
          id="ef-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />
      </div>

      {kind === "disease" ? (
        <div className="space-y-1.5">
          <Label htmlFor="ef-abbr">Abbreviation</Label>
          <Input
            id="ef-abbr"
            value={abbreviation}
            onChange={(e) => setAbbreviation(e.target.value)}
            placeholder="e.g. AML"
          />
        </div>
      ) : null}

      {kind === "cell" ? (
        <div className="space-y-1.5">
          <Label>Lineage parent</Label>
          <RelationshipMultiSelect
            options={parentOptions}
            value={parentId ? [parentId] : []}
            onChange={(ids) => setParentId(ids.length ? ids[ids.length - 1] : null)}
            placeholder="No parent (root)"
            emptyText="No other cells."
          />
        </div>
      ) : null}

      {kind === "drug" ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="ef-mech">Mechanism of action</Label>
            <Textarea
              id="ef-mech"
              value={mechanism}
              onChange={(e) => setMechanism(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Toxicities</Label>
            <ToxicityInput value={toxicities} onChange={setToxicities} />
          </div>
        </>
      ) : null}

      {relConfig ? (
        <div className="space-y-1.5">
          <Label>{relConfig.label}</Label>
          <RelationshipMultiSelect
            options={relConfig.options}
            value={relIds}
            onChange={setRelIds}
          />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || !name.trim()}>
          {pending ? "Saving…" : existing ? "Save changes" : `Add ${KIND_LABEL[kind].singular}`}
        </Button>
      </div>
    </form>
  );
}
