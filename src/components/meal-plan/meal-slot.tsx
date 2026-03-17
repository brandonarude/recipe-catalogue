"use client";

import { X } from "lucide-react";

interface MealEntry {
  id: string;
  courseType: string;
  recipe: {
    id: string;
    title: string;
  };
}

interface MealSlotProps {
  mealType: string;
  meals: MealEntry[];
  onRemove: (id: string) => void;
  addButton: React.ReactNode;
}

const mealLabels: Record<string, string> = {
  BREAKFAST: "Breakfast",
  LUNCH: "Lunch",
  DINNER: "Dinner",
  SNACK: "Snack",
};

export function MealSlot({ mealType, meals, onRemove, addButton }: MealSlotProps) {
  return (
    <div className="rounded-md bg-muted/50 p-2">
      <div className="mb-1 text-xs font-medium text-muted-foreground">
        {mealLabels[mealType] || mealType}
      </div>
      <div className="space-y-1">
        {meals.map((meal) => (
          <div
            key={meal.id}
            className="flex items-center justify-between rounded bg-background px-2 py-1 text-xs"
          >
            <span className="line-clamp-1 flex-1">
              {meal.courseType === "SIDE" && (
                <span className="text-muted-foreground mr-1">[Side]</span>
              )}
              {meal.recipe.title}
            </span>
            <button
              onClick={() => onRemove(meal.id)}
              className="ml-1 shrink-0 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        {addButton}
      </div>
    </div>
  );
}
