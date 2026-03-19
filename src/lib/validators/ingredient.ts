import { z } from "zod";

export const mergeIngredientSchema = z.object({
  targetId: z.string().min(1),
});

export type MergeIngredientInput = z.infer<typeof mergeIngredientSchema>;
