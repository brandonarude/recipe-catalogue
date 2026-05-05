"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IngredientCombobox } from "@/components/recipes/ingredient-combobox";

interface AddIngredientToListProps {
  onAdded: () => void;
}

const EMPTY_INGREDIENT = { ingredientId: "", ingredientName: "" };

export function AddIngredientToList({ onAdded }: AddIngredientToListProps) {
  const [open, setOpen] = useState(false);
  const [ingredient, setIngredient] = useState(EMPTY_INGREDIENT);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setIngredient(EMPTY_INGREDIENT);
    setQuantity("");
    setUnit("");
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  async function handleSubmit() {
    if (!ingredient.ingredientId) return;

    const parsedQty = quantity.trim() ? parseFloat(quantity) : null;
    if (parsedQty != null && Number.isNaN(parsedQty)) {
      toast.error("Quantity must be a number");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: [
            {
              ingredientId: ingredient.ingredientId,
              quantity: parsedQty,
              unit: unit.trim() || null,
            },
          ],
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Added ${ingredient.ingredientName} to shopping list`);
      handleOpenChange(false);
      onAdded();
    } catch {
      toast.error("Failed to add ingredient");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        <Button size="sm" variant="outline">
          <Plus className="mr-1 h-4 w-4" />
          Add Ingredient
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Ingredient</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Ingredient</Label>
            <IngredientCombobox
              value={ingredient}
              onChange={setIngredient}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 space-y-2">
              <Label htmlFor="add-ing-qty">Quantity</Label>
              <Input
                id="add-ing-qty"
                type="number"
                step="any"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Qty"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="add-ing-unit">Unit</Label>
              <Input
                id="add-ing-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. cup"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!ingredient.ingredientId || submitting}
          >
            {submitting ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
