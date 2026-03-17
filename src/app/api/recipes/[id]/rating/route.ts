import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: recipeId } = await params;
  const { score } = await request.json();

  if (!score || score < 1 || score > 5) {
    return NextResponse.json({ error: "Score must be 1-5" }, { status: 400 });
  }

  const rating = await prisma.rating.upsert({
    where: {
      recipeId_userId: { recipeId, userId: session.user.id },
    },
    update: { score },
    create: { recipeId, userId: session.user.id, score },
  });

  return NextResponse.json(rating);
}
