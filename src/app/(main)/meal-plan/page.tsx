import { WeeklyCalendar } from "@/components/meal-plan/weekly-calendar";

export const metadata = { title: "Meal Plan - Recipe Catalogue" };

export default function MealPlanPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Meal Plan</h1>
      <WeeklyCalendar />
    </div>
  );
}
