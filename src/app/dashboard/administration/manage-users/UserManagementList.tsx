"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserDetailModal } from "./UserDetailModal";
import { 
  User, 
  Shield, 
  UserCheck, 
  UserX, 
  Calendar,
  Activity,
  Mail,
  MoreVertical 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UserData {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  privilege: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    activities: number;
  };
  permissions: any;
}

export function UserManagementList() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users/manage");
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
      } else {
        console.error("Failed to fetch users:", data.message);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUserClick = (user: UserData) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    // Refresh users list in case any changes were made
    fetchUsers();
  };

  const getPrivilegeBadge = (privilege: string) => {
    switch (privilege) {
      case "admin":
        return <Badge variant="destructive" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>;
      case "manager":
        return <Badge variant="secondary" className="flex items-center gap-1">
          <UserCheck className="h-3 w-3" />
          Manager
        </Badge>;
      case "technician":
        return <Badge variant="outline" className="flex items-center gap-1">
          <User className="h-3 w-3" />
          Technician
        </Badge>;
      default:
        return <Badge variant="outline" className="flex items-center gap-1">
          <UserX className="h-3 w-3" />
          Reader Only
        </Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {users.map((user) => (
          <Card
            key={user.id}
            className="cursor-pointer hover:shadow-md transition-shadow duration-200"
            onClick={() => handleUserClick(user)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary/10 p-2">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-medium">
                      {user.firstName} {user.lastName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      @{user.username}
                    </p>
                  </div>
                </div>
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {/* Email */}
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground truncate">
                    {user.email}
                  </span>
                </div>

                {/* Privilege */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  {getPrivilegeBadge(user.privilege)}
                </div>

                {/* Verification Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge 
                    variant={user.verified ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {user.verified ? "Verified" : "Unverified"}
                  </Badge>
                </div>

                {/* Activity Count */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    Activities:
                  </span>
                  <span className="text-sm font-medium">
                    {user._count.activities}
                  </span>
                </div>

                {/* Created Date */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Joined:
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {users.length === 0 && !loading && (
        <div className="text-center py-8">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
          <p className="text-lg font-medium">No users found</p>
          <p className="text-sm text-muted-foreground">
            No users are registered in your organization yet.
          </p>
        </div>
      )}

      {/* User Detail Modal */}
      {showModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}