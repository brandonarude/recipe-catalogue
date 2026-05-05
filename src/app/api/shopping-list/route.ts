import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addRecipeIngredientsSchema,
  reorderItemsSchema,
} from "@/lib/validators/shopping-list";

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
        orderBy: [{ ingredient: { category: "asc" } }, { orderIndex: "asc" }],
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
  const parsed = addRecipeIngredientsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { ingredients } = parsed.data;

  const list = await prisma.$transaction(async (tx) => {
    // Find or create the user's shopping list
    let shoppingList = await tx.shoppingList.findUnique({
      where: { userId: session.user!.id },
      include: { items: { include: { ingredient: true } } },
    });

    if (!shoppingList) {
      shoppingList = await tx.shoppingList.create({
        data: { userId: session.user!.id },
        include: { items: { include: { ingredient: true } } },
      });
    }

    // Build a map of existing items keyed by "ingredientId:unit"
    const existingMap = new Map<string, { id: string; quantity: number | null }>();
    // Track max orderIndex per category to append new items at the end of their bucket
    const maxOrderByCategory = new Map<string, number>();
    for (const item of shoppingList.items) {
      const key = `${item.ingredientId}:${item.unit || ""}`;
      existingMap.set(key, { id: item.id, quantity: item.quantity });
      const cat = item.ingredient.category;
      const current = maxOrderByCategory.get(cat) ?? -1;
      if (item.orderIndex > current) maxOrderByCategory.set(cat, item.orderIndex);
    }

    // Aggregate incoming ingredients with existing items
    for (const ing of ingredients) {
      const key = `${ing.ingredientId}:${ing.unit || ""}`;
      const existing = existingMap.get(key);

      if (existing) {
        // Aggregate: null + null = null, null + N = N, N + M = N+M
        let newQuantity: number | null = existing.quantity;
        if (ing.quantity != null) {
          newQuantity =
            existing.quantity != null
              ? existing.quantity + ing.quantity
              : ing.quantity;
        }
        await tx.shoppingListItem.update({
          where: { id: existing.id },
          data: { quantity: newQuantity },
        });
      } else {
        const ingredient = await tx.ingredient.findUnique({
          where: { id: ing.ingredientId },
          select: { category: true },
        });
        const category = ingredient?.category ?? "OTHER";
        const nextOrder = (maxOrderByCategory.get(category) ?? -1) + 1;
        maxOrderByCategory.set(category, nextOrder);
        await tx.shoppingListItem.create({
          data: {
            shoppingListId: shoppingList.id,
            ingredientId: ing.ingredientId,
            quantity: ing.quantity,
            unit: ing.unit,
            orderIndex: nextOrder,
          },
        });
      }
    }

    // Return the updated list
    return tx.shoppingList.findUnique({
      where: { id: shoppingList.id },
      include: {
        items: {
          include: { ingredient: true },
          orderBy: [{ ingredient: { category: "asc" } }, { orderIndex: "asc" }],
        },
      },
    });
  });

  return NextResponse.json(list, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reorderItemsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const list = await prisma.shoppingList.findUnique({
    where: { userId: session.user.id },
    select: { id: true, items: { select: { id: true } } },
  });
  if (!list) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ownedIds = new Set(list.items.map((i) => i.id));
  for (const { id } of parsed.data.items) {
    if (!ownedIds.has(id)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  await prisma.$transaction(
    parsed.data.items.map(({ id, orderIndex }) =>
      prisma.shoppingListItem.update({
        where: { id },
        data: { orderIndex },
      })
    )
  );

  return NextResponse.json({ success: true });
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

export async function DELETE() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.shoppingList.deleteMany({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
