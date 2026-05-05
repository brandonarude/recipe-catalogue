"use client";

import { useState } from "react";
import { ShoppingListView } from "@/components/shopping-list/shopping-list-view";
import { AddRecipeToList } from "@/components/shopping-list/add-recipe-to-list";
import { AddIngredientToList } from "@/components/shopping-list/add-ingredient-to-list";

export default function ShoppingListPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Shopping List</h1>
        <div className="flex gap-2">
          <AddIngredientToList onAdded={refresh} />
          <AddRecipeToList onAdded={refresh} />
        </div>
      </div>
      <div className="mt-4">
        <ShoppingListView key={refreshKey} />
      </div>
    </div>
  );
}
