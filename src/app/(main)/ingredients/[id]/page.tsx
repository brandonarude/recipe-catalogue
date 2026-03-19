import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { RecipeGrid } from "@/components/recipes/recipe-grid";

export const dynamic = "force-dynamic";

export default async function IngredientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  const ingredient = await prisma.ingredient.findUnique({
    where: { id },
    include: {
      recipes: {
        include: {
          recipe: {
            include: {
              photos: { take: 1, orderBy: { order: "asc" } },
              tags: { include: { tag: true } },
              ratings: true,
              _count: { select: { ratings: true } },
            },
          },
        },
      },
    },
  });

  if (!ingredient) notFound();

  const recipes = ingredient.recipes.map((ri) => {
    const r = ri.recipe;
    const avgRating =
      r.ratings.length > 0
        ? r.ratings.reduce((sum, rat) => sum + rat.score, 0) / r.ratings.length
        : null;
    return {
      id: r.id,
      title: r.title,
      description: r.description,
      cookTime: r.cookTime,
      photos: r.photos,
      tags: r.tags,
      avgRating,
      _count: r._count,
    };
  });

  return (
    <div>
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{ingredient.name}</h1>
        <Badge variant="secondary">{ingredient.category}</Badge>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Used in {recipes.length} recipe(s)
      </p>

      <div className="mt-6">
        <RecipeGrid recipes={recipes} />
      </div>
    </div>
  );
}
