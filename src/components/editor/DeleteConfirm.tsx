"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteEntity } from "@/lib/apiClient";
import { KIND_LABEL, type EntityKind } from "@/lib/constants";

/**
 * Controlled delete-confirmation dialog. `dependentCount` is the number of
 * other entities that reference this one (computed by the caller from the
 * reverse index) so the user knows the blast radius.
 */
export function DeleteConfirm({
  open,
  onOpenChange,
  kind,
  id,
  name,
  dependentCount,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: EntityKind;
  id: string;
  name: string;
  dependentCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirm() {
    setError(null);
    startTransition(async () => {
      try {
        await deleteEntity(kind, id);
        router.refresh();
        onOpenChange(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete {KIND_LABEL[kind].singular.toLowerCase()} “{name}”?
          </AlertDialogTitle>
          <AlertDialogDescription>
            {dependentCount > 0
              ? `This will also remove it from ${dependentCount} related item${dependentCount === 1 ? "" : "s"}.`
              : "This cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p role="alert" className="text-destructive text-sm">
            {error}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={confirm} disabled={pending}>
            {pending ? "Deleting…" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
