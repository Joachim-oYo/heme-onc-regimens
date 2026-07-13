"use client";
import { create } from "zustand";
import type { Selection } from "@/lib/types";

/**
 * Selection state. `hovered` is transient (pointer / keyboard focus previews);
 * `pinned` is sticky (set by click / tap). The effective selection the UI
 * highlights is `hovered ?? pinned`, giving the bugdrugdx "hover to explore,
 * click to lock" feel that also works on touch (tap = pin).
 */
interface SelectionState {
  hovered: Selection | null;
  pinned: Selection | null;
  setHovered: (sel: Selection | null) => void;
  togglePinned: (sel: Selection) => void;
  clear: () => void;
}

function sameSelection(a: Selection | null, b: Selection | null): boolean {
  return a?.kind === b?.kind && a?.id === b?.id;
}

export const useSelectionStore = create<SelectionState>((set) => ({
  hovered: null,
  pinned: null,
  setHovered: (sel) => set({ hovered: sel }),
  togglePinned: (sel) =>
    set((state) => ({
      pinned: sameSelection(state.pinned, sel) ? null : sel,
    })),
  clear: () => set({ hovered: null, pinned: null }),
}));

/** The selection currently driving highlights. */
export function useEffectiveSelection(): Selection | null {
  return useSelectionStore((s) => s.hovered ?? s.pinned);
}
