"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronsUpDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";
import { AddIngredientDialog } from "./add-ingredient-dialog";

interface IngredientOption {
  id: string;
  name: string;
  category: string;
}

interface IngredientComboboxProps {
  value: { ingredientId: string; ingredientName: string };
  onChange: (value: { ingredientId: string; ingredientName: string }) => void;
  scrapedName?: string;
}

export function IngredientCombobox({ value, onChange, scrapedName }: IngredientComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<IngredientOption[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      const scrollY = window.scrollY;
      setOpen(true);
      requestAnimationFrame(() => {
        window.scrollTo({ top: scrollY, behavior: "instant" });
      });
    } else {
      setOpen(false);
    }
  }, []);

  // Pre-populate search with scraped name when opening if no ingredient selected
  useEffect(() => {
    if (open && !value.ingredientId && scrapedName) {
      setSearch(scrapedName);
    }
  }, [open, value.ingredientId, scrapedName]);

  useEffect(() => {
    if (debouncedSearch.length < 1) {
      setResults([]);
      return;
    }

    fetch(`/api/ingredients?q=${encodeURIComponent(debouncedSearch)}`)
      .then((r) => r.json())
      .then((data) => setResults(data as IngredientOption[]))
      .catch(() => setResults([]));
  }, [debouncedSearch]);

  function handleSelect(ingredient: IngredientOption) {
    onChange({ ingredientId: ingredient.id, ingredientName: ingredient.name });
    setOpen(false);
    setSearch("");
  }

  function handleCreated(ingredient: { id: string; name: string; category: string }) {
    onChange({ ingredientId: ingredient.id, ingredientName: ingredient.name });
    setShowCreate(false);
    setOpen(false);
    setSearch("");
  }

  return (
    <>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="w-full justify-between font-normal"
            />
          }
        >
          <span className={value.ingredientName ? "" : "text-muted-foreground"}>
            {value.ingredientName || "Select ingredient..."}
          </span>
          <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[--anchor-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search ingredients..."
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
                    data-checked={value.ingredientId === item.id ? "true" : undefined}
                    onSelect={() => handleSelect(item)}
                  >
                    <span>{item.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {item.category}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setShowCreate(true);
                    setOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Create new ingredient
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {scrapedName && (
        <p className="text-xs text-muted-foreground mt-1">
          Scraped: {scrapedName}
        </p>
      )}

      <AddIngredientDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        defaultName={search || scrapedName || ""}
        onCreated={handleCreated}
      />
    </>
  );
}
