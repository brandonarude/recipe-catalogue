import { z } from "zod";

export const addRecipeIngredientsSchema = z.object({
  recipeId: z.string(),
  ingredients: z
    .array(
      z.object({
        ingredientId: z.string(),
        quantity: z.number().nullable(),
        unit: z.string().nullable(),
      })
    )
    .min(1, "Select at least one ingredient"),
});

export const checkItemSchema = z.object({
  itemId: z.string(),
  checked: z.boolean(),
});
