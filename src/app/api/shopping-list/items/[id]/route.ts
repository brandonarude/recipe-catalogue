import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateItemSchema } from "@/lib/validators/shopping-list";

async function requireOwnedItem(itemId: string, userId: string) {
  const item = await prisma.shoppingListItem.findUnique({
    where: { id: itemId },
    select: { id: true, shoppingList: { select: { userId: true } } },
  });
  if (!item) return { error: "Not found" as const, status: 404 as const };
  if (item.shoppingList.userId !== userId) {
    return { error: "Forbidden" as const, status: 403 as const };
  }
  return { item };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const body = await request.json();
  const parsed = updateItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const ownership = await requireOwnedItem(id, session.user.id);
  if ("error" in ownership) {
    return NextResponse.json({ error: ownership.error }, { status: ownership.status });
  }

  const data: { quantity?: number | null; unit?: string | null } = {};
  if (parsed.data.quantity !== undefined) data.quantity = parsed.data.quantity;
  if (parsed.data.unit !== undefined) {
    data.unit = parsed.data.unit ? parsed.data.unit.trim() || null : null;
  }

  const updated = await prisma.shoppingListItem.update({
    where: { id },
    data,
    include: { ingredient: true },
  });

  return NextResponse.json(updated);
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

  const ownership = await requireOwnedItem(id, session.user.id);
  if ("error" in ownership) {
    return NextResponse.json({ error: ownership.error }, { status: ownership.status });
  }

  await prisma.shoppingListItem.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
