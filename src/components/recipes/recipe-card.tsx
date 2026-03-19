import Link from "next/link";
import Image from "next/image";
import { Clock, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, toTitleCase } from "@/lib/utils";

interface RecipeCardProps {
  recipe: {
    id: string;
    title: string;
    description: string | null;
    cookTime: number | null;
    photos: { url: string }[];
    tags: { tag: { id: string; name: string } }[];
    avgRating: number | null;
    _count: { ratings: number };
  };
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const thumbnail = recipe.photos[0]?.url;

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <Card className="group overflow-hidden shadow-sm transition-shadow hover:shadow-md">
        {thumbnail && (
          <div className="relative aspect-[3/2] bg-muted">
            <Image
              src={thumbnail}
              alt={recipe.title}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        )}
        <CardContent className={cn("p-4", !thumbnail && "border-l-3 border-primary/30")}>
          <h3 className="font-semibold leading-tight line-clamp-1">{recipe.title}</h3>
          {recipe.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {recipe.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {recipe.avgRating != null && (
              <span className="flex items-center gap-0.5">
                <Star className="h-3.5 w-3.5 fill-star-amber text-star-amber" />
                {recipe.avgRating.toFixed(1)}
                <span className="text-[10px]">({recipe._count.ratings})</span>
              </span>
            )}
            {recipe.cookTime != null && (
              <span className="flex items-center gap-0.5">
                <Clock className="h-3.5 w-3.5" />
                {recipe.cookTime}m
              </span>
            )}
          </div>
          {recipe.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {recipe.tags.slice(0, 3).map(({ tag }) => (
                <Badge key={tag.id} variant="secondary" className="text-xs px-1.5 py-0">
                  {toTitleCase(tag.name)}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
