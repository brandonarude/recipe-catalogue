"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  BookOpen,
  Carrot,
  Heart,
  ShoppingCart,
  CalendarDays,
  Shield,
  LogOut,
  CookingPot,
  Plus,
  Import,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { useState } from "react";
import { ThemeToggle } from "./theme-toggle";

const desktopNavItems = [
  { href: "/", label: "Recipes", icon: BookOpen },
  { href: "/ingredients", label: "Ingredients", icon: Carrot },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/shopping-list", label: "Shopping List", icon: ShoppingCart },
  { href: "/meal-plan", label: "Meal Plan", icon: CalendarDays },
];

const mobileTabItems = [
  { href: "/", label: "Recipes", icon: BookOpen },
  { href: "/favorites", label: "Favorites", icon: Heart },
  { href: "/shopping-list", label: "Shopping", icon: ShoppingCart },
  { href: "/meal-plan", label: "Plan", icon: CalendarDays },
];

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const isAdmin = session?.user?.role === "ADMIN";

  const userInitial =
    session?.user?.name?.[0]?.toUpperCase() ||
    session?.user?.email?.[0]?.toUpperCase() ||
    null;

  return (
    <>
      {/* Top header bar */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <CookingPot className="h-5 w-5 text-primary" />
            <span className="hidden md:inline">Recipe Catalogue</span>
          </Link>

          {/* Mobile avatar menu trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger className="md:hidden">
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                {userInitial || <User className="h-4 w-4" />}
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex flex-col gap-1 pt-4">
                <Link
                  href="/ingredients"
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent",
                    pathname === "/ingredients"
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  <Carrot className="h-5 w-5" />
                  Ingredients
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/users"
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent",
                      pathname === "/admin/users"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    <Shield className="h-5 w-5" />
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground">
                  <span>Theme</span>
                  <ThemeToggle />
                </div>
                <button
                  onClick={() => {
                    setSheetOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent"
                >
                  <LogOut className="h-5 w-5" />
                  Sign out
                </button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {desktopNavItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                  pathname === href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin/users"
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                  pathname === "/admin/users"
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="ml-2 text-muted-foreground"
            >
              <LogOut className="mr-1 h-4 w-4" />
              Sign out
            </Button>
          </nav>
        </div>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {/* First two tabs */}
          {mobileTabItems.slice(0, 2).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-1 text-xs font-medium transition-colors",
                pathname === href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-6 w-6" />
              {label}
            </Link>
          ))}

          {/* Center FAB */}
          <div className="flex flex-1 items-center justify-center">
            <Popover open={fabOpen} onOpenChange={setFabOpen}>
              <PopoverTrigger>
                <button className="flex h-14 w-14 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95">
                  <Plus className="h-7 w-7" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="top" sideOffset={8} className="w-48 p-1">
                <Link
                  href="/recipes/new"
                  onClick={() => setFabOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Plus className="h-4 w-4" />
                  New Recipe
                </Link>
                <Link
                  href="/recipes/import"
                  onClick={() => setFabOpen(false)}
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                >
                  <Import className="h-4 w-4" />
                  Import from URL
                </Link>
              </PopoverContent>
            </Popover>
          </div>

          {/* Last two tabs */}
          {mobileTabItems.slice(2).map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-1 text-xs font-medium transition-colors",
                pathname === href
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-6 w-6" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
