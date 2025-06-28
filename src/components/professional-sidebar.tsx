"use client";

import { 
  PlaneIcon, 
  BarChart3Icon, 
  FileTextIcon, 
  HomeIcon, 
  UsersIcon, 
  ShieldAlertIcon,
  FileSpreadsheetIcon,
  TriangleAlertIcon,
  PackageOpenIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ThermometerSnowflake,
  IdCardIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  MessageSquareDot,
  BuildingIcon,
  BellIcon,
  BookOpenIcon,
  ScrollTextIcon,
  FuelIcon,
  RotateCw,
  Settings,
  User,
  LogOut,
  Menu,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserPermissions } from "@/hooks/useUserPermissions";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Enhanced menu structure with categories
const menuCategories = [
  {
    id: "main",
    title: "Main",
    icon: HomeIcon,
    color: "indigo",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: HomeIcon,
        description: "Overview and metrics"
      }
    ]
  },
  {
    id: "operations",
    title: "Operations",
    icon: PlaneIcon,
    color: "blue",
    items: [
      {
        title: "Flight Records",
        url: "/dashboard/flight-records",
        icon: PlaneIcon,
        description: "Flight operations tracking",
        permission: "canViewFlightRecords"
      },
      {
        title: "Stock Inventory",
        url: "/dashboard/stock-inventory",
        icon: PackageOpenIcon,
        description: "Parts and materials management",
        permission: "canViewStockInventory"
      },
      {
        title: "Incoming Inspections",
        url: "/dashboard/incoming-inspections",
        icon: ClipboardCheckIcon,
        description: "Part inspection workflows",
        permission: "canViewIncomingInspections"
      },
      {
        title: "Temperature Control",
        url: "/dashboard/temperature-control",
        icon: ThermometerSnowflake,
        description: "Environmental monitoring"
      },
      {
        title: "Technical Queries",
        url: "/dashboard/technical-queries",
        icon: MessageSquareDot,
        description: "Q&A and knowledge base"
      },
      {
        title: "Oil Consumption",
        url: "/dashboard/oil-consumption",
        icon: FuelIcon,
        description: "Fluid consumption tracking"
      },
      {
        title: "Wheel Rotation",
        url: "/dashboard/wheel-rotation",
        icon: RotateCw,
        description: "Maintenance scheduling"
      }
    ]
  },
  {
    id: "safety",
    title: "Safety & Compliance",
    icon: ShieldAlertIcon,
    color: "red",
    items: [
      {
        title: "Audits Management",
        url: "/dashboard/audits-management",
        icon: ShieldAlertIcon,
        description: "Audit lifecycle management",
        permission: "canSeeAuditManagement"
      },
      {
        title: "SMS Reports",
        url: "/dashboard/sms-reports",
        icon: FileSpreadsheetIcon,
        description: "Safety management system"
      },
      {
        title: "Service Difficulty Reports",
        url: "/dashboard/sdr-reports",
        icon: TriangleAlertIcon,
        description: "Incident and difficulty reporting"
      }
    ]
  },
  {
    id: "people",
    title: "People & Training",
    icon: UsersIcon,
    color: "purple",
    items: [
      {
        title: "Airport ID",
        url: "/dashboard/airport-id",
        icon: IdCardIcon,
        description: "Personnel identification"
      },
      {
        title: "Technician Training",
        url: "/dashboard/technician-training",
        icon: GraduationCapIcon,
        description: "Training records and certifications"
      }
    ]
  },
  {
    id: "business",
    title: "Business Intelligence",
    icon: BarChart3Icon,
    color: "emerald",
    items: [
      {
        title: "Data Analytics",
        url: "/dashboard/data-analytics",
        icon: BarChart3Icon,
        description: "Reports and insights"
      },
      {
        title: "Notification Center",
        url: "/dashboard/notification-center",
        icon: BellIcon,
        description: "System communications",
        adminOnly: true
      }
    ]
  },
  {
    id: "documentation",
    title: "Documentation",
    icon: FileTextIcon,
    color: "amber",
    items: [
      {
        title: "Log Pages",
        url: "/dashboard/log-pages",
        icon: ScrollTextIcon,
        description: "System and activity logs"
      },
      {
        title: "Technical Publications",
        url: "/dashboard/technical-publications",
        icon: BookOpenIcon,
        description: "Manuals and documentation"
      }
    ]
  }
];

interface ProfessionalSidebarProps {
  className?: string;
}

