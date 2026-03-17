import { z } from "zod";

export const addMealSchema = z.object({
  recipeId: z.string(),
  date: z.string(), // ISO date string
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  courseType: z.enum(["MAIN", "SIDE"]).default("MAIN"),
});

export const moveMealSchema = z.object({
  id: z.string(),
  date: z.string(),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
});
