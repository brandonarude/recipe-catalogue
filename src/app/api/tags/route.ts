import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q") || "";

  const tags = await prisma.tag.findMany({
    where: q.length > 0
      ? { name: { contains: q.toLowerCase(), mode: "insensitive" } }
      : undefined,
    take: 20,
    orderBy: { name: "asc" },
  });

  return NextResponse.json(tags);
}
