"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Plus, Import } from "lucide-react";

export function RecipePageHeader() {
  return (
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
  );
}
