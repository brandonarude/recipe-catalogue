"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IngredientSelectorDialog } from "./ingredient-selector";
import { useDebounce } from "@/hooks/use-debounce";

interface Recipe {
  id: string;
  title: string;
}

interface AddRecipeToListProps {
  onAdded: () => void;
}

export function AddRecipeToList({ onAdded }: AddRecipeToListProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [ingredientOpen, setIngredientOpen] = useState(false);

  useEffect(() => {
    if (!searchOpen) return;
    setLoading(true);
    const params = new URLSearchParams({ limit: "20" });
    if (debouncedQuery) params.set("q", debouncedQuery);
    fetch(`/api/recipes?${params}`)
      .then((r) => r.json())
      .then((data) => setRecipes(data.recipes))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [searchOpen, debouncedQuery]);

  function handleSelectRecipe(recipe: Recipe) {
    setSelectedRecipe(recipe);
    setSearchOpen(false);
    setIngredientOpen(true);
  }

  function handleIngredientComplete() {
    setSelectedRecipe(null);
    setQuery("");
    onAdded();
  }

  function handleIngredientOpenChange(open: boolean) {
    setIngredientOpen(open);
    if (!open) {
      setSelectedRecipe(null);
    }
  }

  return (
    <>
      <Dialog
        open={searchOpen}
        onOpenChange={(open) => {
          setSearchOpen(open);
          if (!open) setQuery("");
        }}
      >
        <DialogTrigger>
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add Recipe
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Search Recipes</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search recipes..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
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
                  className="flex w-full items-center justify-between rounded-md p-2 text-sm hover:bg-accent"
                  onClick={() => handleSelectRecipe(recipe)}
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
        </DialogContent>
      </Dialog>

      {selectedRecipe && (
        <IngredientSelectorDialog
          recipeId={selectedRecipe.id}
          recipeTitle={selectedRecipe.title}
          open={ingredientOpen}
          onOpenChange={handleIngredientOpenChange}
          onComplete={handleIngredientComplete}
        />
      )}
    </>
  );
}
