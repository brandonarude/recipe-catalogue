import { z } from "zod";

export const generateShoppingListSchema = z.object({
  recipeIds: z.array(z.string()).min(1, "Select at least one recipe"),
});

export const checkItemSchema = z.object({
  itemId: z.string(),
  checked: z.boolean(),
});
