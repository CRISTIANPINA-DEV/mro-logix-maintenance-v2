"use client";

import { useState } from "react";
import { UserPrivilegeTable } from "./UserPrivilegeTable";
import { Button } from "@/components/ui/button";
import { Users, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  users: any[];
};

export function UserPrivilegeSection({ users }: Props) {
  const [showTable, setShowTable] = useState(false);

  if (showTable) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">User Privileges</h2>
            <p className="text-sm text-muted-foreground">
              Assign and manage user access levels for your organization
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Total Users:</span>
              <span className="font-medium">{users.length}</span>
            </div>
            <Button 
              variant="outline"
              onClick={() => setShowTable(false)}
            >
              Back
            </Button>
          </div>
        </div>
        <div className="bg-card rounded-lg border">
          <UserPrivilegeTable users={users} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-4">
        <Users className="h-5 w-5 text-muted-foreground" />
        <div>
          <h3 className="font-medium">User Privileges</h3>
          <p className="text-sm text-muted-foreground">
            Manage access levels and permissions for your organization members
          </p>
        </div>
      </div>
      <Button 
        onClick={() => setShowTable(true)}
        size="sm"
        className={cn(
          "ml-8 px-3 h-7 gap-2",
          "bg-amber-100 hover:bg-amber-200",
          "border border-amber-300",
          "text-black text-xs font-medium",
          "rounded-none"
        )}
      >
        <Lock className="h-3 w-3 text-amber-800" />
        Edit User Privileges
      </Button>
    </div>
  );
} 