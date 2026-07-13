"use client";
import { EntityChip } from "./EntityChip";
import { useHighlights } from "@/state/useHighlights";
import { useRovingFocus } from "@/state/useRovingFocus";
import { KIND_LABEL, type EntityKind } from "@/lib/constants";

export interface ColumnItem {
  id: string;
  name: string;
  sublabel?: string;
}

/**
 * A generic labeled column of entity chips, reused for diseases, regimens, and
 * drugs. Arrow keys move focus between chips (roving tabindex, toolbar
 * semantics). Shows a live count of how many items the current selection
 * highlights.
 */
export function EntityColumn({
  kind,
  items,
}: {
  kind: EntityKind;
  items: ColumnItem[];
}) {
  const { active, isHighlighted } = useHighlights();
  const { containerProps, getItemProps } = useRovingFocus(items.length, "vertical");
  const highlightedCount = active
    ? items.filter((i) => isHighlighted(kind, i.id)).length
    : 0;

  return (
    <section
      className="flex min-h-0 flex-col"
      style={{ "--node-accent": `var(--tier-${kind})` } as React.CSSProperties}
    >
      <header className="mb-2 flex items-baseline justify-between gap-2">
        <h2 id={`col-${kind}`} className="text-sm font-semibold tracking-wide uppercase">
          {KIND_LABEL[kind].plural}
        </h2>
        <span className="text-muted-foreground text-xs tabular-nums" aria-hidden="true">
          {active ? `${highlightedCount}/${items.length}` : items.length}
        </span>
      </header>
      {items.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-sm">
          No {KIND_LABEL[kind].plural.toLowerCase()} yet
        </p>
      ) : (
        <div
          {...containerProps}
          aria-labelledby={`col-${kind}`}
          className="flex min-h-0 flex-col gap-1.5 overflow-y-auto pr-1"
        >
          {items.map((item, i) => (
            <EntityChip
              key={item.id}
              kind={kind}
              id={item.id}
              name={item.name}
              sublabel={item.sublabel}
              itemProps={getItemProps(i)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
