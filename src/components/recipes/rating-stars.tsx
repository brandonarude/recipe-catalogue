"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RatingStarsProps {
  recipeId: string;
  avgRating: number | null;
  userRating: number | null;
  ratingCount: number;
  interactive?: boolean;
}

export function RatingStars({
  recipeId,
  avgRating,
  userRating,
  ratingCount,
  interactive = true,
}: RatingStarsProps) {
  const [currentRating, setCurrentRating] = useState(userRating);
  const [hovered, setHovered] = useState(0);
  const [saving, setSaving] = useState(false);

  const displayRating = hovered || currentRating || 0;

  async function handleRate(score: number) {
    if (!interactive || saving) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/recipes/${recipeId}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      });
      if (!res.ok) throw new Error();
      setCurrentRating(score);
      toast.success(`Rated ${score} star${score > 1 ? "s" : ""}`);
    } catch {
      toast.error("Failed to save rating");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive || saving}
            onClick={() => handleRate(star)}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className={cn(
              "p-1.5 md:p-1 transition-colors",
              interactive && "cursor-pointer hover:scale-110"
            )}
          >
            <Star
              className={cn(
                "h-6 w-6",
                star <= displayRating
                  ? "fill-star-amber text-star-amber"
                  : "text-muted-foreground/30"
              )}
            />
          </button>
        ))}
      </div>
      {avgRating != null && (
        <span className="text-sm text-muted-foreground">
          {avgRating.toFixed(1)} ({ratingCount})
        </span>
      )}
    </div>
  );
}
