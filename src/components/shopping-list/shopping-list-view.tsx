"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Download,
  GripVertical,
  RefreshCw,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  orderIndex: number;
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  );

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

  async function handleDragEnd(category: string, event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (!list) return;

    const categoryItems = list.items
      .filter((i) => i.ingredient.category === category)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    const oldIndex = categoryItems.findIndex((i) => i.id === active.id);
    const newIndex = categoryItems.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(categoryItems, oldIndex, newIndex).map(
      (item, idx) => ({ ...item, orderIndex: idx })
    );
    const reorderedById = new Map(reordered.map((i) => [i.id, i]));

    const previous = list;
    setList({
      ...list,
      items: list.items.map((item) => reorderedById.get(item.id) ?? item),
    });

    try {
      const res = await fetch("/api/shopping-list", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: reordered.map(({ id, orderIndex }) => ({ id, orderIndex })),
        }),
      });
      if (!res.ok) throw new Error("Reorder failed");
    } catch {
      setList(previous);
      toast.error("Failed to reorder items");
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

  // Group by category, then sort within each category by orderIndex
  const grouped = new Map<string, ShoppingItem[]>();
  for (const item of list.items) {
    const cat = item.ingredient.category;
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }
  for (const items of grouped.values()) {
    items.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  const checkedCount = list.items.filter((i) => i.checked).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {checkedCount}/{list.items.length} items checked
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="default" onClick={handleExport}>
            <Download className="mr-1 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="default" onClick={fetchList}>
            <RefreshCw className="mr-1 h-4 w-4" />
            Refresh
          </Button>
          <AlertDialog>
            <AlertDialogTrigger>
              <Button variant="outline" size="default">
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={(event) => handleDragEnd(category, event)}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {items.map((item) => (
                  <SortableShoppingItem
                    key={item.id}
                    item={item}
                    onToggle={toggleItem}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
          <Separator className="mt-3" />
        </div>
      ))}
    </div>
  );
}

interface SortableShoppingItemProps {
  item: ShoppingItem;
  onToggle: (itemId: string, checked: boolean) => void;
}

function SortableShoppingItem({ item, onToggle }: SortableShoppingItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 rounded-md px-2 py-2.5 hover:bg-accent ${
        isDragging ? "z-10 bg-background shadow-lg" : ""
      }`}
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        className="touch-none cursor-grab text-muted-foreground/60 hover:text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      <label className="flex flex-1 items-center gap-3 cursor-pointer">
        <Checkbox
          checked={item.checked}
          onCheckedChange={(checked) => onToggle(item.id, checked === true)}
        />
        <span
          className={
            item.checked
              ? "text-base line-through text-muted-foreground"
              : "text-base"
          }
        >
          {item.quantity != null && <strong>{item.quantity}</strong>}
          {item.unit && ` ${item.unit}`}
          {" "}
          {toTitleCase(item.ingredient.name)}
        </span>
      </label>
    </div>
  );
}
