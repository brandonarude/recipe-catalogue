"use client";

import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { ImportForm } from "@/components/recipes/import-form";
import { RecipeForm } from "@/components/recipes/recipe-form";
import type { RecipeCreateInput } from "@/lib/validators/recipe";

export default function ImportRecipePage() {
  const [imported, setImported] = useState<Partial<RecipeCreateInput> | null>(null);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold">Import Recipe from URL</h1>
      <ImportForm onImported={setImported} />

      {imported && (
        <>
          <Separator className="my-6" />
          <h2 className="mb-4 text-lg font-semibold">Review & Save</h2>
          <RecipeForm defaultValues={imported} />
        </>
      )}
    </div>
  );
}
