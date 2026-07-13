"use client";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useSelectionStore } from "@/state/useSelectionStore";
import { useEffectiveSelection } from "@/state/useSelectionStore";
import { Button, buttonVariants } from "@/components/ui/button";
import { X, Pencil } from "lucide-react";

/**
 * App chrome: title, a "clear selection" control, and a link to the editor.
 * Binds Escape to clear the current selection globally.
 */
export function AppShell({
  children,
  editHref = "/edit",
  showEditLink = true,
}: {
  children: ReactNode;
  editHref?: string;
  showEditLink?: boolean;
}) {
  const clear = useSelectionStore((s) => s.clear);
  const selection = useEffectiveSelection();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") clear();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clear]);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between gap-3 border-b px-4 py-2.5">
        <div className="flex items-baseline gap-2">
          <Link href="/" className="text-base font-semibold tracking-tight">
            Onc Regimens
          </Link>
          <span className="text-muted-foreground hidden text-xs sm:inline">
            hover / tap a cell, disease, regimen, or drug to trace the cascade
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={!selection}
            aria-label="Clear selection"
          >
            <X className="size-4" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
          {showEditLink ? (
            <Link
              href={editHref}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Pencil className="size-4" />
              <span className="hidden sm:inline">Edit</span>
            </Link>
          ) : null}
        </div>
      </header>
      {children}
    </div>
  );
}
