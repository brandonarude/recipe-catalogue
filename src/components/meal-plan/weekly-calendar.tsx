"use client";

import { useState, useEffect, useCallback } from "react";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  eachDayOfInterval,
  isSameDay,
} from "date-fns";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, ShoppingCart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MealSlot } from "./meal-slot";
import { AddMealDialog } from "./add-meal-dialog";

const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;

interface MealPlanEntry {
  id: string;
  date: string;
  mealType: string;
  courseType: string;
  recipe: {
    id: string;
    title: string;
    cookTime: number | null;
    photos: { url: string }[];
  };
}

export function WeeklyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meals, setMeals] = useState<MealPlanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingList, setGeneratingList] = useState(false);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const fetchMeals = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: format(weekStart, "yyyy-MM-dd"),
        endDate: format(weekEnd, "yyyy-MM-dd"),
      });
      const res = await fetch(`/api/meal-plan?${params}`);
      const data = await res.json();
      setMeals(data);
    } catch {
      toast.error("Failed to load meal plan");
    } finally {
      setLoading(false);
    }
  }, [weekStart.toISOString(), weekEnd.toISOString()]);

  useEffect(() => {
    fetchMeals();
  }, [fetchMeals]);

  async function removeMeal(id: string) {
    try {
      await fetch("/api/meal-plan", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setMeals((prev) => prev.filter((m) => m.id !== id));
      toast.success("Removed from meal plan");
    } catch {
      toast.error("Failed to remove meal");
    }
  }

  async function generateShoppingList() {
    const recipeIds = [...new Set(meals.map((m) => m.recipe.id))];
    if (recipeIds.length === 0) {
      toast.error("No meals planned this week");
      return;
    }

    setGeneratingList(true);
    try {
      const res = await fetch("/api/shopping-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeIds }),
      });
      if (!res.ok) throw new Error();
      toast.success("Shopping list generated from meal plan!");
    } catch {
      toast.error("Failed to generate shopping list");
    } finally {
      setGeneratingList(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={generateShoppingList}
          disabled={generatingList || meals.length === 0}
        >
          {generatingList ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <ShoppingCart className="mr-1 h-4 w-4" />
          )}
          Shopping List
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day.toISOString()} className="rounded-lg border p-3">
              <h3 className="mb-2 text-sm font-semibold">
                {format(day, "EEEE, MMM d")}
                {isSameDay(day, new Date()) && (
                  <span className="ml-2 text-xs text-primary">(Today)</span>
                )}
              </h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {MEAL_TYPES.map((mealType) => {
                  const mealEntries = meals.filter(
                    (m) =>
                      isSameDay(new Date(m.date), day) &&
                      m.mealType === mealType
                  );
                  return (
                    <MealSlot
                      key={mealType}
                      mealType={mealType}
                      meals={mealEntries}
                      onRemove={removeMeal}
                      addButton={
                        <AddMealDialog
                          date={format(day, "yyyy-MM-dd")}
                          mealType={mealType}
                          onAdded={fetchMeals}
                        />
                      }
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
