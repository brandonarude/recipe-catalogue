"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatQuantity, toTitleCase } from "@/lib/utils";

interface RecipeIngredient {
  id: string;
  ingredientId: string;
  quantity: number | null;
  unit: string | null;
  preparation: string | null;
  ingredient: { id: string; name: string; category: string };
}

interface IngredientsResponse {
  servings: number;
  ingredients: RecipeIngredient[];
}

interface IngredientSelectorContentProps {
  recipeId: string;
  recipeTitle: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function IngredientSelectorContent({
  recipeId,
  recipeTitle,
  onComplete,
  onCancel,
}: IngredientSelectorContentProps) {
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [baseServings, setBaseServings] = useState<number | null>(null);
  const [servings, setServings] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/recipes/${recipeId}/ingredients`)
      .then((r) => r.json())
      .then((data: IngredientsResponse) => {
        setIngredients(data.ingredients);
        setSelected(new Set(data.ingredients.map((i) => i.id)));
        setBaseServings(data.servings);
        setServings(data.servings);
      })
      .catch(() => toast.error("Failed to load ingredients"))
      .finally(() => setLoading(false));
  }, [recipeId]);

  function toggleAll() {
    if (selected.size === ingredients.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(ingredients.map((i) => i.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit() {
    const selectedIngredients = ingredients
      .filter((i) => selected.has(i.id))
      .map((i) => ({
        ingredientId: i.ingredientId,
        quantity: i.quantity != null ? i.quantity * scale : null,
        unit: i.unit,
      }));

    if (selectedIngredients.length === 0) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, ingredients: selectedIngredients }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Added ingredients from ${recipeTitle} to shopping list`);
      onComplete();
    } catch {
      toast.error("Failed to add ingredients");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="py-8 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (ingredients.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This recipe has no ingredients.
        </p>
        <Button variant="outline" onClick={onCancel} className="w-full">
          Close
        </Button>
      </div>
    );
  }

  const allSelected = selected.size === ingredients.length;
  const scale =
    baseServings && servings && baseServings > 0 ? servings / baseServings : 1;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Select ingredients from <strong>{recipeTitle}</strong> to add to your
        shopping list.
      </p>

      {baseServings != null && servings != null && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">Servings:</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setServings(Math.max(1, servings - 1))}
              disabled={servings <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-semibold">{servings}</span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setServings(servings + 1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {servings !== baseServings && (
            <button
              className="text-xs text-primary hover:underline"
              onClick={() => setServings(baseServings)}
            >
              Reset
            </button>
          )}
        </div>
      )}

      <label className="flex items-center gap-3 rounded-md px-3 py-3 md:py-2 hover:bg-accent cursor-pointer">
        <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
        <span className="text-base md:text-sm font-medium">
          {allSelected ? "Deselect All" : "Select All"}
        </span>
      </label>

      <Separator />

      <div className="max-h-[40vh] space-y-1 overflow-y-auto">
        {ingredients.map((ing) => {
          const scaledQty = ing.quantity != null ? ing.quantity * scale : null;
          return (
            <label
              key={ing.id}
              className="flex items-center gap-3 rounded-md px-3 py-3 md:py-1.5 hover:bg-accent cursor-pointer"
            >
              <Checkbox
                checked={selected.has(ing.id)}
                onCheckedChange={() => toggleOne(ing.id)}
              />
              <span className="text-base md:text-sm">
                {scaledQty != null && <strong>{formatQuantity(scaledQty)}</strong>}
                {ing.unit && ` ${ing.unit}`}{" "}
                {toTitleCase(ing.ingredient.name)}
                {ing.preparation && (
                  <span className="text-muted-foreground">
                    , {ing.preparation}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={selected.size === 0 || submitting}
          className="flex-1"
        >
          {submitting
            ? "Adding..."
            : `Add ${selected.size} Ingredient${selected.size !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </div>
  );
}

interface IngredientSelectorDialogProps {
  recipeId: string;
  recipeTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function IngredientSelectorDialog({
  recipeId,
  recipeTitle,
  open,
  onOpenChange,
  onComplete,
}: IngredientSelectorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to Shopping List</DialogTitle>
        </DialogHeader>
        <IngredientSelectorContent
          recipeId={recipeId}
          recipeTitle={recipeTitle}
          onComplete={() => {
            onOpenChange(false);
            onComplete();
          }}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
