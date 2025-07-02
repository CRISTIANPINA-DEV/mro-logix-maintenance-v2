"use client";

import { useState, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, User, Settings, DatabaseIcon, ActivityIcon, CircleUserRound, Bell, HelpCircle, Book, Wrench, MessageSquare, Globe, LayoutDashboard, Plane, Shield, HomeIcon, Search } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { signOut, useSession } from "next-auth/react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { useNotifications } from "@/contexts/NotificationContext";

// Menu items for search functionality - only include pages that actually exist
const searchableMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: "HomeIcon" },
  { title: "Flight Records", url: "/dashboard/flight-records", icon: "PlaneIcon" },
  { title: "Stock Inventory", url: "/dashboard/stock-inventory", icon: "PackageOpenIcon" },
  { title: "Incoming Inspections", url: "/dashboard/incoming-inspections", icon: "ClipboardCheckIcon" },
  { title: "Temperature Control", url: "/dashboard/temperature-control", icon: "ThermometerSnowflake" },
  { title: "Technical Queries", url: "/dashboard/technical-queries", icon: "MessageSquareDot" },
  { title: "Airport ID", url: "/dashboard/airport-id", icon: "IdCardIcon" },
  { title: "Audits Management", url: "/dashboard/audits-management", icon: "ShieldAlertIcon" },
  { title: "SMS Reports", url: "/dashboard/sms-reports", icon: "FileSpreadsheetIcon" },
  { title: "Service Difficulty Reports", url: "/dashboard/sdr-reports", icon: "TriangleAlertIcon" },
  { title: "Data Analytics", url: "/dashboard/data-analytics", icon: "BarChart3Icon" },
  { title: "Log Pages", url: "/dashboard/log-pages", icon: "FileTextIcon" },
  { title: "Manage Data Records", url: "/dashboard/manage-data-records", icon: "DatabaseIcon" },
  { title: "User Activity", url: "/dashboard/user-activity", icon: "ActivityIcon" },
  { title: "Technician Training", url: "/dashboard/technician-training", icon: "GraduationCapIcon" },
  { title: "Technical Publications", url: "/dashboard/technical-publications", icon: "FileTextIcon" },
  { title: "Notification Center", url: "/dashboard/notification-center", icon: "Bell" },
  { title: "Organization", url: "/dashboard/organization", icon: "User" },
  { title: "Oil Consumption", url: "/dashboard/oil-consumption", icon: "Settings" },
  { title: "Wheel Rotation", url: "/dashboard/wheel-rotation", icon: "Settings" },
  { title: "Weather", url: "/dashboard/weather", icon: "Cloud" },
  { title: "Useful Links", url: "/dashboard/useful-links", icon: "Globe" },
  { title: "Fleet Analytics", url: "/dashboard/fleet-analytics", icon: "Plane" },
];

