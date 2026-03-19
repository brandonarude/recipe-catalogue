import { z } from "zod";

export const ingredientInput = z.object({
  ingredientId: z.string().min(1, "Ingredient is required"),
  ingredientName: z.string(), // display-only, stripped before API call
  quantity: z.coerce.number().positive().nullable().optional(),
  unit: z.string().nullable().optional(),
  preparation: z.string().nullable().optional(),
  sourceName: z.string().optional(), // scraped name for import context
});

const ingredientApiInput = z.object({
  ingredientId: z.string().min(1, "Ingredient is required"),
  quantity: z.coerce.number().positive().nullable().optional(),
  unit: z.string().nullable().optional(),
  preparation: z.string().nullable().optional(),
});

const recipeFields = {
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  steps: z.array(z.string().min(1)).min(1, "At least one step is required"),
  prepTime: z.coerce.number().int().nonnegative().nullable().optional(),
  cookTime: z.coerce.number().int().nonnegative().nullable().optional(),
  servings: z.coerce.number().int().positive().default(4),
  notes: z.string().optional().default(""),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string().min(1)).optional().default([]),
  dietaryTagIds: z.array(z.string()).optional().default([]),
};

export const recipeCreateSchema = z.object({
  ...recipeFields,
  ingredients: z.array(ingredientInput).min(1, "At least one ingredient is required"),
});

export const recipeApiSchema = z.object({
  ...recipeFields,
  ingredients: z.array(ingredientApiInput).min(1, "At least one ingredient is required"),
});

export const recipeUpdateSchema = recipeCreateSchema.partial();
export const recipeApiUpdateSchema = recipeApiSchema.partial();

export type RecipeCreateInput = z.infer<typeof recipeCreateSchema>;
export type RecipeUpdateInput = z.infer<typeof recipeUpdateSchema>;
export type IngredientInput = z.infer<typeof ingredientInput>;
