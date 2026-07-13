"use client";
import { useCallback } from "react";
import { useSelectionStore } from "./useSelectionStore";
import { useHighlights } from "./useHighlights";
import type { EntityKind } from "@/lib/types";

const TIER_ACCENT: Record<EntityKind, string> = {
  cell: "var(--tier-cell)",
  disease: "var(--tier-disease)",
  regimen: "var(--tier-regimen)",
  drug: "var(--tier-drug)",
};

export interface NodeInteraction {
  /** Props to spread onto the interactive element (a <button>). */
  props: {
    "data-highlighted": boolean;
    "data-source": boolean;
    "data-dimmed": boolean;
    "data-lineage": boolean;
    "aria-pressed": boolean;
    style: React.CSSProperties;
    onPointerEnter: () => void;
    onPointerLeave: () => void;
    onFocus: () => void;
    onBlur: () => void;
    onClick: () => void;
  };
  highlighted: boolean;
  source: boolean;
  dimmed: boolean;
}

/**
 * Shared interaction + visual-state logic for any entity node. Hover and focus
 * set the transient selection; click toggles the pinned selection. Returns
 * data-attributes the CSS in globals.css keys off of, plus the accent color.
 */
export function useNodeInteraction(kind: EntityKind, id: string): NodeInteraction {
  const setHovered = useSelectionStore((s) => s.setHovered);
  const togglePinned = useSelectionStore((s) => s.togglePinned);
  const pinned = useSelectionStore((s) => s.pinned);
  const { active, isHighlighted, isSource, isLineage } = useHighlights();

  const highlighted = isHighlighted(kind, id);
  const source = isSource(kind, id);
  const lineage = kind === "cell" && isLineage(id);
  const dimmed = active && !highlighted && !lineage;
  const isPinned = pinned?.kind === kind && pinned?.id === id;

  const onEnter = useCallback(() => setHovered({ kind, id }), [setHovered, kind, id]);
  const onLeave = useCallback(() => setHovered(null), [setHovered]);
  const onClick = useCallback(() => togglePinned({ kind, id }), [togglePinned, kind, id]);

  return {
    highlighted,
    source,
    dimmed,
    props: {
      "data-highlighted": highlighted,
      "data-source": source,
      "data-dimmed": dimmed,
      "data-lineage": lineage,
      "aria-pressed": isPinned,
      style: { "--node-accent": TIER_ACCENT[kind] } as React.CSSProperties,
      onPointerEnter: onEnter,
      onPointerLeave: onLeave,
      onFocus: onEnter,
      onBlur: onLeave,
      onClick,
    },
  };
}
