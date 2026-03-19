"use client";

import { useState } from "react";
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
  { value: "PRODUCE", label: "Produce" },
  { value: "DAIRY", label: "Dairy" },
  { value: "MEAT", label: "Meat" },
  { value: "SEAFOOD", label: "Seafood" },
  { value: "BAKERY", label: "Bakery" },
  { value: "PANTRY", label: "Pantry" },
  { value: "FROZEN", label: "Frozen" },
  { value: "BEVERAGES", label: "Beverages" },
  { value: "CONDIMENTS", label: "Condiments" },
  { value: "SPICES", label: "Spices" },
  { value: "OTHER", label: "Other" },
] as const;

interface AddIngredientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultName?: string;
  onCreated: (ingredient: { id: string; name: string; category: string }) => void;
}

export function AddIngredientDialog({
  open,
  onOpenChange,
  defaultName = "",
  onCreated,
}: AddIngredientDialogProps) {
  const [name, setName] = useState(defaultName);
  const [category, setCategory] = useState("OTHER");
  const [loading, setLoading] = useState(false);

  // Reset form when dialog opens with a new defaultName
  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setName(defaultName);
      setCategory("OTHER");
    }
    onOpenChange(nextOpen);
  }

  async function handleCreate() {
    if (!name.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), category }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create ingredient");
      }

      const ingredient = await res.json();
      toast.success(`Ingredient "${ingredient.name}" created`);
      onCreated(ingredient);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create ingredient");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New ingredient</DialogTitle>
          <DialogDescription>
            Create a new ingredient to use in recipes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ingredient-name">Name</Label>
            <Input
              id="ingredient-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. chicken breast"
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={(val) => val && setCategory(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleCreate} disabled={!name.trim() || loading}>
            {loading ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
