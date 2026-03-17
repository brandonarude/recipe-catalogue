import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecipeForm } from "@/components/recipes/recipe-form";

export const metadata = { title: "Edit Recipe - Recipe Catalogue" };

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return redirect("/login");

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      ingredients: {
        include: { ingredient: true },
        orderBy: { orderIndex: "asc" },
      },
      tags: { include: { tag: true } },
      dietaryTags: { include: { dietaryTag: true } },
    },
  });

  if (!recipe) return notFound();
  if (recipe.createdById !== session.user.id && session.user.role !== "ADMIN") {
    return redirect(`/recipes/${id}`);
  }

  const defaultValues = {
    title: recipe.title,
    description: recipe.description || "",
    steps: JSON.parse(recipe.steps) as string[],
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    servings: recipe.servings,
    notes: recipe.notes || "",
    sourceUrl: recipe.sourceUrl || "",
    ingredients: recipe.ingredients.map((ri) => ({
      name: ri.ingredient.name,
      quantity: ri.quantity,
      unit: ri.unit,
      preparation: ri.preparation,
      category: ri.ingredient.category as "OTHER",
    })),
    tags: recipe.tags.map((rt) => rt.tag.name),
    dietaryTagIds: recipe.dietaryTags.map((rdt) => rdt.dietaryTagId),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Edit Recipe</h1>
      <RecipeForm recipeId={id} defaultValues={defaultValues} />
    </div>
  );
}
