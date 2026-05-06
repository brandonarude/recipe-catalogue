import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    select: {
      servings: true,
      ingredients: {
        include: { ingredient: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  return NextResponse.json({
    servings: recipe.servings,
    ingredients: recipe.ingredients,
  });
}
