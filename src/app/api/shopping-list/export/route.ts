import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toTitleCase } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await prisma.shoppingList.findUnique({
    where: { userId: session.user.id },
    include: {
      items: {
        where: { checked: false },
        include: { ingredient: true },
        orderBy: { ingredient: { category: "asc" } },
      },
    },
  });

  if (!list || list.items.length === 0) {
    return new Response("Shopping list is empty.", {
      headers: { "Content-Type": "text/plain" },
    });
  }

  // Group by category
  const grouped = new Map<string, typeof list.items>();
  for (const item of list.items) {
    const cat = item.ingredient.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  let text = "Shopping List\n=============\n\n";
  for (const [category, items] of grouped) {
    text += `${toTitleCase(category.toLowerCase())}\n`;
    text += "-".repeat(category.length) + "\n";
    for (const item of items) {
      const qty = item.quantity != null ? `${item.quantity}` : "";
      const unit = item.unit || "";
      text += `- ${qty} ${unit} ${toTitleCase(item.ingredient.name)}`.trim() + "\n";
    }
    text += "\n";
  }

  return new Response(text, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Disposition": "attachment; filename=shopping-list.txt",
    },
  });
}
