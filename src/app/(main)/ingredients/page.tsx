"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useDebounce } from "@/hooks/use-debounce";
import {
  IngredientList,
  type IngredientItem,
} from "@/components/ingredients/ingredient-list";

const CATEGORIES = [
  "PRODUCE",
  "DAIRY",
  "MEAT",
  "SEAFOOD",
  "BAKERY",
  "PANTRY",
  "FROZEN",
  "BEVERAGES",
  "CONDIMENTS",
  "SPICES",
  "OTHER",
] as const;

export default function IngredientsPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [ingredients, setIngredients] = useState<IngredientItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const debouncedSearch = useDebounce(search, 300);

  const fetchIngredients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "50" });
      if (debouncedSearch) params.set("q", debouncedSearch);
      if (category) params.set("category", category);

      const res = await fetch(`/api/ingredients?${params}`);
      if (res.ok) {
        const data = await res.json();
        setIngredients(data.ingredients);
        setTotalPages(data.totalPages);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, page]);

  useEffect(() => {
    fetchIngredients();
  }, [fetchIngredients]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Ingredients</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Browse all ingredients and see which recipes use them.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          placeholder="Search ingredients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        {loading ? (
          <p className="py-12 text-center text-muted-foreground">Loading...</p>
        ) : (
          <IngredientList
            ingredients={ingredients}
            isAdmin={isAdmin}
            onRefresh={fetchIngredients}
          />
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
