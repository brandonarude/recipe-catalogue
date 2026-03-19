import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RecipeGrid } from "@/components/recipes/recipe-grid";

export const metadata = { title: "Favorites - Recipe Catalogue" };

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user) return null;

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      recipe: {
        include: {
          photos: { orderBy: { order: "asc" }, take: 1 },
          tags: { include: { tag: true } },
          ratings: { select: { score: true } },
          _count: { select: { ratings: true } },
        },
      },
    },
  });

  const recipes = favorites.map(({ recipe }) => {
    const avgRating =
      recipe.ratings.length > 0
        ? recipe.ratings.reduce((sum, r) => sum + r.score, 0) / recipe.ratings.length
        : null;
    const { ratings: _ratings, ...rest } = recipe;
    return { ...rest, avgRating };
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">My Favorites</h1>
      <div className="mt-4">
        <RecipeGrid recipes={recipes} />
      </div>
    </div>
  );
}
