import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recipeApiUpdateSchema } from "@/lib/validators/recipe";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
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

  if (!recipe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const avgRating =
    recipe.ratings.length > 0
      ? recipe.ratings.reduce((sum, r) => sum + r.score, 0) /
        recipe.ratings.length
      : null;
  const userRating = recipe.ratings.find((r) => r.userId === session.user.id);
  const isFavorited = recipe.favorites.length > 0;

  const { ratings: _ratings, favorites: _favorites, ...rest } = recipe;

  return NextResponse.json({
    ...rest,
    avgRating,
    userRating: userRating?.score ?? null,
    isFavorited,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.recipe.findUnique({
    where: { id },
    select: { createdById: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.createdById !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = recipeApiUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { ingredients, tags, dietaryTagIds, ...recipeData } = parsed.data;

  // Delete existing relations if being replaced
  const deleteOps = [];
  if (ingredients) {
    deleteOps.push(prisma.recipeIngredient.deleteMany({ where: { recipeId: id } }));
  }
  if (tags) {
    deleteOps.push(prisma.recipeTag.deleteMany({ where: { recipeId: id } }));
  }
  if (dietaryTagIds) {
    deleteOps.push(prisma.recipeDietaryTag.deleteMany({ where: { recipeId: id } }));
  }
  if (deleteOps.length > 0) {
    await Promise.all(deleteOps);
  }

  const updateData: Record<string, unknown> = {};
  if (recipeData.title !== undefined) updateData.title = recipeData.title;
  if (recipeData.description !== undefined)
    updateData.description = recipeData.description || null;
  if (recipeData.steps !== undefined)
    updateData.steps = JSON.stringify(recipeData.steps);
  if (recipeData.prepTime !== undefined) updateData.prepTime = recipeData.prepTime ?? null;
  if (recipeData.cookTime !== undefined) updateData.cookTime = recipeData.cookTime ?? null;
  if (recipeData.servings !== undefined) updateData.servings = recipeData.servings;
  if (recipeData.notes !== undefined) updateData.notes = recipeData.notes || null;
  if (recipeData.sourceUrl !== undefined)
    updateData.sourceUrl = recipeData.sourceUrl || null;

  if (ingredients) {
    updateData.ingredients = {
      create: ingredients.map((ing, index) => ({
        ingredientId: ing.ingredientId,
        quantity: ing.quantity ?? null,
        unit: ing.unit ?? null,
        preparation: ing.preparation ?? null,
        orderIndex: index,
      })),
    };
  }

  if (tags) {
    updateData.tags = {
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
    };
  }

  if (dietaryTagIds) {
    updateData.dietaryTags = {
      create: dietaryTagIds.map((dietaryTagId) => ({ dietaryTagId })),
    };
  }

  const recipe = await prisma.recipe.update({
    where: { id },
    data: updateData,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      ingredients: { include: { ingredient: true }, orderBy: { orderIndex: "asc" } },
      tags: { include: { tag: true } },
      dietaryTags: { include: { dietaryTag: true } },
      photos: { orderBy: { order: "asc" } },
    },
  });

  return NextResponse.json(recipe);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.recipe.findUnique({
    where: { id },
    select: { createdById: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.createdById !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.recipe.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
