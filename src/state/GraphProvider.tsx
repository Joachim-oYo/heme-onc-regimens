"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { GraphData } from "@/lib/types";
import { buildIndex, type GraphIndex } from "@/lib/graph";

/**
 * Provides the raw graph data and the derived index to the client tree. The
 * data is loaded on the server and passed in; the index is memoized so it is
 * rebuilt only when the data reference changes (e.g. after an edit +
 * router.refresh()).
 */
interface GraphContextValue {
  data: GraphData;
  index: GraphIndex;
}

const GraphContext = createContext<GraphContextValue | null>(null);

export function GraphProvider({
  data,
  children,
}: {
  data: GraphData;
  children: ReactNode;
}) {
  const value = useMemo<GraphContextValue>(
    () => ({ data, index: buildIndex(data) }),
    [data],
  );
  return <GraphContext.Provider value={value}>{children}</GraphContext.Provider>;
}

export function useGraph(): GraphContextValue {
  const ctx = useContext(GraphContext);
  if (!ctx) throw new Error("useGraph must be used within a GraphProvider");
  return ctx;
}
