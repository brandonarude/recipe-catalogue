import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecipeDetail } from "@/components/recipes/recipe-detail";
import { CompanionChat } from "@/components/recipes/companion-chat";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: { title: true },
  });
  return { title: recipe ? `${recipe.title} - Recipe Catalogue` : "Not Found" };
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) return notFound();

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      ingredients: {
        include: { ingredient: true },
        orderBy: { orderIndex: "asc" },
      },
      tags: { include: { tag: true } },
      dietaryTags: { include: { dietaryTag: true } },
      photos: { orderBy: { order: "asc" } },
      ratings: { select: { score: true, userId: true } },
      favorites: { where: { userId: session.user.id } },
      _count: { select: { ratings: true, favorites: true } },
    },
  });

  if (!recipe) return notFound();

  const avgRating =
    recipe.ratings.length > 0
      ? recipe.ratings.reduce((sum, r) => sum + r.score, 0) / recipe.ratings.length
      : null;
  const userRating = recipe.ratings.find((r) => r.userId === session.user.id);
  const isFavorited = recipe.favorites.length > 0;
  const { ratings: _ratings, favorites: _favorites, ...rest } = recipe;

  return (
    <div className="mx-auto max-w-2xl">
      <RecipeDetail
        recipe={{
          ...rest,
          avgRating,
          userRating: userRating?.score ?? null,
          isFavorited,
        }}
        currentUserId={session.user.id}
        isAdmin={session.user.role === "ADMIN"}
      />
      <CompanionChat recipeId={id} recipeTitle={recipe.title} />
    </div>
  );
}