export function ProfessionalSidebar({ className = "" }: ProfessionalSidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { permissions } = useUserPermissions();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["main", "operations"]) // Default expanded categories
  );

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check permissions for menu items
  const hasPermission = (item: any) => {
    if (item.adminOnly && session?.user?.privilege !== "admin") {
      return false;
    }
    if (item.permission) {
      return permissions?.[item.permission as keyof typeof permissions] ?? false;
    }
    return true;
  };

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(categoryId)) {
        newExpanded.delete(categoryId);
      } else {
        newExpanded.add(categoryId);
      }
      return newExpanded;
    });
  };

  // Color schemes for categories
  const getColorScheme = (color: string) => ({
    bg: `bg-${color}-50 dark:bg-${color}-950/30`,
    text: `text-${color}-600 dark:text-${color}-400`,
    icon: `text-${color}-500`,
    hover: `hover:bg-${color}-100/50 dark:hover:bg-${color}-900/50`,
    border: `border-${color}-200 dark:border-${color}-800`,
    accent: `bg-${color}-500`
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg">
            <span className="text-sm font-bold text-white">ML</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-lg text-foreground truncate">MRO Logix</h1>
              <p className="text-xs text-muted-foreground truncate">Aviation MRO System</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 space-y-2">
        {menuCategories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const visibleItems = category.items.filter(hasPermission);
          
          if (visibleItems.length === 0) return null;

          return (
            <div key={category.id} className="px-3">
              {/* Category Header */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                        isExpanded 
                          ? `bg-${category.color}-50 dark:bg-${category.color}-950/30 text-${category.color}-700 dark:text-${category.color}-300` 
                          : 'hover:bg-accent/50'
                      }`}
                    >
                      <category.icon className={`h-5 w-5 flex-shrink-0 text-${category.color}-500`} />
                      {!isCollapsed && (
                        <>
                          <span className="font-medium text-sm truncate">{category.title}</span>
                          <ChevronRightIcon 
                            className={`h-4 w-4 ml-auto transition-transform duration-200 ${
                              isExpanded ? 'rotate-90' : ''
                            }`} 
                          />
                        </>
                      )}
                    </button>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                      <p>{category.title}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

              {/* Category Items */}
              <div className={`mt-2 space-y-1 transition-all duration-300 ${
                isExpanded || isCollapsed ? 'opacity-100' : 'opacity-0 max-h-0 overflow-hidden'
              }`}>
                {visibleItems.map((item) => {
                  const isActive = pathname === item.url;
                  
                  return (
                    <TooltipProvider key={item.title}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            href={item.url}
                            onClick={() => setIsMobileOpen(false)}
                            className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                              isActive
                                ? `bg-${category.color}-100 dark:bg-${category.color}-950/50 text-${category.color}-700 dark:text-${category.color}-300 shadow-sm border-l-2 border-${category.color}-500`
                                : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground'
                            } ${isCollapsed ? 'justify-center' : ''}`}
                          >
                            <item.icon className={`h-4 w-4 flex-shrink-0 ${
                              isActive ? `text-${category.color}-600` : ''
                            }`} />
                            {!isCollapsed && (
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{item.title}</div>
                                {item.description && (
                                  <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                                )}
                              </div>
                            )}
                            {isActive && !isCollapsed && (
                              <div className={`w-2 h-2 rounded-full bg-${category.color}-500`} />
                            )}
                          </Link>
                        </TooltipTrigger>
                        {isCollapsed && (
                          <TooltipContent side="right">
                            <div>
                              <p className="font-medium">{item.title}</p>
                              {item.description && (
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                              )}
                            </div>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        {session?.user?.companyName && !isCollapsed && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 p-2 rounded-lg bg-accent/30">
            <BuildingIcon className="h-3 w-3 flex-shrink-0" />
            <span className="font-medium uppercase truncate">{session.user.companyName}</span>
          </div>
        )}
        
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground">
            <p className="font-medium">MRO Logix v1.0 Beta</p>
            <p>© 2025 - Aviation MRO System</p>
          </div>
        )}

        {/* Collapse Toggle */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full justify-start gap-2"
          >
            <Menu className="h-4 w-4" />
            {!isCollapsed && <span>Collapse Sidebar</span>}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-40 h-full bg-background border-r border-border transition-all duration-300 ${
          isCollapsed ? 'w-16' : 'w-72'
        } ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${className}`}
      >
        <SidebarContent />
      </aside>

      {/* Content Spacer */}
      <div className={`hidden lg:block transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-72'}`} />
    </>
  );
}