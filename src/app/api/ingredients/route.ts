import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_CATEGORIES = [
  "PRODUCE", "DAIRY", "MEAT", "SEAFOOD", "BAKERY",
  "PANTRY", "FROZEN", "BEVERAGES", "CONDIMENTS", "SPICES", "OTHER",
] as const;

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  // Preserve existing autocomplete behavior: when only `q` is provided
  // with no other params, return the same flat array (max 10 results).
  const isAutocomplete =
    q.length >= 1 && !searchParams.has("category") && !searchParams.has("page") && !searchParams.has("limit");

  if (isAutocomplete) {
    const ingredients = await prisma.ingredient.findMany({
      where: { name: { contains: q.toLowerCase(), mode: "insensitive" } },
      take: 10,
      orderBy: { name: "asc" },
    });
    return NextResponse.json(ingredients);
  }

  const where: Record<string, unknown> = {};
  if (q) {
    where.name = { contains: q.toLowerCase(), mode: "insensitive" };
  }
  if (category && (VALID_CATEGORIES as readonly string[]).includes(category)) {
    where.category = category;
  }

  const [ingredients, total] = await Promise.all([
    prisma.ingredient.findMany({
      where,
      include: { _count: { select: { recipes: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ingredient.count({ where }),
  ]);

  return NextResponse.json({
    ingredients,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
