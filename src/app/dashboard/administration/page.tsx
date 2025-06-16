import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Shield } from "lucide-react";
import { UserPrivilegeSection } from "./UserPrivilegeSection";
import { SystemStatusSection } from "./SystemStatusSection";

export default async function AdministrationPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/dashboard");
  }

  if (session.user.privilege !== "admin") {
    redirect("/dashboard");
  }

  const users = await prisma.user.findMany({
    where: {
      companyId: session.user.companyId,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      username: true,
      email: true,
      privilege: true,
      createdAt: true,
    },
    orderBy: {
      email: "asc",
    },
  });

  return (
    <div className="container mx-auto py-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-6 w-6 text-foreground" />
        <div>
          <h1 className="text-2xl font-semibold">Administration</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organization settings and user access
          </p>
        </div>
      </div>

      {/* Admin Options Table */}
      <div className="w-full">
        <div className="rounded-md border divide-y">
          <UserPrivilegeSection users={users} />
          <SystemStatusSection />
        </div>
      </div>
    </div>
  );
} 