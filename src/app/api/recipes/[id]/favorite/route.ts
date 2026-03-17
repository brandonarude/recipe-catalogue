import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: recipeId } = await params;

  const existing = await prisma.favorite.findUnique({
    where: {
      recipeId_userId: { recipeId, userId: session.user.id },
    },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ isFavorited: false });
  }

  await prisma.favorite.create({
    data: { recipeId, userId: session.user.id },
  });
  return NextResponse.json({ isFavorited: true });
}
