"use client";

import { RecipeCard } from "./recipe-card";

interface Recipe {
  id: string;
  title: string;
  description: string | null;
  cookTime: number | null;
  photos: { url: string }[];
  tags: { tag: { id: string; name: string } }[];
  avgRating: number | null;
  _count: { ratings: number };
}

interface RecipeGridProps {
  recipes: Recipe[];
}

export function RecipeGrid({ recipes }: RecipeGridProps) {
  if (recipes.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No recipes found.
      </p>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}
