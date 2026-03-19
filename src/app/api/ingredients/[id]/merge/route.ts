import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mergeIngredientSchema } from "@/lib/validators/ingredient";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role !== "ADMIN") return null;
  return session;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: sourceId } = await params;
  const body = await request.json();
  const parsed = mergeIngredientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { targetId } = parsed.data;

  if (sourceId === targetId) {
    return NextResponse.json(
      { error: "Source and target must be different" },
      { status: 400 }
    );
  }

  const [source, target] = await Promise.all([
    prisma.ingredient.findUnique({ where: { id: sourceId } }),
    prisma.ingredient.findUnique({ where: { id: targetId } }),
  ]);

  if (!source || !target) {
    return NextResponse.json(
      { error: "Source or target ingredient not found" },
      { status: 404 }
    );
  }

  await prisma.$transaction(
    async (tx) => {
      // Get all recipe-ingredient rows for source and target
      const sourceRows = await tx.recipeIngredient.findMany({
        where: { ingredientId: sourceId },
      });
      const targetRows = await tx.recipeIngredient.findMany({
        where: { ingredientId: targetId },
      });

      const targetRecipeIds = new Set(targetRows.map((r) => r.recipeId));

      for (const row of sourceRows) {
        if (!targetRecipeIds.has(row.recipeId)) {
          // No conflict: just reassign to target
          await tx.recipeIngredient.update({
            where: { id: row.id },
            data: { ingredientId: targetId },
          });
        } else {
          // Conflict: recipe uses both source and target ingredient
          const targetRow = targetRows.find((r) => r.recipeId === row.recipeId)!;

          // Combine quantities (null-aware sum)
          let combinedQuantity: number | null = null;
          if (targetRow.quantity != null && row.quantity != null) {
            combinedQuantity = targetRow.quantity + row.quantity;
          } else if (targetRow.quantity != null) {
            combinedQuantity = targetRow.quantity;
          } else if (row.quantity != null) {
            combinedQuantity = row.quantity;
          }

          // Concatenate preparations
          const preps = [targetRow.preparation, row.preparation].filter(Boolean);
          const combinedPreparation = preps.length > 0 ? preps.join(", ") : null;

          await tx.recipeIngredient.update({
            where: { id: targetRow.id },
            data: {
              quantity: combinedQuantity,
              preparation: combinedPreparation,
            },
          });

          await tx.recipeIngredient.delete({ where: { id: row.id } });
        }
      }

      // Move shopping list items
      await tx.shoppingListItem.updateMany({
        where: { ingredientId: sourceId },
        data: { ingredientId: targetId },
      });

      // Delete the source ingredient
      await tx.ingredient.delete({ where: { id: sourceId } });
    },
    { timeout: 15000 }
  );

  return NextResponse.json({ success: true });
}
