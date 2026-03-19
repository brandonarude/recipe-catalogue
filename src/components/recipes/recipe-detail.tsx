"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Clock, Edit, Trash2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toTitleCase } from "@/lib/utils";
import { PhotoCarousel } from "./photo-carousel";
import { RatingStars } from "./rating-stars";
import { FavoriteButton } from "./favorite-button";
import { ServingsAdjuster } from "./servings-adjuster";

interface RecipeDetailProps {
  recipe: {
    id: string;
    title: string;
    description: string | null;
    steps: string;
    prepTime: number | null;
    cookTime: number | null;
    servings: number;
    notes: string | null;
    sourceUrl: string | null;
    createdBy: { id: string; name: string | null; email: string };
    ingredients: {
      id: string;
      quantity: number | null;
      unit: string | null;
      preparation: string | null;
      ingredient: { id: string; name: string; category: string };
    }[];
    tags: { tag: { id: string; name: string } }[];
    dietaryTags: { dietaryTag: { id: string; name: string } }[];
    photos: { id: string; url: string; order: number }[];
    avgRating: number | null;
    userRating: number | null;
    isFavorited: boolean;
    _count: { ratings: number; favorites: number };
  };
  currentUserId: string;
  isAdmin: boolean;
}

export function RecipeDetail({ recipe, currentUserId, isAdmin }: RecipeDetailProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const steps: string[] = JSON.parse(recipe.steps);
  const canEdit = recipe.createdBy.id === currentUserId || isAdmin;
  const totalTime = (recipe.prepTime || 0) + (recipe.cookTime || 0);

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/recipes/${recipe.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Recipe deleted");
      router.push("/");
    } catch {
      toast.error("Failed to delete recipe");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Photos */}
      <PhotoCarousel photos={recipe.photos} title={recipe.title} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{recipe.title}</h1>
            <FavoriteButton recipeId={recipe.id} isFavorited={recipe.isFavorited} />
          </div>
          {recipe.description && (
            <p className="mt-1 text-muted-foreground">{recipe.description}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            By {recipe.createdBy.name || recipe.createdBy.email}
          </p>
        </div>
        {canEdit && (
          <div className="flex shrink-0 gap-2">
            <Link
              href={`/recipes/${recipe.id}/edit`}
              className={buttonVariants({ variant: "outline", size: "default" })}
            >
              <Edit className="mr-1 h-4 w-4" />
              Edit
            </Link>
            <AlertDialog>
              <AlertDialogTrigger>
                <Button variant="destructive" size="default" disabled={deleting}>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete recipe?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Rating */}
      <RatingStars
        recipeId={recipe.id}
        avgRating={recipe.avgRating}
        userRating={recipe.userRating}
        ratingCount={recipe._count.ratings}
      />

      {/* Meta */}
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {recipe.prepTime != null && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" /> Prep: {recipe.prepTime}m
          </span>
        )}
        {recipe.cookTime != null && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" /> Cook: {recipe.cookTime}m
          </span>
        )}
        {totalTime > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" /> Total: {totalTime}m
          </span>
        )}
      </div>

      {/* Tags */}
      {(recipe.tags.length > 0 || recipe.dietaryTags.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {recipe.tags.map(({ tag }) => (
            <Badge key={tag.id} variant="secondary">
              {toTitleCase(tag.name)}
            </Badge>
          ))}
          {recipe.dietaryTags.map(({ dietaryTag }) => (
            <Badge key={dietaryTag.id} variant="outline">
              {dietaryTag.name}
            </Badge>
          ))}
        </div>
      )}

      <Separator />

      {/* Ingredients with servings adjuster */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Ingredients</h2>
        <ServingsAdjuster
          baseServings={recipe.servings}
          ingredients={recipe.ingredients}
        />
      </div>

      <Separator />

      {/* Steps */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Instructions</h2>
        <ol className="space-y-4">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-base">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {i + 1}
              </span>
              <p className="pt-0.5">{step}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* Notes */}
      {recipe.notes && (
        <>
          <Separator />
          <div>
            <h2 className="mb-2 text-lg font-semibold">Notes</h2>
            <p className="text-base text-muted-foreground whitespace-pre-wrap">
              {recipe.notes}
            </p>
          </div>
        </>
      )}

      {/* Source */}
      {recipe.sourceUrl && (
        <div className="pt-2">
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View original recipe
          </a>
        </div>
      )}
    </div>
  );
}
