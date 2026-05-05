"use client";

import { useState } from "react";
import { Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditDialog } from "./edit-dialog";

interface IngredientHeaderProps {
  ingredient: { id: string; name: string; category: string };
  recipeCount: number;
  isAdmin: boolean;
}

export function IngredientHeader({
  ingredient,
  recipeCount,
  isAdmin,
}: IngredientHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{ingredient.name}</h1>
            <Badge variant="secondary">{ingredient.category}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Used in {recipeCount} recipe(s)
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            size="default"
            onClick={() => setEditOpen(true)}
          >
            <Edit className="mr-1 h-4 w-4" />
            Edit
          </Button>
        )}
      </div>

      {isAdmin && (
        <EditDialog
          ingredient={ingredient}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </div>
  );
}
