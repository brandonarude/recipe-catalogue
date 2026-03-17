"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import type { IngredientInput } from "@/lib/validators/recipe";

interface IngredientInputProps {
  value: IngredientInput;
  onChange: (value: IngredientInput) => void;
  onRemove: () => void;
}

export function IngredientInputRow({ value, onChange, onRemove }: IngredientInputProps) {
  const [query, setQuery] = useState(value.name);
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 1) {
      setSuggestions([]);
      return;
    }
    fetch(`/api/ingredients?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, [debouncedQuery]);

  return (
    <div className="flex flex-wrap items-start gap-2">
      <div className="relative flex-1 min-w-[140px]">
        <Input
          placeholder="Ingredient name"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange({ ...value, name: e.target.value });
            setShowSuggestions(true);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
            {suggestions.map((s) => (
              <button
                key={s.id}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={() => {
                  setQuery(s.name);
                  onChange({ ...value, name: s.name });
                  setShowSuggestions(false);
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <Input
        className="w-20"
        placeholder="Qty"
        type="number"
        step="any"
        value={value.quantity ?? ""}
        onChange={(e) =>
          onChange({
            ...value,
            quantity: e.target.value ? parseFloat(e.target.value) : null,
          })
        }
      />
      <Input
        className="w-24"
        placeholder="Unit"
        value={value.unit ?? ""}
        onChange={(e) => onChange({ ...value, unit: e.target.value || null })}
      />
      <Input
        className="w-28"
        placeholder="Prep (diced)"
        value={value.preparation ?? ""}
        onChange={(e) =>
          onChange({ ...value, preparation: e.target.value || null })
        }
      />
      <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
