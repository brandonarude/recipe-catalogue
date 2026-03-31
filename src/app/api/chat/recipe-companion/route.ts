import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getClient() {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { recipeId, messages } = body as {
    recipeId: string;
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!recipeId || !messages || messages.length === 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const currentRecipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    include: {
      ingredients: { include: { ingredient: true } },
      tags: { include: { tag: true } },
      dietaryTags: { include: { dietaryTag: true } },
    },
  });

  if (!currentRecipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  // Currently fetching all recipes and filtering in-memory for simplicity. 
  // For larger collections, consider more advanced querying or vector search.
  const allRecipes = await prisma.recipe.findMany({
    where: { id: { not: recipeId } },
    select: {
      id: true,
      title: true,
      description: true,
      tags: { include: { tag: true } },
      dietaryTags: { include: { dietaryTag: true } },
      ingredients: {
        include: { ingredient: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  const recipeCatalogue = allRecipes
    .map((r) => {
      const tags = r.tags.map((t) => t.tag.name).join(", ");
      const dietary = r.dietaryTags.map((d) => d.dietaryTag.name).join(", ");
      const ingredients = r.ingredients
        .map((i) => i.ingredient.name)
        .join(", ");
      let line = `- [RECIPE:${r.id}:${r.title}]`;
      if (r.description) line += ` — ${r.description}`;
      if (tags) line += ` | Tags: ${tags}`;
      if (dietary) line += ` | Dietary: ${dietary}`;
      if (ingredients) line += ` | Ingredients: ${ingredients}`;
      return line;
    })
    .join("\n");

  const currentTags = currentRecipe.tags.map((t) => t.tag.name).join(", ");
  const currentDietary = currentRecipe.dietaryTags
    .map((d) => d.dietaryTag.name)
    .join(", ");
  const currentIngredients = currentRecipe.ingredients
    .map((i) => i.ingredient.name)
    .join(", ");

  const systemPrompt = `You are a culinary assistant for a family recipe app. You help users find companion dishes that pair well together.

The user is currently viewing: "${currentRecipe.title}"
${currentRecipe.description ? `Description: ${currentRecipe.description}` : ""}
${currentTags ? `Tags: ${currentTags}` : ""}
${currentDietary ? `Dietary info: ${currentDietary}` : ""}
${currentIngredients ? `Key ingredients: ${currentIngredients}` : ""}

Here are all available recipes in the user's collection:
${recipeCatalogue}

Rules:
- When recommending a recipe from the collection, ALWAYS use this exact format: [RECIPE:recipe_id:Recipe Name] — this will be rendered as a clickable link.
- Recommend up to 3 companion dishes when relevant. Fewer is fine if there aren't good matches.
- If a good pairing exists but is NOT in the collection above, recommend it anyway but clearly note that there's no recipe available in the collection and the user would need to find one.
- Base recommendations on flavour profiles, cuisine pairings, and complementary textures unless the user specifies dietary needs.
- Be concise and conversational. Keep responses short.
- You can discuss cooking tips, substitutions, or other culinary advice if asked.`;

  try {
    const response = await getClient().chat.completions.create({
      model: "openrouter/free",
      max_tokens: 1024,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
      ],
    });

    const assistantMessage = response.choices[0]?.message?.content ?? "";

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error("Companion chat error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendation" },
      { status: 500 }
    );
  }
}
