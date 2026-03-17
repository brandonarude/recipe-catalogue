import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { scrapeRecipe } from "@/lib/scraper";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await request.json();
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const recipe = await scrapeRecipe(url);
    if (!recipe) {
      return NextResponse.json(
        {
          error: "Could not extract recipe data from this URL",
          sourceUrl: url,
        },
        { status: 422 }
      );
    }
    return NextResponse.json(recipe);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch URL", sourceUrl: url },
      { status: 422 }
    );
  }
}
