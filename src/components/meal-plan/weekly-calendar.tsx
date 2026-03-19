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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  const [selectedDay, setSelectedDay] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Reset selectedDay to weekStart when week changes
  useEffect(() => {
    setSelectedDay(weekStart);
  }, [weekStart.toISOString()]);

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

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
          </span>
          <Button
            variant="outline"
            size="icon"
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
      </div>

      {loading ? (
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      ) : (
        <>
          {/* Mobile: horizontal day picker + single day view */}
          <div className="md:hidden space-y-4">
            {/* Day picker strip */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {days.map((day) => {
                const isSelected = isSameDay(day, selectedDay);
                const isToday = isSameDay(day, new Date());
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDay(day)}
                    className={cn(
                      "flex min-w-[3rem] flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent",
                      !isSelected && isToday && "ring-1 ring-primary"
                    )}
                  >
                    <span className="text-xs">{format(day, "EEE")}</span>
                    <span className="text-lg font-semibold">{format(day, "d")}</span>
                  </button>
                );
              })}
            </div>

            {/* Single day meal slots */}
            <div>
              <h3 className="mb-2 text-sm font-semibold">
                {format(selectedDay, "EEEE, MMM d")}
                {isSameDay(selectedDay, new Date()) && (
                  <span className="ml-2 text-xs text-primary">(Today)</span>
                )}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {MEAL_TYPES.map((mealType) => {
                  const mealEntries = meals.filter(
                    (m) =>
                      isSameDay(new Date(m.date), selectedDay) &&
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
                          date={format(selectedDay, "yyyy-MM-dd")}
                          mealType={mealType}
                          onAdded={fetchMeals}
                        />
                      }
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop: full 7-day vertical layout */}
          <div className="hidden md:block space-y-4">
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
        </>
      )}
    </div>
  );
}
