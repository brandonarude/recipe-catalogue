"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useDebounce } from "@/hooks/use-debounce";
import { toTitleCase } from "@/lib/utils";

interface SearchFiltersProps {
  allTags: { id: string; name: string }[];
  allDietaryTags: { id: string; name: string }[];
}

export function SearchFilters({ allTags, allDietaryTags }: SearchFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.getAll("tag")
  );
  const [selectedDietaryTags, setSelectedDietaryTags] = useState<string[]>(
    searchParams.getAll("dietaryTag")
  );
  const [maxCookTime, setMaxCookTime] = useState(
    searchParams.get("maxCookTime") || ""
  );
  const [favoritesOnly, setFavoritesOnly] = useState(
    searchParams.get("favoritesOnly") === "true"
  );
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");

  const debouncedQuery = useDebounce(query, 400);

  const updateUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    selectedTags.forEach((t) => params.append("tag", t));
    selectedDietaryTags.forEach((t) => params.append("dietaryTag", t));
    if (maxCookTime) params.set("maxCookTime", maxCookTime);
    if (favoritesOnly) params.set("favoritesOnly", "true");
    if (sort !== "newest") params.set("sort", sort);
    router.push(`/?${params.toString()}`);
  }, [debouncedQuery, selectedTags, selectedDietaryTags, maxCookTime, favoritesOnly, sort, router]);

  useEffect(() => {
    updateUrl();
  }, [updateUrl]);

  function toggleTag(tagName: string) {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  }

  function toggleDietaryTag(tagName: string) {
    setSelectedDietaryTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    );
  }

  function clearFilters() {
    setQuery("");
    setSelectedTags([]);
    setSelectedDietaryTags([]);
    setMaxCookTime("");
    setFavoritesOnly(false);
    setSort("newest");
  }

  const hasFilters =
    query ||
    selectedTags.length > 0 ||
    selectedDietaryTags.length > 0 ||
    maxCookTime ||
    favoritesOnly;

  return (
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

        <Sheet>
          <SheetTrigger>
            <Button variant="outline" size="icon" className="relative">
              <SlidersHorizontal className="h-4 w-4" />
              {hasFilters && (
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-primary" />
              )}
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Filters</SheetTitle>
            <div className="mt-6 space-y-6">
              {/* Sort */}
              <div className="space-y-2">
                <Label>Sort by</Label>
                <Select value={sort} onValueChange={(v) => v && setSort(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="rating">Highest Rated</SelectItem>
                    <SelectItem value="cookTime">Cook Time</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Max cook time */}
              <div className="space-y-2">
                <Label>Max Cook Time (min)</Label>
                <Input
                  type="number"
                  placeholder="e.g. 30"
                  value={maxCookTime}
                  onChange={(e) => setMaxCookTime(e.target.value)}
                />
              </div>

              {/* Favorites only */}
              <div className="flex items-center gap-2">
                <Switch
                  checked={favoritesOnly}
                  onCheckedChange={setFavoritesOnly}
                />
                <Label>Favorites only</Label>
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {allTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={
                          selectedTags.includes(tag.name)
                            ? "default"
                            : "secondary"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleTag(tag.name)}
                      >
                        {toTitleCase(tag.name)}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Dietary Tags */}
              {allDietaryTags.length > 0 && (
                <div className="space-y-2">
                  <Label>Dietary</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {allDietaryTags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={
                          selectedDietaryTags.includes(tag.name)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer"
                        onClick={() => toggleDietaryTag(tag.name)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear */}
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Clear all filters
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1.5">
          {selectedTags.map((t) => (
            <Badge
              key={t}
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => toggleTag(t)}
            >
              {toTitleCase(t)} <X className="h-3 w-3" />
            </Badge>
          ))}
          {selectedDietaryTags.map((t) => (
            <Badge
              key={t}
              variant="outline"
              className="gap-1 cursor-pointer"
              onClick={() => toggleDietaryTag(t)}
            >
              {t} <X className="h-3 w-3" />
            </Badge>
          ))}
          {maxCookTime && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setMaxCookTime("")}>
              &le;{maxCookTime}m <X className="h-3 w-3" />
            </Badge>
          )}
          {favoritesOnly && (
            <Badge variant="secondary" className="gap-1 cursor-pointer" onClick={() => setFavoritesOnly(false)}>
              Favorites <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
