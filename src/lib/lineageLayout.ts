import type { Cell } from "./types";

/**
 * Deterministic layout for the cell lineage forest. Produces a left-to-right
 * tree: x is driven by depth (distance from a root), y by a leaf-packing pass
 * so siblings stack and parents center over their children. This is the single
 * place layout math lives — swap it out to change the diagram's shape.
 */

export interface PositionedNode {
  cell: Cell;
  depth: number;
  x: number;
  y: number;
}

export interface LineageEdge {
  fromId: string;
  toId: string;
}

export interface LineageLayout {
  nodes: PositionedNode[];
  edges: LineageEdge[];
  width: number;
  height: number;
  columns: number;
  rows: number;
}

const COL_WIDTH = 190;
const ROW_HEIGHT = 64;
const PADDING = 24;

export function layoutLineage(cells: Cell[]): LineageLayout {
  const byId = new Map(cells.map((c) => [c.id, c]));
  const childrenOf = new Map<string, Cell[]>();
  for (const c of cells) {
    const key = c.parentId && byId.has(c.parentId) ? c.parentId : "__root__";
    const list = childrenOf.get(key);
    if (list) list.push(c);
    else childrenOf.set(key, [c]);
  }
  // Stable sibling order by `order` then name.
  for (const list of childrenOf.values()) {
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
  }

  const positions = new Map<string, { depth: number; row: number }>();
  let nextRow = 0;

  // Assign a row to each leaf, then center parents over their children's rows.
  function assign(cell: Cell, depth: number): number {
    const kids = childrenOf.get(cell.id) ?? [];
    let row: number;
    if (kids.length === 0) {
      row = nextRow++;
    } else {
      const kidRows = kids.map((k) => assign(k, depth + 1));
      row = (Math.min(...kidRows) + Math.max(...kidRows)) / 2;
    }
    positions.set(cell.id, { depth, row });
    return row;
  }

  for (const root of childrenOf.get("__root__") ?? []) {
    assign(root, 0);
  }

  const nodes: PositionedNode[] = [];
  let maxDepth = 0;
  let maxRow = 0;
  for (const cell of cells) {
    const pos = positions.get(cell.id);
    if (!pos) continue; // orphaned (shouldn't happen after root fallback)
    maxDepth = Math.max(maxDepth, pos.depth);
    maxRow = Math.max(maxRow, pos.row);
    nodes.push({
      cell,
      depth: pos.depth,
      x: PADDING + pos.depth * COL_WIDTH,
      y: PADDING + pos.row * ROW_HEIGHT,
    });
  }

  const edges: LineageEdge[] = [];
  for (const c of cells) {
    if (c.parentId && byId.has(c.parentId) && positions.has(c.id)) {
      edges.push({ fromId: c.parentId, toId: c.id });
    }
  }

  return {
    nodes,
    edges,
    columns: maxDepth + 1,
    rows: Math.ceil(maxRow) + 1,
    width: PADDING * 2 + maxDepth * COL_WIDTH + COL_WIDTH,
    height: PADDING * 2 + Math.ceil(maxRow) * ROW_HEIGHT + ROW_HEIGHT,
  };
}

export const LINEAGE_LAYOUT_CONSTANTS = { COL_WIDTH, ROW_HEIGHT, PADDING };
