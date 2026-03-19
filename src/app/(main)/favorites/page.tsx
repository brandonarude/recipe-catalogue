"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RecipeGrid } from "@/components/recipes/recipe-grid";

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

export default function FavoritesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      const res = await fetch(`/api/favorites?${params}`);
      if (res.ok) {
        const data = await res.json();
        setRecipes(data.recipes);
        setTotalPages(data.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return (
    <div>
      <h1 className="text-2xl font-bold">My Favorites</h1>
      <div className="mt-4">
        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Loading...</p>
        ) : (
          <RecipeGrid recipes={recipes} />
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
