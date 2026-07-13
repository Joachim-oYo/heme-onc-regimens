"use client";
import { useNodeInteraction } from "@/state/useNodeInteraction";
import type { PositionedNode } from "@/lib/lineageLayout";
import { LINEAGE_LAYOUT_CONSTANTS } from "@/lib/lineageLayout";

const { COL_WIDTH, ROW_HEIGHT } = LINEAGE_LAYOUT_CONSTANTS;
const NODE_W = COL_WIDTH - 24;
const NODE_H = ROW_HEIGHT - 16;

/**
 * A single cell in the lineage diagram, absolutely positioned over the SVG
 * connectors. It is a real <button> for full keyboard/pointer accessibility.
 */
export function CellNode({ node }: { node: PositionedNode }) {
  const { cell } = node;
  const { props } = useNodeInteraction("cell", cell.id);
  return (
    <button
      type="button"
      className="entity-node absolute flex items-center justify-center text-center text-xs leading-tight"
      style={{
        left: node.x,
        top: node.y,
        width: NODE_W,
        height: NODE_H,
        ...props.style,
      }}
      data-highlighted={props["data-highlighted"]}
      data-source={props["data-source"]}
      data-dimmed={props["data-dimmed"]}
      data-lineage={props["data-lineage"]}
      aria-pressed={props["aria-pressed"]}
      onPointerEnter={props.onPointerEnter}
      onPointerLeave={props.onPointerLeave}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      onClick={props.onClick}
    >
      <span className="line-clamp-2">{cell.name}</span>
    </button>
  );
}

export const CELL_NODE_SIZE = { width: NODE_W, height: NODE_H };
