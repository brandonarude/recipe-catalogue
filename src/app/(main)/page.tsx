export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { RecipePageHeader } from "@/components/recipes/recipe-page-header";
import { RecipeBrowser } from "@/components/recipes/recipe-browser";

export const metadata = { title: "Recipes - Recipe Catalogue" };

export default async function HomePage() {
  const [allTags, allDietaryTags] = await Promise.all([
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.dietaryTag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <RecipePageHeader />
      <div className="mt-4">
        <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading...</div>}>
          <RecipeBrowser allTags={allTags} allDietaryTags={allDietaryTags} />
        </Suspense>
      </div>
    </div>
  );
}
