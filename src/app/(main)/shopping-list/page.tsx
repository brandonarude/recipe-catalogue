"use client";

import { useState } from "react";
import { ShoppingListView } from "@/components/shopping-list/shopping-list-view";
import { RecipeSelector } from "@/components/shopping-list/recipe-selector";

export default function ShoppingListPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Shopping List</h1>
        <RecipeSelector onGenerate={() => setRefreshKey((k) => k + 1)} />
      </div>
      <div className="mt-4">
        <ShoppingListView key={refreshKey} />
      </div>
    </div>
  );
}
