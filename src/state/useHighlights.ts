"use client";
import { useMemo } from "react";
import { useGraph } from "./GraphProvider";
import { useEffectiveSelection } from "./useSelectionStore";
import {
  computeHighlights,
  computeLineagePath,
  isInHighlight,
  type HighlightSet,
} from "@/lib/graph";
import type { EntityKind } from "@/lib/types";

export interface Highlights {
  /** The current highlight set, or null when nothing is selected. */
  set: HighlightSet | null;
  /** Lineage ancestors/descendants of the selected cell (secondary tint). */
  lineagePath: Set<string>;
  /** Is any selection active right now? */
  active: boolean;
  isHighlighted: (kind: EntityKind, id: string) => boolean;
  isSource: (kind: EntityKind, id: string) => boolean;
  isLineage: (id: string) => boolean;
}

/**
 * Derives the highlight set from the effective selection + graph index. This
 * is the single place highlight logic is consumed by the UI. Components should
 * call it once high in the tree and pass `isHighlighted`/`isSource` down, or
 * read it directly — it is cheap and memoized.
 */
export function useHighlights(): Highlights {
  const { index } = useGraph();
  const selection = useEffectiveSelection();

  return useMemo<Highlights>(() => {
    const set = selection ? computeHighlights(index, selection) : null;
    const lineagePath =
      selection?.kind === "cell"
        ? computeLineagePath(index, selection.id)
        : new Set<string>();

    return {
      set,
      lineagePath,
      active: set !== null,
      isHighlighted: (kind, id) => isInHighlight(set, kind, id),
      isSource: (kind, id) => set?.source.kind === kind && set.source.id === id,
      isLineage: (id) => lineagePath.has(id),
    };
  }, [index, selection]);
}
