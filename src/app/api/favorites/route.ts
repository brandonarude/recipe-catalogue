import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const where = { userId: session.user.id };

  const [favorites, total] = await Promise.all([
    prisma.favorite.findMany({
      where,
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
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.favorite.count({ where }),
  ]);

  const recipes = favorites.map(({ recipe }) => {
    const avgRating =
      recipe.ratings.length > 0
        ? recipe.ratings.reduce((sum, r) => sum + r.score, 0) / recipe.ratings.length
        : null;
    const { ratings: _ratings, ...rest } = recipe;
    return { ...rest, avgRating };
  });

  return NextResponse.json({
    recipes,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
