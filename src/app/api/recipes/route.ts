import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recipeCreateSchema } from "@/lib/validators/recipe";
import { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  // Filters
  const q = searchParams.get("q") || "";
  const tags = searchParams.getAll("tag");
  const dietaryTags = searchParams.getAll("dietaryTag");
  const maxCookTime = searchParams.get("maxCookTime");
  const favoritesOnly = searchParams.get("favoritesOnly") === "true";
  const sort = searchParams.get("sort") || "newest";

  const where: Prisma.RecipeWhereInput = {};
  const conditions: Prisma.RecipeWhereInput[] = [];

  // Text search
  if (q) {
    conditions.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        {
          ingredients: {
            some: {
              ingredient: { name: { contains: q.toLowerCase(), mode: "insensitive" } },
            },
          },
        },
      ],
    });
  }

  // Tag filter
  if (tags.length > 0) {
    conditions.push({
      tags: { some: { tag: { name: { in: tags.map((t) => t.toLowerCase()) } } } },
    });
  }

  // Dietary tag filter
  if (dietaryTags.length > 0) {
    conditions.push({
      dietaryTags: { some: { dietaryTag: { name: { in: dietaryTags } } } },
    });
  }

  // Cook time filter
  if (maxCookTime) {
    conditions.push({ cookTime: { lte: parseInt(maxCookTime) } });
  }

  // Favorites filter
  if (favoritesOnly) {
    conditions.push({
      favorites: { some: { userId: session.user.id } },
    });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  // Sort
  let orderBy: Prisma.RecipeOrderByWithRelationInput;
  switch (sort) {
    case "alphabetical":
      orderBy = { title: "asc" };
      break;
    case "cookTime":
      orderBy = { cookTime: "asc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
  }

  const [recipes, total] = await Promise.all([
    prisma.recipe.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        tags: { include: { tag: true } },
        dietaryTags: { include: { dietaryTag: true } },
        photos: { orderBy: { order: "asc" }, take: 1 },
        ratings: { select: { score: true } },
        _count: { select: { ratings: true, favorites: true } },
      },
    }),
    prisma.recipe.count({ where }),
  ]);

  let recipesWithAvg = recipes.map((r) => {
    const avgRating =
      r.ratings.length > 0
        ? r.ratings.reduce((sum, rating) => sum + rating.score, 0) / r.ratings.length
        : null;
    const { ratings: _ratings, ...rest } = r;
    return { ...rest, avgRating };
  });

  // Sort by rating (post-query since it's computed)
  if (sort === "rating") {
    recipesWithAvg = recipesWithAvg.sort(
      (a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0)
    );
  }

  // Min rating filter (post-query)
  const minRating = searchParams.get("minRating");
  if (minRating) {
    const min = parseFloat(minRating);
    recipesWithAvg = recipesWithAvg.filter(
      (r) => r.avgRating !== null && r.avgRating >= min
    );
  }

  return NextResponse.json({
    recipes: recipesWithAvg,
    total: minRating ? recipesWithAvg.length : total,
    page,
    totalPages: Math.ceil((minRating ? recipesWithAvg.length : total) / limit),
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = recipeCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { ingredients, tags, dietaryTagIds, ...recipeData } = parsed.data;

  const recipe = await prisma.recipe.create({
    data: {
      ...recipeData,
      steps: JSON.stringify(recipeData.steps),
      sourceUrl: recipeData.sourceUrl || null,
      notes: recipeData.notes || null,
      description: recipeData.description || null,
      createdById: session.user.id,
      ingredients: {
        create: await Promise.all(
          ingredients.map(async (ing, index) => {
            const ingredient = await prisma.ingredient.upsert({
              where: { name: ing.name.toLowerCase().trim() },
              update: {},
              create: {
                name: ing.name.toLowerCase().trim(),
                category: ing.category || "OTHER",
              },
            });
            return {
              ingredientId: ingredient.id,
              quantity: ing.quantity ?? null,
              unit: ing.unit ?? null,
              preparation: ing.preparation ?? null,
              orderIndex: index,
            };
          })
        ),
      },
      tags: {
        create: await Promise.all(
          tags.map(async (tagName) => {
            const tag = await prisma.tag.upsert({
              where: { name: tagName.toLowerCase().trim() },
              update: {},
              create: { name: tagName.toLowerCase().trim() },
            });
            return { tagId: tag.id };
          })
        ),
      },
      dietaryTags: {
        create: dietaryTagIds.map((dietaryTagId) => ({ dietaryTagId })),
      },
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      ingredients: { include: { ingredient: true }, orderBy: { orderIndex: "asc" } },
      tags: { include: { tag: true } },
      dietaryTags: { include: { dietaryTag: true } },
      photos: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(recipe, { status: 201 });
}
