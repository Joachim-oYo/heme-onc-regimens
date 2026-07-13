"use client";
import { useMemo } from "react";
import { useGraph } from "@/state/GraphProvider";
import { useHighlights } from "@/state/useHighlights";
import { layoutLineage } from "@/lib/lineageLayout";
import { CellNode, CELL_NODE_SIZE } from "./CellNode";

/**
 * The hematopoietic cell-lineage flow diagram. SVG draws only the connectors;
 * cells are real <button>s (CellNode) positioned over it. The whole thing
 * scrolls horizontally on small screens.
 */
export function CellLineageDiagram() {
  const { data } = useGraph();
  const { isHighlighted } = useHighlights();

  const layout = useMemo(() => layoutLineage(data.cells), [data.cells]);
  const nodeById = useMemo(
    () => new Map(layout.nodes.map((n) => [n.cell.id, n])),
    [layout],
  );

  return (
    <div className="overflow-x-auto">
      <div
        className="relative"
        style={{ width: layout.width, height: layout.height, minWidth: "100%" }}
      >
        <svg
          className="pointer-events-none absolute inset-0"
          width={layout.width}
          height={layout.height}
          aria-hidden="true"
        >
          {layout.edges.map((edge) => {
            const from = nodeById.get(edge.fromId);
            const to = nodeById.get(edge.toId);
            if (!from || !to) return null;
            const x1 = from.x + CELL_NODE_SIZE.width;
            const y1 = from.y + CELL_NODE_SIZE.height / 2;
            const x2 = to.x;
            const y2 = to.y + CELL_NODE_SIZE.height / 2;
            const midX = (x1 + x2) / 2;
            // Both endpoints highlighted => the edge is part of the active path.
            const lit =
              isHighlighted("cell", edge.fromId) && isHighlighted("cell", edge.toId);
            return (
              <path
                key={`${edge.fromId}-${edge.toId}`}
                d={`M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`}
                fill="none"
                className={
                  lit ? "stroke-tier-cell" : "stroke-border"
                }
                strokeWidth={lit ? 2 : 1.5}
              />
            );
          })}
        </svg>
        {layout.nodes.map((node) => (
          <CellNode key={node.cell.id} node={node} />
        ))}
      </div>
    </div>
  );
}
