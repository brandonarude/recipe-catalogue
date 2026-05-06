import { z } from "zod";

export const addRecipeIngredientsSchema = z.object({
  recipeId: z.string().optional(),
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

export const updateItemSchema = z
  .object({
    quantity: z.number().nullable().optional(),
    unit: z.string().nullable().optional(),
  })
  .refine((d) => d.quantity !== undefined || d.unit !== undefined, {
    message: "At least one field must be provided",
  });

export const reorderItemsSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        orderIndex: z.number().int().nonnegative(),
      })
    )
    .min(1),
});
