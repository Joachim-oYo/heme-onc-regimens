"use client";
import { useCallback, useRef } from "react";

/**
 * Roving-tabindex arrow-key navigation for a group of buttons (a column or the
 * diagram). Only one element in the group is in the tab order at a time; arrow
 * keys move focus between them, Home/End jump to the ends. The container gets
 * `role="toolbar"` semantics (a group of toggle buttons) with the given
 * orientation.
 *
 * Usage: spread `containerProps` on the wrapper and register each item with
 * `getItemProps(index)`.
 */
export function useRovingFocus(
  count: number,
  orientation: "vertical" | "horizontal" = "vertical",
) {
  const activeRef = useRef(0);
  const containerRef = useRef<HTMLElement | null>(null);

  const focusItem = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(count - 1, index));
    activeRef.current = clamped;
    const el = containerRef.current?.querySelectorAll<HTMLElement>(
      "[data-roving-item]",
    )[clamped];
    el?.focus();
  }, [count]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const nextKey = orientation === "vertical" ? "ArrowDown" : "ArrowRight";
      const prevKey = orientation === "vertical" ? "ArrowUp" : "ArrowLeft";
      if (e.key === nextKey) {
        e.preventDefault();
        focusItem(activeRef.current + 1);
      } else if (e.key === prevKey) {
        e.preventDefault();
        focusItem(activeRef.current - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        focusItem(0);
      } else if (e.key === "End") {
        e.preventDefault();
        focusItem(count - 1);
      }
    },
    [orientation, count, focusItem],
  );

  const getItemProps = useCallback(
    (index: number) => ({
      "data-roving-item": true,
      tabIndex: index === activeRef.current ? 0 : -1,
      onFocus: () => {
        activeRef.current = index;
      },
    }),
    [],
  );

  return {
    containerProps: {
      ref: (el: HTMLElement | null) => {
        containerRef.current = el;
      },
      role: "toolbar" as const,
      "aria-orientation": orientation,
      onKeyDown,
    },
    getItemProps,
  };
}
