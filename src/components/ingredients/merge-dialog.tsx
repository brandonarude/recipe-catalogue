"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { useDebounce } from "@/hooks/use-debounce";
import type { IngredientItem } from "./ingredient-list";

interface MergeDialogProps {
  source: IngredientItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMerged: () => void;
}

interface SearchResult {
  id: string;
  name: string;
  category: string;
}

export function MergeDialog({
  source,
  open,
  onOpenChange,
  onMerged,
}: MergeDialogProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [target, setTarget] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setResults([]);
      setTarget(null);
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 1) {
      setResults([]);
      return;
    }

    async function fetchResults() {
      try {
        const res = await fetch(
          `/api/ingredients?q=${encodeURIComponent(debouncedSearch)}`
        );
        if (res.ok) {
          const data = await res.json();
          // Filter out the source ingredient
          setResults(
            (data as SearchResult[]).filter((i) => i.id !== source.id)
          );
        }
      } catch {
        // ignore
      }
    }

    fetchResults();
  }, [debouncedSearch, source.id]);

  async function handleMerge() {
    if (!target) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/ingredients/${source.id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: target.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success(`Merged "${source.name}" into "${target.name}"`);
      onOpenChange(false);
      onMerged();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to merge ingredients"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Merge ingredient</DialogTitle>
          <DialogDescription>
            Merge &ldquo;{source.name}&rdquo; into another ingredient. All{" "}
            {source._count.recipes} recipe reference(s) will be moved.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Command shouldFilter={false} className="rounded-lg border">
            <CommandInput
              placeholder="Search target ingredient..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>No ingredients found.</CommandEmpty>
              <CommandGroup>
                {results.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    data-checked={target?.id === item.id ? "true" : undefined}
                    onSelect={() => setTarget(item)}
                  >
                    <span>{item.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {item.category}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>

          {target && (
            <p className="text-sm text-muted-foreground">
              All {source._count.recipes} recipe reference(s) will be moved to{" "}
              <strong>{target.name}</strong>. &ldquo;{source.name}&rdquo; will
              be deleted.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            onClick={handleMerge}
            disabled={!target || loading}
          >
            {loading ? "Merging..." : "Merge"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
