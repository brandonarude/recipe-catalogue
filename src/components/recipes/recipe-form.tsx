"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { IngredientInputRow } from "./ingredient-input";
import { TagInput } from "./tag-input";
import { recipeCreateSchema, type RecipeCreateInput } from "@/lib/validators/recipe";

interface DietaryTag {
  id: string;
  name: string;
}

interface RecipeFormProps {
  recipeId?: string;
  defaultValues?: Partial<RecipeCreateInput>;
}

export function RecipeForm({ recipeId, defaultValues }: RecipeFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [dietaryTags, setDietaryTags] = useState<DietaryTag[]>([]);
  const isEdit = !!recipeId;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecipeCreateInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(recipeCreateSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      steps: [""],
      prepTime: null,
      cookTime: null,
      servings: 4,
      notes: "",
      sourceUrl: "",
      ingredients: [{ name: "", quantity: null, unit: null, preparation: null, category: "OTHER" }],
      tags: [],
      dietaryTagIds: [],
      ...defaultValues,
    },
  });

  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
  } = useFieldArray({ control, name: "steps" as never });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({ control, name: "ingredients" });

  const watchedTags = watch("tags");
  const watchedDietaryTagIds = watch("dietaryTagIds");
  const watchedIngredients = watch("ingredients");

  useEffect(() => {
    fetch("/api/dietary-tags")
      .then((r) => r.json())
      .then(setDietaryTags)
      .catch(() => {});
  }, []);

  async function onSubmit(data: RecipeCreateInput) {
    setSubmitting(true);
    try {
      const url = isEdit ? `/api/recipes/${recipeId}` : "/api/recipes";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save recipe");
      }

      const recipe = await res.json();
      toast.success(isEdit ? "Recipe updated" : "Recipe created");
      router.push(`/recipes/${recipe.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input id="title" {...register("title")} placeholder="Recipe title" />
        {errors.title && (
          <p className="text-sm text-destructive">{errors.title.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" {...register("description")} placeholder="Brief description" rows={2} />
      </div>

      {/* Times & Servings */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prepTime">Prep (min)</Label>
          <Input id="prepTime" type="number" {...register("prepTime")} placeholder="0" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cookTime">Cook (min)</Label>
          <Input id="cookTime" type="number" {...register("cookTime")} placeholder="0" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="servings">Servings</Label>
          <Input id="servings" type="number" {...register("servings")} placeholder="4" />
        </div>
      </div>

      {/* Ingredients */}
      <div className="space-y-3">
        <Label>Ingredients *</Label>
        {ingredientFields.map((field, index) => (
          <IngredientInputRow
            key={field.id}
            value={watchedIngredients[index]}
            onChange={(val) => {
              setValue(`ingredients.${index}`, val, { shouldValidate: true });
            }}
            onRemove={() => removeIngredient(index)}
          />
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            appendIngredient({ name: "", quantity: null, unit: null, preparation: null, category: "OTHER" })
          }
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Ingredient
        </Button>
        {errors.ingredients && (
          <p className="text-sm text-destructive">
            {typeof errors.ingredients.message === "string"
              ? errors.ingredients.message
              : "Check ingredients"}
          </p>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <Label>Steps *</Label>
        {stepFields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2">
            <GripVertical className="mt-2.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="mt-2 shrink-0 text-sm font-medium text-muted-foreground">
              {index + 1}.
            </span>
            <Textarea
              {...register(`steps.${index}`)}
              placeholder={`Step ${index + 1}`}
              rows={2}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeStep(index)}
              disabled={stepFields.length <= 1}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => appendStep("" as never)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Step
        </Button>
        {errors.steps && (
          <p className="text-sm text-destructive">
            {typeof errors.steps.message === "string"
              ? errors.steps.message
              : "Check steps"}
          </p>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <TagInput
          value={watchedTags}
          onChange={(tags) => setValue("tags", tags)}
        />
      </div>

      {/* Dietary Tags */}
      <div className="space-y-2">
        <Label>Dietary Tags</Label>
        <div className="flex flex-wrap gap-3">
          {dietaryTags.map((dt) => (
            <label key={dt.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={watchedDietaryTagIds.includes(dt.id)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setValue("dietaryTagIds", [...watchedDietaryTagIds, dt.id]);
                  } else {
                    setValue(
                      "dietaryTagIds",
                      watchedDietaryTagIds.filter((id) => id !== dt.id)
                    );
                  }
                }}
              />
              {dt.name}
            </label>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" {...register("notes")} placeholder="Additional notes" rows={3} />
      </div>

      {/* Source URL */}
      <div className="space-y-2">
        <Label htmlFor="sourceUrl">Source URL</Label>
        <Input id="sourceUrl" {...register("sourceUrl")} placeholder="https://..." />
      </div>

      {/* Submit */}
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : isEdit ? "Update Recipe" : "Create Recipe"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
