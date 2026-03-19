"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2, Merge } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MergeDialog } from "./merge-dialog";
import type { IngredientItem } from "./ingredient-list";

interface IngredientActionsProps {
  ingredient: IngredientItem;
  onRefresh: () => void;
}

export function IngredientActions({
  ingredient,
  onRefresh,
}: IngredientActionsProps) {
  const [loading, setLoading] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);

  const inUse = ingredient._count.recipes > 0;

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/ingredients/${ingredient.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Ingredient deleted");
      onRefresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete ingredient"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setMergeOpen(true)}
        disabled={loading}
        title="Merge into another ingredient"
      >
        <Merge className="h-4 w-4" />
      </Button>

      <AlertDialog>
        <AlertDialogTrigger>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={loading || inUse}
            title={inUse ? `Used in ${ingredient._count.recipes} recipe(s)` : "Delete ingredient"}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ingredient?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &ldquo;{ingredient.name}&rdquo;. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MergeDialog
        source={ingredient}
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        onMerged={onRefresh}
      />
    </div>
  );
}
