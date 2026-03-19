"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { toTitleCase } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ value, onChange }: TagInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery.length < 1) {
      setSuggestions([]);
      return;
    }
    fetch(`/api/tags?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, [debouncedQuery]);

  function addTag(tag: string) {
    const normalized = tag.toLowerCase().trim();
    if (normalized && !value.includes(normalized)) {
      onChange([...value, normalized]);
    }
    setQuery("");
    setShowSuggestions(false);
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {value.map((tag) => (
          <Badge key={tag} variant="secondary" className="gap-1">
            {toTitleCase(tag)}
            <button type="button" onClick={() => removeTag(tag)}>
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input
          placeholder="Add tag..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (query.trim()) addTag(query);
            }
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md">
            {suggestions
              .filter((s) => !value.includes(s.name))
              .map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className="w-full px-3 py-2.5 md:py-2 text-left text-sm hover:bg-accent"
                  onMouseDown={() => addTag(s.name)}
                >
                  {toTitleCase(s.name)}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
