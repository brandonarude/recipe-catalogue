"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IngredientActions } from "./ingredient-actions";

export interface IngredientItem {
  id: string;
  name: string;
  category: string;
  _count: { recipes: number };
}

interface IngredientListProps {
  ingredients: IngredientItem[];
  isAdmin: boolean;
  onRefresh: () => void;
}

export function IngredientList({
  ingredients,
  isAdmin,
  onRefresh,
}: IngredientListProps) {
  if (ingredients.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No ingredients found.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-center">Recipes</TableHead>
          {isAdmin && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {ingredients.map((ingredient) => (
          <TableRow key={ingredient.id}>
            <TableCell>
              <Link
                href={`/ingredients/${ingredient.id}`}
                className="font-medium hover:underline"
              >
                {ingredient.name}
              </Link>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{ingredient.category}</Badge>
            </TableCell>
            <TableCell className="text-center">
              <Badge variant="outline">{ingredient._count.recipes}</Badge>
            </TableCell>
            {isAdmin && (
              <TableCell className="text-right">
                <IngredientActions
                  ingredient={ingredient}
                  onRefresh={onRefresh}
                />
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
