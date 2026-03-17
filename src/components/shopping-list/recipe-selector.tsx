"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Recipe {
  id: string;
  title: string;
}

interface RecipeSelectorProps {
  onGenerate: () => void;
}

function DialogComponent({ children, ...props }: React.ComponentProps<typeof Dialog>) {
  return <Dialog {...props}>{children}</Dialog>;
}

export function RecipeSelector({ onGenerate }: RecipeSelectorProps) {
  const [open, setOpen] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      fetch("/api/recipes?limit=100")
        .then((r) => r.json())
        .then((data) => setRecipes(data.recipes))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [open]);

  function toggleRecipe(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleGenerate() {
    if (selected.size === 0) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds: Array.from(selected) }),
      });
      if (!res.ok) throw new Error();
      toast.success("Shopping list generated!");
      setOpen(false);
      onGenerate();
    } catch {
      toast.error("Failed to generate shopping list");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <DialogComponent open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button>Generate Shopping List</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Recipes</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {recipes.map((recipe) => (
              <label
                key={recipe.id}
                className="flex items-center gap-3 rounded-md p-2 hover:bg-accent cursor-pointer"
              >
                <Checkbox
                  checked={selected.has(recipe.id)}
                  onCheckedChange={() => toggleRecipe(recipe.id)}
                />
                <span className="text-sm">{recipe.title}</span>
              </label>
            ))}
            {recipes.length === 0 && (
              <p className="text-sm text-muted-foreground">No recipes found.</p>
            )}
          </div>
        )}
        <Button
          onClick={handleGenerate}
          disabled={selected.size === 0 || generating}
          className="mt-4"
        >
          {generating ? "Generating..." : `Generate (${selected.size} recipes)`}
        </Button>
      </DialogContent>
    </DialogComponent>
  );
}
