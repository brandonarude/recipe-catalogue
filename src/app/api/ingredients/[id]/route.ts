import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "ADMIN") return null;
  return session;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const ingredient = await prisma.ingredient.findUnique({
    where: { id },
    include: {
      _count: { select: { recipes: true, shoppingItems: true } },
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

  if (!ingredient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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

  return NextResponse.json({
    id: ingredient.id,
    name: ingredient.name,
    category: ingredient.category,
    _count: ingredient._count,
    recipes,
  });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const ingredient = await prisma.ingredient.findUnique({
    where: { id },
    include: { _count: { select: { recipes: true, shoppingItems: true } } },
  });

  if (!ingredient) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (ingredient._count.recipes > 0 || ingredient._count.shoppingItems > 0) {
    return NextResponse.json(
      {
        error: "Ingredient is in use",
        recipeCount: ingredient._count.recipes,
        shoppingItemCount: ingredient._count.shoppingItems,
      },
      { status: 409 }
    );
  }

  await prisma.ingredient.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
