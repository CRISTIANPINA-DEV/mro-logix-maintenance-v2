"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActivityIcon, SearchIcon, FilterIcon, RefreshCwIcon, UserIcon, CalendarIcon, ClockIcon, UsersIcon } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  resourceTitle: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: User;
}

interface ActivityData {
  activities: UserActivity[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UserActivityPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ActivityData | null>(null);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all_actions");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("all_resources");
  const [searchTerm, setSearchTerm] = useState("");

  // Check if user is admin
  const isAdmin = session?.user?.privilege === "admin";

  const filteredActivities = useMemo(() => {
    if (!data?.activities) return [];
    
    return data.activities.filter(activity => {
      const matchesSearch = searchTerm === "" || 
        activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (activity.resourceTitle && activity.resourceTitle.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return matchesSearch;
    });
  }, [data?.activities, searchTerm]);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      
      if (actionFilter && actionFilter !== "all_actions") params.append("action", actionFilter);
      if (resourceTypeFilter && resourceTypeFilter !== "all_resources") params.append("resourceType", resourceTypeFilter);

      const response = await fetch(`/api/user-activity?${params}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setData(result.data);
      } else {
        toast.error(result.message || "Failed to fetch user activities");
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Failed to fetch user activities");
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, resourceTypeFilter]);

  useEffect(() => {
    fetchActivities();
  }, [page, actionFilter, resourceTypeFilter, fetchActivities]);

  const getActionBadgeColor = (action: string) => {
    if (action.includes("LOGIN")) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    if (action.includes("LOGOUT")) return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    if (action.includes("ADDED")) return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    if (action.includes("DELETED")) return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    if (action.includes("UPDATED")) return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const getResourceTypeBadge = (resourceType: string | null): string => {
    if (!resourceType) return "";
    
    const colorMap = {
      FLIGHT_RECORD: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
      STOCK_INVENTORY: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
      TEMPERATURE_CONTROL: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
      AIRPORT_ID: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
      INCOMING_INSPECTION: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
      AUTHENTICATION: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-200",
    };
    
    return colorMap[resourceType as keyof typeof colorMap] || "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
  };

  const formatActionText = (action: string) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatResourceType = (resourceType: string | null) => {
    if (!resourceType) return "";
    return resourceType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="container mx-auto p-4 sm:p-4 space-y-4 sm:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-primary/10">
            <ActivityIcon className="h-5 w-5 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-2xl font-bold">My Activity Log</h1>
            <p className="text-sm sm:text-sm text-muted-foreground">Track your personal actions and system activities</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {isAdmin && (
            <Button onClick={() => router.push("/dashboard/user-activity/all-users")} variant="neutral" size="sm" className="w-full sm:w-auto">
              <UsersIcon className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">See Other Users Activity</span>
              <span className="sm:hidden">Other Users</span>
            </Button>
          )}
          <Button onClick={fetchActivities} disabled={loading} variant="neutral" size="sm" className="w-full sm:w-auto">
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3">
          <Card className="rounded-none">
            <CardHeader className="pb-2 sm:pb-2 px-4 sm:px-4 pt-3 sm:pt-3">
              <CardTitle className="text-xs sm:text-xs font-medium text-muted-foreground">Total Activities</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-4 pb-3 sm:pb-3">
              <div className="text-xl sm:text-lg font-bold">{data.pagination.total}</div>
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardHeader className="pb-2 sm:pb-2 px-4 sm:px-4 pt-3 sm:pt-3">
              <CardTitle className="text-xs sm:text-xs font-medium text-muted-foreground">Current Page</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-4 pb-3 sm:pb-3">
              <div className="text-xl sm:text-lg font-bold">{data.pagination.page} of {data.pagination.totalPages}</div>
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardHeader className="pb-2 sm:pb-2 px-4 sm:px-4 pt-3 sm:pt-3">
              <CardTitle className="text-xs sm:text-xs font-medium text-muted-foreground">Records per Page</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-4 pb-3 sm:pb-3">
              <div className="text-xl sm:text-lg font-bold">{data.pagination.limit}</div>
            </CardContent>
          </Card>
          <Card className="rounded-none">
            <CardHeader className="pb-2 sm:pb-2 px-4 sm:px-4 pt-3 sm:pt-3">
              <CardTitle className="text-xs sm:text-xs font-medium text-muted-foreground">Showing</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-4 pb-3 sm:pb-3">
              <div className="text-xl sm:text-lg font-bold">{filteredActivities.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="rounded-none">
        <CardHeader className="pb-3 sm:pb-3 pt-3 sm:pt-3">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-base">
            <FilterIcon className="h-4 w-4 sm:h-4 sm:w-4" />
            Filters & Search
          </CardTitle>
          <CardDescription className="text-sm">Filter activities by action, resource type, or search by keywords</CardDescription>
        </CardHeader>
        <CardContent className="pb-4 sm:pb-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-3">
            <div className="space-y-1.5">
              <label className="text-xs sm:text-xs font-medium">Search</label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm h-9 rounded-none"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs sm:text-xs font-medium">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="text-sm h-9 rounded-none">
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_actions">All Actions</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="ADDED">Added Records</SelectItem>
                  <SelectItem value="DELETED">Deleted Records</SelectItem>
                  <SelectItem value="UPDATED">Updated Records</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs sm:text-xs font-medium">Resource Type</label>
              <Select value={resourceTypeFilter} onValueChange={setResourceTypeFilter}>
                <SelectTrigger className="text-sm h-9 rounded-none">
                  <SelectValue placeholder="All resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_resources">All Resources</SelectItem>
                  <SelectItem value="FLIGHT_RECORD">Flight Records</SelectItem>
                  <SelectItem value="STOCK_INVENTORY">Stock Inventory</SelectItem>
                  <SelectItem value="TEMPERATURE_CONTROL">Temperature Control</SelectItem>
                  <SelectItem value="AIRPORT_ID">Airport ID</SelectItem>
                  <SelectItem value="INCOMING_INSPECTION">Incoming Inspection</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs sm:text-xs font-medium">Actions</label>
              <div className="flex gap-2">
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={() => {
                    setActionFilter("all_actions");
                    setResourceTypeFilter("all_resources");
                    setSearchTerm("");
                  }}
                  className="w-full text-sm h-9"
                >
                  Clear All
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card className="rounded-none">
        <CardHeader className="pb-3 sm:pb-3 pt-3 sm:pt-3">
          <CardTitle className="text-lg sm:text-base">Your Recent Activities</CardTitle>
          <CardDescription className="text-sm">
            {data ? `Showing ${filteredActivities.length} of ${data.pagination.total} of your activities` : "Loading activities..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 sm:px-4 pb-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCwIcon className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground px-4">
              <ActivityIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-base sm:text-sm font-medium">No activities found</p>
              <p className="text-sm">You haven't performed any actions yet, or try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[150px] h-9">User</TableHead>
                    <TableHead className="min-w-[120px] h-9">Action</TableHead>
                    <TableHead className="min-w-[140px] hidden sm:table-cell h-9">Resource</TableHead>
                    <TableHead className="min-w-[200px] hidden md:table-cell h-9">Details</TableHead>
                    <TableHead className="min-w-[150px] h-9">Date & Time</TableHead>
                    <TableHead className="min-w-[120px] hidden lg:table-cell h-9">IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredActivities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="py-2">
                        <div className="flex items-center space-x-2">
                          <div className="h-6 w-6 sm:h-6 sm:w-6 bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <UserIcon className="h-3 w-3 sm:h-3 sm:w-3 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-xs sm:text-xs truncate">
                              {activity.user.firstName} {activity.user.lastName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Badge className={`${getActionBadgeColor(activity.action)} text-xs rounded-none`}>
                          {formatActionText(activity.action)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell py-2">
                        {activity.resourceType && (
                          <Badge variant="outline" className={`${getResourceTypeBadge(activity.resourceType)} text-xs rounded-none`}>
                            {formatResourceType(activity.resourceType)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell py-2">
                        <div className="max-w-xs">
                          {activity.resourceTitle && (
                            <p className="text-xs sm:text-xs font-medium truncate">{activity.resourceTitle}</p>
                          )}
                          {activity.resourceId && (
                            <p className="text-xs text-muted-foreground font-mono truncate">{activity.resourceId}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1 text-xs sm:text-xs">
                            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                            <span>{format(new Date(activity.createdAt), "MMM dd, yyyy")}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                            <ClockIcon className="h-3 w-3" />
                            <span>{format(new Date(activity.createdAt), "HH:mm:ss")}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell py-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {activity.ipAddress || "Unknown"}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <Card className="rounded-none">
          <CardContent className="pt-3 sm:pt-3 pb-3 sm:pb-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1 || loading}
                  className="h-8"
                >
                  Previous
                </Button>
                <span className="text-xs sm:text-xs text-muted-foreground">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(Math.min(data.pagination.totalPages, page + 1))}
                  disabled={page === data.pagination.totalPages || loading}
                  className="h-8"
                >
                  Next
                </Button>
              </div>
              <div className="text-xs sm:text-xs text-muted-foreground text-center sm:text-right">
                Showing {(page - 1) * data.pagination.limit + 1} to{" "}
                {Math.min(page * data.pagination.limit, data.pagination.total)} of {data.pagination.total} activities
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 