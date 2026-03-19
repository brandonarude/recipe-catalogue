"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Shield, Trash2, UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  _count: { recipes: number };
}

interface UserTableProps {
  users: User[];
  currentUserId: string;
  onRefresh: () => void;
}

export function UserTable({ users, currentUserId, onRefresh }: UserTableProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function changeRole(userId: string, role: string) {
    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("Role updated");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setLoading(null);
    }
  }

  async function removeUser(userId: string) {
    setLoading(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      toast.success("User removed");
      onRefresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove user");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-center">Recipes</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell>
              <div>
                <p className="font-medium">{user.name || "—"}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                {user.role === "ADMIN" ? (
                  <Shield className="mr-1 h-3 w-3" />
                ) : (
                  <UserIcon className="mr-1 h-3 w-3" />
                )}
                {user.role}
              </Badge>
            </TableCell>
            <TableCell className="text-center">{user._count.recipes}</TableCell>
            <TableCell className="text-right">
              {user.id !== currentUserId && (
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="default"
                    onClick={() =>
                      changeRole(
                        user.id,
                        user.role === "ADMIN" ? "USER" : "ADMIN"
                      )
                    }
                    disabled={loading === user.id}
                  >
                    {user.role === "ADMIN" ? "Demote" : "Promote"}
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={loading === user.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove user?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete {user.email} and all
                          their data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => removeUser(user.id)}
                        >
                          Remove
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
