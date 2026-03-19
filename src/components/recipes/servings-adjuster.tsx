"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toTitleCase } from "@/lib/utils";

interface Ingredient {
  id: string;
  quantity: number | null;
  unit: string | null;
  preparation: string | null;
  ingredient: { name: string };
}

interface ServingsAdjusterProps {
  baseServings: number;
  ingredients: Ingredient[];
}

function formatQuantity(q: number): string {
  if (q === Math.floor(q)) return q.toString();
  // Common fractions
  const frac = q - Math.floor(q);
  const whole = Math.floor(q);
  const fractions: Record<string, string> = {
    "0.25": "\u00BC",
    "0.33": "\u2153",
    "0.5": "\u00BD",
    "0.67": "\u2154",
    "0.75": "\u00BE",
  };
  const key = frac.toFixed(2);
  if (fractions[key]) {
    return whole > 0 ? `${whole}${fractions[key]}` : fractions[key];
  }
  return q.toFixed(1);
}

export function ServingsAdjuster({ baseServings, ingredients }: ServingsAdjusterProps) {
  const [servings, setServings] = useState(baseServings);
  const scale = servings / baseServings;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Servings:</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setServings(Math.max(1, servings - 1))}
            disabled={servings <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-semibold">{servings}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setServings(servings + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {servings !== baseServings && (
          <button
            className="text-xs text-primary hover:underline"
            onClick={() => setServings(baseServings)}
          >
            Reset
          </button>
        )}
      </div>

      <ul className="space-y-2">
        {ingredients.map((ri) => {
          const scaledQty = ri.quantity != null ? ri.quantity * scale : null;
          return (
            <li key={ri.id} className="flex items-baseline gap-2 text-base">
              <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
              <span>
                {scaledQty != null && <strong>{formatQuantity(scaledQty)}</strong>}
                {ri.unit && ` ${ri.unit}`}
                {" "}{toTitleCase(ri.ingredient.name)}
                {ri.preparation && (
                  <span className="text-muted-foreground">, {ri.preparation}</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
