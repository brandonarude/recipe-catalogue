import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateShoppingListSchema } from "@/lib/validators/shopping-list";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await prisma.shoppingList.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        include: { ingredient: true },
        orderBy: { ingredient: { category: "asc" } },
      },
    },
  });

  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = generateShoppingListSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { recipeIds } = parsed.data;

  // Get all ingredients from selected recipes
  const recipeIngredients = await prisma.recipeIngredient.findMany({
    where: { recipeId: { in: recipeIds } },
    include: { ingredient: true },
  });

  // Deduplicate and aggregate
  const aggregated = new Map<
    string,
    { ingredientId: string; quantity: number | null; unit: string | null }
  >();

  for (const ri of recipeIngredients) {
    const key = `${ri.ingredientId}:${ri.unit || ""}`;
    const existing = aggregated.get(key);
    if (existing) {
      if (existing.quantity != null && ri.quantity != null) {
        existing.quantity += ri.quantity;
      } else if (ri.quantity != null) {
        existing.quantity = ri.quantity;
      }
    } else {
      aggregated.set(key, {
        ingredientId: ri.ingredientId,
        quantity: ri.quantity,
        unit: ri.unit,
      });
    }
  }

  // Delete existing list and create new one
  await prisma.shoppingList.deleteMany({
    where: { userId: session.user.id },
  });

  const list = await prisma.shoppingList.create({
    data: {
      userId: session.user.id,
      items: {
        create: Array.from(aggregated.values()).map((item) => ({
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          unit: item.unit,
        })),
      },
    },
    include: {
      items: {
        include: { ingredient: true },
        orderBy: { ingredient: { category: "asc" } },
      },
    },
  });

  return NextResponse.json(list, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { itemId, checked } = await request.json();

  await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: { checked },
  });

  return NextResponse.json({ success: true });
}
