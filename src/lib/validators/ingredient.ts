import { z } from "zod";

export const mergeIngredientSchema = z.object({
  targetId: z.string().min(1),
});

export const ingredientCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.enum([
    "PRODUCE", "DAIRY", "MEAT", "SEAFOOD", "BAKERY",
    "PANTRY", "FROZEN", "BEVERAGES", "CONDIMENTS", "SPICES", "OTHER",
  ]),
});

export type MergeIngredientInput = z.infer<typeof mergeIngredientSchema>;
export type IngredientCreateInput = z.infer<typeof ingredientCreateSchema>;
