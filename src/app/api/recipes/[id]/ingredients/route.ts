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

  const ingredients = await prisma.recipeIngredient.findMany({
    where: { recipeId: id },
    include: { ingredient: true },
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json(ingredients);
}
