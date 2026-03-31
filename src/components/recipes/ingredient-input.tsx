"use client";

import { useWatch, type Control, type UseFormSetValue } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { IngredientCombobox } from "./ingredient-combobox";
import type { RecipeCreateInput } from "@/lib/validators/recipe";

interface IngredientInputProps {
  control: Control<RecipeCreateInput>;
  index: number;
  setValue: UseFormSetValue<RecipeCreateInput>;
  onRemove: () => void;
  scrapedName?: string;
}

export function IngredientInputRow({ control, index, setValue, onRemove, scrapedName }: IngredientInputProps) {
  const value = useWatch({ control, name: `ingredients.${index}` });

  function update(patch: Partial<typeof value>) {
    setValue(`ingredients.${index}`, { ...value, ...patch }, { shouldValidate: true });
  }

  return (
    <div className="flex flex-wrap items-start gap-2">
      <div className="flex-1 min-w-[140px]">
        <IngredientCombobox
          value={{ ingredientId: value.ingredientId, ingredientName: value.ingredientName }}
          onChange={({ ingredientId, ingredientName }) =>
            update({ ingredientId, ingredientName })
          }
          scrapedName={scrapedName}
        />
      </div>
      <Input
        className="flex-1 sm:flex-none sm:w-20"
        placeholder="Qty"
        type="number"
        step="any"
        value={value.quantity ?? ""}
        onChange={(e) =>
          update({ quantity: e.target.value ? parseFloat(e.target.value) : null })
        }
      />
      <Input
        className="flex-1 sm:flex-none sm:w-24"
        placeholder="Unit"
        value={value.unit ?? ""}
        onChange={(e) => update({ unit: e.target.value || null })}
      />
      <Input
        className="flex-1 sm:flex-none sm:w-28"
        placeholder="Prep (diced)"
        value={value.preparation ?? ""}
        onChange={(e) =>
          update({ preparation: e.target.value || null })
        }
      />
      <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
