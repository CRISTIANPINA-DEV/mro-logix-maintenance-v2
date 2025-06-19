"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { UserPermissionsModal } from "./UserPermissionsModal";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  privilege: string;
  createdAt?: Date;
};

type Props = {
  users: User[];
};

type ConfirmDialogState = {
  isOpen: boolean;
  userId: string;
  userName: string;
  currentPrivilege: string;
  newPrivilege: string;
} | null;

type SortField = 'email' | 'username' | 'firstName' | 'lastName' | 'privilege';
type SortDirection = 'asc' | 'desc';

export function UserPrivilegeTable({ users: initialUsers }: Props) {
  const { data: session } = useSession();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);
  const [sortField, setSortField] = useState<SortField>('email');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [permissionsModal, setPermissionsModal] = useState<{
    isOpen: boolean;
    user: User | null;
  }>({
    isOpen: false,
    user: null,
  });

  const handleSort = (field: SortField) => {
    const newDirection = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);

    const sortedUsers = [...users].sort((a, b) => {
      const aValue = a[field].toLowerCase();
      const bValue = b[field].toLowerCase();
      return newDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

    setUsers(sortedUsers);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  };

  const handlePrivilegeChange = async (userId: string, newPrivilege: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (userId === session?.user?.id) {
      toast.error("You cannot change your own privilege level");
      return;
    }

    setConfirmDialog({
      isOpen: true,
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      currentPrivilege: user.privilege,
      newPrivilege,
    });
  };

  const handleEmailClick = (user: User) => {
    if (user.privilege === "reader-only") {
      setPermissionsModal({
        isOpen: true,
        user,
      });
    }
  };

  const confirmPrivilegeChange = async () => {
    if (!confirmDialog) return;

    try {
      setUpdatingUserId(confirmDialog.userId);
      
      const response = await fetch("/api/users/privilege", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: confirmDialog.userId,
          privilege: confirmDialog.newPrivilege,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to update privilege");
      }

      toast.success("User privilege updated successfully");
      window.location.reload();
    } catch (error) {
      console.error("Error updating privilege:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update user privilege");
    } finally {
      setUpdatingUserId(null);
      setConfirmDialog(null);
    }
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead 
                className="h-9 text-xs font-medium cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-2">
                  email
                  <SortIcon field="email" />
                </div>
              </TableHead>
              <TableHead 
                className="h-9 text-xs font-medium cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('username')}
              >
                <div className="flex items-center gap-2">
                  username
                  <SortIcon field="username" />
                </div>
              </TableHead>
              <TableHead 
                className="h-9 text-xs font-medium cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('firstName')}
              >
                <div className="flex items-center gap-2">
                  firstName
                  <SortIcon field="firstName" />
                </div>
              </TableHead>
              <TableHead 
                className="h-9 text-xs font-medium cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('lastName')}
              >
                <div className="flex items-center gap-2">
                  lastName
                  <SortIcon field="lastName" />
                </div>
              </TableHead>
              <TableHead 
                className="h-9 text-xs font-medium cursor-pointer hover:bg-muted/70"
                onClick={() => handleSort('privilege')}
              >
                <div className="flex items-center gap-2">
                  privilege
                  <SortIcon field="privilege" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50">
                <TableCell className="h-9 py-2 text-sm font-mono">
                  {user.privilege === "reader-only" ? (
                    <button
                      onClick={() => handleEmailClick(user)}
                      className="text-blue-600 hover:text-blue-800 underline cursor-pointer"
                    >
                      {user.email}
                    </button>
                  ) : (
                    user.email
                  )}
                </TableCell>
                <TableCell className="h-9 py-2 text-sm font-mono">{user.username}</TableCell>
                <TableCell className="h-9 py-2 text-sm">{user.firstName}</TableCell>
                <TableCell className="h-9 py-2 text-sm">{user.lastName}</TableCell>
                <TableCell className="h-9 py-2">
                  <Select
                    value={user.privilege}
                    onValueChange={(value) => handlePrivilegeChange(user.id, value)}
                    disabled={updatingUserId === user.id || user.id === session?.user?.id}
                  >
                    <SelectTrigger className="h-7 w-[120px] text-xs">
                      <SelectValue className="truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin" className="text-xs">
                        admin
                      </SelectItem>
                      <SelectItem value="reader-only" className="text-xs whitespace-nowrap">
                        reader-only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={confirmDialog?.isOpen} onOpenChange={() => setConfirmDialog(null)}>
        <DialogContent className="sm:max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle>Confirm Privilege Change</DialogTitle>
            <DialogDescription className="text-red-600">
              Are you sure you want to change {confirmDialog?.userName}&apos;s privilege from{" "}
              <span className="font-medium capitalize">{confirmDialog?.currentPrivilege}</span> to{" "}
              <span className="font-medium capitalize">{confirmDialog?.newPrivilege}</span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDialog(null)}
              disabled={!!updatingUserId}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPrivilegeChange}
              disabled={!!updatingUserId}
              size="sm"
              className="ml-2"
            >
              {updatingUserId ? "Updating..." : "Confirm Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UserPermissionsModal
        isOpen={permissionsModal.isOpen}
        onClose={() => setPermissionsModal({ isOpen: false, user: null })}
        user={permissionsModal.user}
      />
    </>
  );
} 