import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { redirect } from "next/navigation";
import { UserManagementList } from "./UserManagementList";
import { Users } from "lucide-react";

export default async function ManageUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/dashboard");
  }

  if (session.user.privilege !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto py-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Users className="h-6 w-6 text-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Manage Users</h1>
          <p className="text-sm text-muted-foreground">
            View and manage user accounts for your organization
          </p>
        </div>
      </div>

      {/* User Management List */}
      <UserManagementList />
    </div>
  );
}