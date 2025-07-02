import Link from "next/link";
import { Users, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ManageUserSection() {
  return (
    <div className="p-4 hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="font-semibold">Manage Users</h2>
            <p className="text-sm text-muted-foreground">
              View and manage user accounts for your organization
            </p>
          </div>
        </div>
        <Link href="/dashboard/administration/manage-users">
          <Button 
            variant="outline"
            size="sm"
            className={cn(
              "ml-8 px-3 h-7 gap-2",
              "bg-[#e3f2fd] hover:bg-[#bbdefb]",
              "border-[#1976d2]",
              "text-black text-xs font-medium",
              "rounded-none"
            )}
          >
            <Settings className="h-3 w-3 text-[#0d47a1]" />
            Manage Users
          </Button>
        </Link>
      </div>
    </div>
  );
}