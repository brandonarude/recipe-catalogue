export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Plus, Import } from "lucide-react";
import { RecipeBrowser } from "@/components/recipes/recipe-browser";

export const metadata = { title: "Recipes - Recipe Catalogue" };

export default async function HomePage() {
  const [allTags, allDietaryTags] = await Promise.all([
    prisma.tag.findMany({ orderBy: { name: "asc" } }),
    prisma.dietaryTag.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recipes</h1>
        <div className="flex gap-2">
          <Link
            href="/recipes/import"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <Import className="mr-1 h-4 w-4" />
            Import
          </Link>
          <Link
            href="/recipes/new"
            className={buttonVariants({ size: "sm" })}
          >
            <Plus className="mr-1 h-4 w-4" />
            New Recipe
          </Link>
        </div>
      </div>
      <div className="mt-4">
        <Suspense fallback={<div className="py-12 text-center text-muted-foreground">Loading...</div>}>
          <RecipeBrowser allTags={allTags} allDietaryTags={allDietaryTags} />
        </Suspense>
      </div>
    </div>
  );
}
