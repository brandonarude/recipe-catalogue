"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Download, RefreshCw, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

interface ShoppingItem {
  id: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
  ingredient: { id: string; name: string; category: string };
}

interface ShoppingListData {
  id: string;
  items: ShoppingItem[];
  createdAt: string;
}

export function ShoppingListView() {
  const [list, setList] = useState<ShoppingListData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch("/api/shopping-list");
      const data = await res.json();
      setList(data);
    } catch {
      toast.error("Failed to load shopping list");
    } finally {
      setLoading(false);
    }
  }

  async function toggleItem(itemId: string, checked: boolean) {
    try {
      await fetch("/api/shopping-list", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, checked }),
      });
      setList((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((item) =>
            item.id === itemId ? { ...item, checked } : item
          ),
        };
      });
    } catch {
      toast.error("Failed to update item");
    }
  }

  async function handleExport() {
    window.open("/api/shopping-list/export", "_blank");
  }

  async function handleClear() {
    try {
      await fetch("/api/shopping-list", { method: "DELETE" });
      setList(null);
      toast.success("Shopping list cleared");
    } catch {
      toast.error("Failed to clear shopping list");
    }
  }

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading...</div>;
  }

  if (!list || list.items.length === 0) {
    return (
      <div className="py-12 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">
          No shopping list yet. Add ingredients from any recipe to get started.
        </p>
      </div>
    );
  }

  // Group by category
  const grouped = new Map<string, ShoppingItem[]>();
  for (const item of list.items) {
    const cat = item.ingredient.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  const checkedCount = list.items.filter((i) => i.checked).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {checkedCount}/{list.items.length} items checked
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={fetchList}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
          <AlertDialog>
            <AlertDialogTrigger>
              <Button variant="outline" size="sm">
                <Trash2 className="mr-1 h-4 w-4" />
                Clear
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Clear shopping list?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove all items from your shopping list. This action
                  cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={handleClear}>
                  Clear
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {Array.from(grouped.entries()).map(([category, items]) => (
        <div key={category}>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {toTitleCase(category.toLowerCase())}
          </h3>
          <div className="space-y-1">
            {items.map((item) => (
              <label
                key={item.id}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer"
              >
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={(checked) =>
                    toggleItem(item.id, checked === true)
                  }
                />
                <span
                  className={
                    item.checked
                      ? "line-through text-muted-foreground"
                      : "text-sm"
                  }
                >
                  {item.quantity != null && (
                    <strong>{item.quantity}</strong>
                  )}
                  {item.unit && ` ${item.unit}`}
                  {" "}{toTitleCase(item.ingredient.name)}
                </span>
              </label>
            ))}
          </div>
          <Separator className="mt-3" />
        </div>
      ))}
    </div>
  );
}
