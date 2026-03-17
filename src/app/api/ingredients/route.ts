import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q") || "";
  if (q.length < 1) {
    return NextResponse.json([]);
  }

  const ingredients = await prisma.ingredient.findMany({
    where: { name: { contains: q.toLowerCase(), mode: "insensitive" } },
    take: 10,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(ingredients);
}
