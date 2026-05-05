"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CATEGORIES = [
  "PRODUCE",
  "DAIRY",
  "MEAT",
  "SEAFOOD",
  "BAKERY",
  "PANTRY",
  "FROZEN",
  "BEVERAGES",
  "CONDIMENTS",
  "SPICES",
  "OTHER",
] as const;

interface EditDialogProps {
  ingredient: { id: string; name: string; category: string };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditDialog({ ingredient, open, onOpenChange }: EditDialogProps) {
  const router = useRouter();
  const [name, setName] = useState(ingredient.name);
  const [category, setCategory] = useState(ingredient.category);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setName(ingredient.name);
      setCategory(ingredient.category);
    }
  }, [open, ingredient.name, ingredient.category]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/ingredients/${ingredient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), category }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update ingredient");
      }
      toast.success("Ingredient updated");
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update ingredient"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit ingredient</DialogTitle>
            <DialogDescription>
              Update the name and category for this ingredient.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="ingredient-name">Name</Label>
              <Input
                id="ingredient-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingredient-category">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => v && setCategory(v)}
              >
                <SelectTrigger id="ingredient-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
