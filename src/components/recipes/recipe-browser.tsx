"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SearchFilters } from "./search-filters";
import { RecipeGrid } from "./recipe-grid";
import { Button } from "@/components/ui/button";

interface RecipeBrowserProps {
  allTags: { id: string; name: string }[];
  allDietaryTags: { id: string; name: string }[];
}

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

export function RecipeBrowser({ allTags, allDietaryTags }: RecipeBrowserProps) {
  const searchParams = useSearchParams();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());

    fetch(`/api/recipes?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setRecipes(data.recipes);
        setTotalPages(data.totalPages);
      })
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false));
  }, [searchParams, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchParams]);

  return (
    <div className="space-y-4">
      <SearchFilters allTags={allTags} allDietaryTags={allDietaryTags} />

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      ) : (
        <>
          <RecipeGrid recipes={recipes} />
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
