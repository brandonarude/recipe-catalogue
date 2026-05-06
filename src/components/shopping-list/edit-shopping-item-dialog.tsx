"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toTitleCase } from "@/lib/utils";

interface EditShoppingItemDialogProps {
  item: {
    id: string;
    quantity: number | null;
    unit: string | null;
    ingredient: { name: string };
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (
    itemId: string,
    patch: { quantity: number | null; unit: string | null }
  ) => void;
  onRemoved: (itemId: string) => void;
}

export function EditShoppingItemDialog({
  item,
  open,
  onOpenChange,
  onUpdated,
  onRemoved,
}: EditShoppingItemDialogProps) {
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setQuantity(item.quantity != null ? String(item.quantity) : "");
      setUnit(item.unit ?? "");
    }
  }, [item]);

  function adjustQuantity(delta: number) {
    const current = quantity.trim() === "" ? 0 : parseFloat(quantity);
    if (Number.isNaN(current)) return;
    const next = Math.max(0, current + delta);
    setQuantity(String(next));
  }

  async function handleSave() {
    if (!item) return;

    const trimmedQty = quantity.trim();
    let parsedQty: number | null = null;
    if (trimmedQty !== "") {
      parsedQty = parseFloat(trimmedQty);
      if (Number.isNaN(parsedQty) || parsedQty < 0) {
        toast.error("Quantity must be a non-negative number");
        return;
      }
    }
    const trimmedUnit = unit.trim() || null;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/shopping-list/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: parsedQty, unit: trimmedUnit }),
      });
      if (!res.ok) throw new Error();
      onUpdated(item.id, { quantity: parsedQty, unit: trimmedUnit });
      onOpenChange(false);
    } catch {
      toast.error("Failed to update item");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove() {
    if (!item) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/shopping-list/items/${item.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      onRemoved(item.id);
      onOpenChange(false);
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {item ? toTitleCase(item.ingredient.name) : "Edit item"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-item-qty">Quantity</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => adjustQuantity(-1)}
                disabled={submitting}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="edit-item-qty"
                type="number"
                step="any"
                min="0"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="—"
                className="text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => adjustQuantity(1)}
                disabled={submitting}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-item-unit">Unit</Label>
            <Input
              id="edit-item-unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. cup"
            />
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={handleRemove}
            disabled={submitting}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Remove
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
