"use client";
import { useNodeInteraction } from "@/state/useNodeInteraction";
import type { EntityKind } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * A single interactive entity in a column (disease / regimen / drug). Renders a
 * native <button> so hover, focus, click, and keyboard activation all work.
 * `itemProps` carries roving-tabindex wiring from the parent column.
 */
export function EntityChip({
  kind,
  id,
  name,
  sublabel,
  className,
  itemProps,
}: {
  kind: EntityKind;
  id: string;
  name: string;
  sublabel?: string;
  className?: string;
  itemProps?: React.HTMLAttributes<HTMLButtonElement> & {
    tabIndex?: number;
    "data-roving-item"?: boolean;
  };
}) {
  const { props } = useNodeInteraction(kind, id);
  const { onFocus: rovingOnFocus, ...restItemProps } = itemProps ?? {};
  return (
    <button
      type="button"
      className={cn("entity-node w-full", className)}
      {...props}
      {...restItemProps}
      onFocus={(e) => {
        props.onFocus();
        rovingOnFocus?.(e);
      }}
    >
      <span className="block truncate">{name}</span>
      {sublabel ? (
        <span className="text-muted-foreground block truncate text-xs">{sublabel}</span>
      ) : null}
    </button>
  );
}
