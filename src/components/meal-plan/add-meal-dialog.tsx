"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Search, Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IngredientSelectorContent } from "@/components/shopping-list/ingredient-selector";
import { useDebounce } from "@/hooks/use-debounce";

interface Recipe {
  id: string;
  title: string;
}

type Step = "search" | "prompt" | "ingredients";

interface AddMealDialogProps {
  date: string;
  mealType: string;
  onAdded: () => void;
}

export function AddMealDialog({ date, mealType, onAdded }: AddMealDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("search");
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [courseType, setCourseType] = useState<string>("MAIN");
  const [adding, setAdding] = useState(false);
  const [addedRecipe, setAddedRecipe] = useState<Recipe | null>(null);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!open || step !== "search") return;
    setLoading(true);
    const params = new URLSearchParams({ limit: "20" });
    if (debouncedQuery) params.set("q", debouncedQuery);
    fetch(`/api/recipes?${params}`)
      .then((r) => r.json())
      .then((data) => setRecipes(data.recipes))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, step, debouncedQuery]);

  function resetAndClose() {
    setOpen(false);
    setStep("search");
    setAddedRecipe(null);
    setQuery("");
  }

  async function addMeal(recipe: Recipe) {
    setAdding(true);
    try {
      const res = await fetch("/api/meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: recipe.id, date, mealType, courseType }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add meal");
      }
      toast.success("Added to meal plan");
      onAdded();
      setAddedRecipe(recipe);
      setStep("prompt");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add meal");
    } finally {
      setAdding(false);
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      resetAndClose();
    } else {
      setOpen(true);
    }
  }

  const dialogTitle =
    step === "search"
      ? "Add Recipe"
      : step === "prompt"
        ? "Add to Shopping List?"
        : "Add to Shopping List";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger>
        <button className="flex w-full items-center justify-center gap-1 rounded border border-dashed py-1 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Plus className="h-3 w-3" />
          Add
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>

        {step === "search" && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search recipes..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={courseType} onValueChange={(v) => v && setCourseType(v)}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MAIN">Main</SelectItem>
                  <SelectItem value="SIDE">Side</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="py-8 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-1">
                {recipes.map((recipe) => (
                  <button
                    key={recipe.id}
                    className="flex w-full items-center justify-between rounded-md p-2 text-sm hover:bg-accent disabled:opacity-50"
                    onClick={() => addMeal(recipe)}
                    disabled={adding}
                  >
                    <span className="text-left">{recipe.title}</span>
                    <Plus className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                ))}
                {recipes.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">
                    No recipes found.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {step === "prompt" && addedRecipe && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <ShoppingCart className="h-5 w-5 shrink-0 text-muted-foreground" />
              <p className="text-sm">
                Add ingredients from <strong>{addedRecipe.title}</strong> to your
                shopping list?
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={resetAndClose}
                className="flex-1"
              >
                No, thanks
              </Button>
              <Button
                onClick={() => setStep("ingredients")}
                className="flex-1"
              >
                Yes
              </Button>
            </div>
          </div>
        )}

        {step === "ingredients" && addedRecipe && (
          <IngredientSelectorContent
            recipeId={addedRecipe.id}
            recipeTitle={addedRecipe.title}
            onComplete={resetAndClose}
            onCancel={resetAndClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