export default function DashboardHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { unreadCount } = useNotifications();
  
  // Debug log
  console.log("Header session data:", {
    privilege: session?.user?.privilege,
    user: session?.user,
  });

  // Filter search results based on query
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchableMenuItems.filter(item =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 6); // Limit to 6 results
  }, [searchQuery]);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchResults(value.trim().length > 0);
  };

  // Handle search result click
  const handleSearchResultClick = (url: string) => {
    router.push(url);
    setSearchQuery("");
    setShowSearchResults(false);
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    if (searchQuery.trim()) {
      setShowSearchResults(true);
    }
  };

  // Handle search input blur (with delay to allow click on results)
  const handleSearchBlur = () => {
    setTimeout(() => {
      setShowSearchResults(false);
    }, 150);
  };



  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      
      // Call the API to log the activity first
      await fetch("/api/signout", {
        method: "POST",
      });
      
      // Then sign out using NextAuth
      await signOut({ 
        callbackUrl: "/signin",
        redirect: true 
      });
      
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out");
    } finally {
      setSigningOut(false);
      setShowSignOutDialog(false);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-background border-b border-border sticky top-0 z-40 w-full">
      <div className="w-full max-w-full mx-auto px-3">
        <div className="flex h-12 items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="flex size-6 mr-1" />
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm text-muted-foreground">
                @{session?.user?.username || session?.user?.firstName || 'User'}
              </span>
              <span className={`text-xs px-2 py-0.5 border rounded-sm font-medium uppercase tracking-wide ${
                session?.user?.privilege === 'admin' 
                  ? 'bg-background text-blue-700 border-blue-200 dark:border-blue-800 dark:text-blue-400'
                  : 'bg-background text-gray-700 border-gray-200 dark:border-gray-800 dark:text-gray-400'
              }`}>
                {session?.user?.privilege === 'admin' ? 'Admin' : 'User'}
              </span>
              {/* Add Dashboard button in mobile view */}
              <Link 
                href="/dashboard" 
                className="md:hidden inline-flex items-center justify-center h-6 px-2 text-xs font-medium bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border border-black/20 dark:border-black/40 rounded-md gap-1"
              >
                <HomeIcon className="h-3 w-3" />
                Dashboard
              </Link>
            </div>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                placeholder="Search modules..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                className="w-full h-8 pl-10 pr-4 text-xs bg-background border border-input rounded-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder-muted-foreground"
              />
              {/* Search Results Dropdown */}
              {showSearchResults && filteredResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-none shadow-lg z-50 max-h-64 overflow-y-auto">
                  {filteredResults.map((item) => (
                    <button
                      key={item.url}
                      onClick={() => handleSearchResultClick(item.url)}
                      className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-2 text-xs"
                    >
                      <Search className="h-3 w-3 text-muted-foreground" />
                      <span className="truncate">{item.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border border-black/20 dark:border-black/40 rounded-md gap-1"
            >
              <HomeIcon className="h-3 w-3" />
              Dashboard
            </Link>
            <Link 
              href="/dashboard/fleet-analytics" 
              className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium bg-background hover:bg-accent border border-input rounded-md gap-1"
            >
              <Plane className="h-3 w-3" />
              Aircraft
            </Link>
            <Link 
              href="/dashboard/useful-links" 
              className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium bg-background hover:bg-accent border border-input rounded-md gap-1"
            >
              <Globe className="h-3 w-3" />
              Useful Links
            </Link>

            {/* Buttons Group */}
            <div className="hidden md:flex items-center gap-1">
              {/* Help Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="relative cursor-pointer flex items-center gap-1 h-8 bg-background hover:bg-accent border border-input"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span className="text-xs">Help</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel>Support Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    <span>Troubleshooting</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2">
                    <Book className="h-4 w-4" />
                    <span>Documentation</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Contact Support</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications Button */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="relative cursor-pointer flex items-center gap-1 h-8 bg-background hover:bg-accent border border-input"
                  >
                    <Bell className="h-4 w-4" />
                    <span className="text-xs">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[380px]" align="end" forceMount>
                  <NotificationPanel />
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="relative cursor-pointer flex items-center gap-1 h-8 bg-background hover:bg-accent border border-input"
                  >
                    <CircleUserRound className="h-4 w-4" />
                    <span className="text-xs">Profile</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session?.user?.firstName} {session?.user?.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {session?.user?.email}
                      </p>
                      {session?.user?.username && (
                        <p className="text-xs text-muted-foreground">
                          @{session.user.username}
                        </p>
                      )}
                      {session?.user?.companyName && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-xs text-muted-foreground font-medium">
                            {session.user.companyName}
                          </span>
                        </div>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/account-settings" className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Account Settings
                    </Link>
                  </DropdownMenuItem>
                  {session?.user?.privilege === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard/administration" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Administration
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/organization" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Your Organization
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/manage-data-records" className="flex items-center gap-2">
                      <DatabaseIcon className="h-4 w-4" />
                      Manage Data Records
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/user-activity" className="flex items-center gap-2">
                      <ActivityIcon className="h-4 w-4" />
                      User Activity
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>Dark Mode</span>
                    </span>
                    <ThemeToggle />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    variant="destructive"
                    onClick={() => setShowSignOutDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 bg-background hover:bg-accent border border-input" 
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-border w-full">
          <div className="w-full max-w-full mx-auto px-4 py-4 space-y-2">
            <Link 
              href="/dashboard" 
              className="flex items-center justify-center h-8 px-3 text-xs font-medium bg-background hover:bg-accent border border-input rounded-md gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <LayoutDashboard className="h-3 w-3" />
              Dashboard
            </Link>
            <Link 
              href="/dashboard/fleet-analytics" 
              className="flex items-center justify-center h-8 px-3 text-xs font-medium bg-background hover:bg-accent border border-input rounded-md gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Plane className="h-3 w-3" />
              Aircraft
            </Link>
            <Link 
              href="/dashboard/useful-links" 
              className="flex items-center justify-center h-8 px-3 text-xs font-medium bg-background hover:bg-accent border border-input rounded-md gap-2"
              onClick={() => setIsMenuOpen(false)}
            >
              <Globe className="h-3 w-3" />
              Useful Links
            </Link>

            
            {/* Mobile User Section */}
            <div className="border-t border-border pt-4 mt-4">
              <div className="flex flex-col space-y-1 py-2">
                <span className="text-sm font-medium">
                  {session?.user?.firstName} {session?.user?.lastName}
                </span>
                <span className="text-xs text-muted-foreground">
                  {session?.user?.email}
                </span>
                {session?.user?.username && (
                  <span className="text-xs text-muted-foreground">
                    @{session.user.username}
                  </span>
                )}
                {session?.user?.companyName && (
                  <span className="text-xs text-muted-foreground font-medium">
                    {session.user.companyName}
                  </span>
                )}
              </div>
              <Link 
                href="/dashboard/account-settings" 
                className="block py-2 text-sm font-medium hover:text-primary flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Account Settings
              </Link>
              {session?.user?.privilege === "admin" && (
                <Link 
                  href="/dashboard/administration" 
                  className="block py-2 text-sm font-medium hover:text-primary flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Shield className="h-4 w-4" />
                  Administration
                </Link>
              )}
              <Link 
                href="/dashboard/organization" 
                className="block py-2 text-sm font-medium hover:text-primary flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                Your Organization
              </Link>
              <Link 
                href="/dashboard/manage-data-records" 
                className="block py-2 text-sm font-medium hover:text-primary flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <DatabaseIcon className="h-4 w-4" />
                Manage Data Records
              </Link>
              <Link 
                href="/dashboard/user-activity" 
                className="block py-2 text-sm font-medium hover:text-primary flex items-center gap-2"
                onClick={() => setIsMenuOpen(false)}
              >
                <ActivityIcon className="h-4 w-4" />
                User Activity
              </Link>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">Dark Mode</span>
                <ThemeToggle />
              </div>
            </div>
            
            <Button 
              variant="outline" 
              className="flex items-center gap-2 w-full mt-4"
              onClick={() => setShowSignOutDialog(true)}
            >
              Sign out <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Sign Out Dialog */}
      <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <DialogContent className="sm:max-w-md rounded-none">
          <DialogHeader>
            <DialogTitle>Sign out confirmation</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out of your account?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSignOutDialog(false)}
              className="bg-background hover:bg-accent border border-input"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSignOut}
              disabled={signingOut}
              variant="default"
              size="sm"
              className="ml-2"
            >
              {signingOut ? "Signing out..." : "Sign out"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
} 