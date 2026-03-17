import { z } from "zod";

export const ingredientInput = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  quantity: z.coerce.number().positive().nullable().optional(),
  unit: z.string().nullable().optional(),
  preparation: z.string().nullable().optional(),
  category: z
    .enum([
      "PRODUCE",
      "DAIRY",
      "MEAT",
      "SEAFOOD",
      "BAKERY",
      "PANTRY",
      "FROZEN",
      "BEVERAGES",
      "CONDIMENTS",
      "SPICES",
      "OTHER",
    ])
    .optional()
    .default("OTHER"),
});

export const recipeCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  steps: z.array(z.string().min(1)).min(1, "At least one step is required"),
  prepTime: z.coerce.number().int().nonnegative().nullable().optional(),
  cookTime: z.coerce.number().int().nonnegative().nullable().optional(),
  servings: z.coerce.number().int().positive().default(4),
  notes: z.string().optional().default(""),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  ingredients: z.array(ingredientInput).min(1, "At least one ingredient is required"),
  tags: z.array(z.string().min(1)).optional().default([]),
  dietaryTagIds: z.array(z.string()).optional().default([]),
});

export const recipeUpdateSchema = recipeCreateSchema.partial();

export type RecipeCreateInput = z.infer<typeof recipeCreateSchema>;
export type RecipeUpdateInput = z.infer<typeof recipeUpdateSchema>;
export type IngredientInput = z.infer<typeof ingredientInput>;
