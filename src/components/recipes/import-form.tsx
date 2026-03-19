"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RecipeCreateInput } from "@/lib/validators/recipe";

interface ImportFormProps {
  onImported: (data: Partial<RecipeCreateInput>, scrapedIngredientNames: string[]) => void;
}

export function ImportForm({ onImported }: ImportFormProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      const res = await fetch("/api/recipes/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to import recipe");
        if (data.sourceUrl) {
          onImported({ sourceUrl: data.sourceUrl }, []);
        }
        return;
      }

      // Extract scraped ingredient names and transform to new shape
      const scrapedNames: string[] = (data.ingredients || []).map(
        (ing: { name?: string }) => ing.name || ""
      );

      const ingredients = (data.ingredients || []).map(
        (ing: { quantity?: number; unit?: string; preparation?: string }) => ({
          ingredientId: "",
          ingredientName: "",
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          preparation: ing.preparation ?? null,
        })
      );

      toast.success("Recipe imported! Review and save below.");
      onImported(
        {
          title: data.title,
          description: data.description,
          steps: data.steps,
          prepTime: data.prepTime,
          cookTime: data.cookTime,
          servings: data.servings,
          ingredients,
          sourceUrl: data.sourceUrl,
        },
        scrapedNames
      );
    } catch {
      toast.error("Failed to import recipe");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleImport} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="url">Recipe URL</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="url"
              type="url"
              placeholder="https://www.allrecipes.com/recipe/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="pl-9"
              required
            />
          </div>
          <Button type="submit" disabled={loading || !url}>
            {loading ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </div>
      </div>
      <p className="text-sm md:text-xs text-muted-foreground">
        Paste a recipe URL to auto-fill the form. Works best with sites that use
        structured recipe data (schema.org).
      </p>
    </form>
  );
}
