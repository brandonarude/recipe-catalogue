import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { addMealSchema } from "@/lib/validators/meal-plan";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const startDate = request.nextUrl.searchParams.get("startDate");
  const endDate = request.nextUrl.searchParams.get("endDate");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate and endDate required" },
      { status: 400 }
    );
  }

  const meals = await prisma.mealPlan.findMany({
    where: {
      userId: session.user.id,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    },
    include: {
      recipe: {
        select: {
          id: true,
          title: true,
          cookTime: true,
          photos: { orderBy: { order: "asc" }, take: 1 },
        },
      },
    },
    orderBy: [{ date: "asc" }, { mealType: "asc" }, { courseType: "asc" }],
  });

  return NextResponse.json(meals);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = addMealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { recipeId, date, mealType, courseType } = parsed.data;

  const meal = await prisma.mealPlan.create({
    data: {
      userId: session.user.id,
      recipeId,
      date: new Date(date),
      mealType,
      courseType,
    },
    include: {
      recipe: {
        select: {
          id: true,
          title: true,
          cookTime: true,
          photos: { orderBy: { order: "asc" }, take: 1 },
        },
      },
    },
  });

  return NextResponse.json(meal, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await request.json();

  await prisma.mealPlan.deleteMany({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
