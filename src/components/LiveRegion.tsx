"use client";
import { useHighlights } from "@/state/useHighlights";
import { KIND_LABEL } from "@/lib/constants";

/**
 * Visually-hidden live region that announces what the current selection
 * highlights, so screen-reader users get the same cross-highlight feedback
 * sighted users get visually.
 */
export function LiveRegion() {
  const { set } = useHighlights();

  let message = "";
  if (set) {
    const src = KIND_LABEL[set.source.kind].singular.toLowerCase();
    const parts: string[] = [];
    if (set.diseases.size) parts.push(`${set.diseases.size} diseases`);
    if (set.regimens.size) parts.push(`${set.regimens.size} regimens`);
    if (set.drugs.size) parts.push(`${set.drugs.size} drugs`);
    if (set.cells.size && set.source.kind !== "cell")
      parts.unshift(`${set.cells.size} cells`);
    message = parts.length
      ? `Selected ${src}. Highlighting ${parts.join(", ")}.`
      : `Selected ${src}. No related entities.`;
  }

  return (
    <div aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}
