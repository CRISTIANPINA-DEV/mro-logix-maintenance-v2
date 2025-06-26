"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Menu, X, User, Settings, DatabaseIcon, ActivityIcon, CircleUserRound, Bell, HelpCircle, Book, Wrench, MessageSquare, Globe, LayoutDashboard, Plane, Shield, HomeIcon } from "lucide-react";
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

export default function DashboardHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const { unreadCount } = useNotifications();
  
  // Debug log
  console.log("Header session data:", {
    privilege: session?.user?.privilege,
    user: session?.user,
  });



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