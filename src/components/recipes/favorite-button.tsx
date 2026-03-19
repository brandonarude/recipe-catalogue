"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FavoriteButtonProps {
  recipeId: string;
  isFavorited: boolean;
}

export function FavoriteButton({ recipeId, isFavorited: initialFavorited }: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [saving, setSaving] = useState(false);

  async function toggleFavorite() {
    setSaving(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/favorite`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const { isFavorited } = await res.json();
      setFavorited(isFavorited);
      toast.success(isFavorited ? "Added to favorites" : "Removed from favorites");
    } catch {
      toast.error("Failed to update favorite");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleFavorite}
      disabled={saving}
      aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn(
          "h-6 w-6 transition-colors",
          favorited ? "fill-favorite-red text-favorite-red" : "text-muted-foreground"
        )}
      />
    </Button>
  );
}
