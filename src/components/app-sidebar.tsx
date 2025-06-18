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
  HandshakeIcon,
  ChartNoAxesCombinedIcon,
  ClipboardIcon,
  PackageOpenIcon,
  CalendarCheck2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  ThermometerSnowflake,
  IdCardIcon,
  ClipboardCheckIcon,
  GraduationCapIcon,
  MessageSquareDot,
  BuildingIcon,
  BellIcon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserPermissions } from "@/hooks/useUserPermissions";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

// Menu items for the dashboard
const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: HomeIcon,
  },
  {
    title: "Flight Records",
    url: "/dashboard/flight-records",
    icon: PlaneIcon,
  },
  {
    title: "Stock Inventory",
    url: "/dashboard/stock-inventory",
    icon: PackageOpenIcon,
  },
  {
    title: "Incoming Inspections",
    url: "/dashboard/incoming-inspections",
    icon: ClipboardCheckIcon,
  },
  {
    title: "Temperature Control",
    url: "/dashboard/temperature-control",
    icon: ThermometerSnowflake,
  },
  {
    title: "Technical Queries",
    url: "/dashboard/technical-queries",
    icon: MessageSquareDot,
  },
  {
    title: "Work Order Management",
    url: "/dashboard/work-orders",
    icon: CalendarCheck2Icon,
  },

  {
    title: "Airport ID",
    url: "/dashboard/airport-id",
    icon: IdCardIcon,
  },
  {
    title: "Technician Training",
    url: "/dashboard/technician-training",
    icon: GraduationCapIcon,
  },
  {
    title: "Audits Management",
    url: "/dashboard/audits-management",
    icon: ShieldAlertIcon,
  },
  {
    title: "SMS Reports",
    url: "/dashboard/sms-reports",
    icon: FileSpreadsheetIcon,
  },
  {
    title: "Service Difficulty Reports",
    url: "/dashboard/sdr-reports",
    icon: TriangleAlertIcon,
  },
  {
    title: "Customer & Vendor",
    url: "/dashboard/customers-vendors",
    icon: HandshakeIcon,
  },
  {
    title: "Gantt Chart Schedule",
    url: "/dashboard/gantt-chart-schedule",
    icon: ChartNoAxesCombinedIcon,
  },
  {
    title: "Data Analytics",
    url: "/dashboard/data-analytics",
    icon: BarChart3Icon,
  },
  {
    title: "Forms Creation",
    url: "/dashboard/forms-creation",
    icon: FileTextIcon,
  },
  {
    title: "Log Pages",
    url: "/dashboard/log-pages",
    icon: FileTextIcon,
  },
  {
    title: "Company Reports",
    url: "/dashboard/company-reports",
    icon: ClipboardIcon,
  },
  {
    title: "Notification Center",
    url: "/dashboard/notification-center",
    icon: BellIcon,
  },
  {
    title: "Technical Publications",
    url: "/dashboard/document-management",
    icon: FileTextIcon,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile, isMobile } = useSidebar();
  const { data: session } = useSession();
  const { permissions } = useUserPermissions();
  const [safetyExpanded, setSafetyExpanded] = useState(false);
  const [employeeExpanded, setEmployeeExpanded] = useState(false);
  const [businessExpanded, setBusinessExpanded] = useState(false);
  const [documentationExpanded, setDocumentationExpanded] = useState(false);
  const [systemExpanded, setSystemExpanded] = useState(false);
  const [operationsExpanded, setOperationsExpanded] = useState(false);

  // Filter menu items based on permissions
  const getFilteredMenuItems = (items: string[]) => {
    return items.filter(itemTitle => {
      // If it's Flight Records, check the permission
      if (itemTitle === "Flight Records") {
        return permissions?.canViewFlightRecords ?? true;
      }
      // If it's Stock Inventory, check the permission
      if (itemTitle === "Stock Inventory") {
        return permissions?.canViewStockInventory ?? true;
      }
      // If it's Incoming Inspections, check the permission
      if (itemTitle === "Incoming Inspections") {
        return permissions?.canViewIncomingInspections ?? false;
      }
      // If it's Audits Management, check the permission
      if (itemTitle === "Audits Management") {
        return permissions?.canSeeAuditManagement ?? false;
      }
      // For other items, always show them
      return true;
    });
  };

  // Update data-sidebar-expanded attribute based on sidebar width
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const sidebar = entries[0];
      const mainContent = document.querySelector('[data-sidebar-expanded]');
      if (mainContent && sidebar) {
        const isExpanded = sidebar.contentRect.width > 64; // Collapsed sidebar is usually 64px or less
        mainContent.setAttribute('data-sidebar-expanded', isExpanded.toString());
      }
    });

    const sidebarElement = document.querySelector('.sidebar');
    if (sidebarElement) {
      observer.observe(sidebarElement);
    }

    return () => observer.disconnect();
  }, []);

  // Function to handle navigation link clicks and close mobile sidebar
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className="border-r border-border sidebar">
      <SidebarHeader className="px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={handleLinkClick}>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <span className="text-sm font-bold text-primary-foreground">ML</span>
          </div>
          <span className="font-bold text-lg">MRO Logix</span>
        </Link>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {/* Main Navigation */}
        <SidebarGroup className="py-1">
          <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-md px-2 py-1 flex items-center gap-2">
            <HomeIcon className="h-4 w-4 text-indigo-500" />
            <SidebarGroupLabel className="uppercase font-medium">Main Navigation</SidebarGroupLabel>
          </div>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems
                .filter(item => item.title === "Dashboard")
                .map((item) => {
                  const isActive = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url} onClick={handleLinkClick}>
                          <item.icon className="h-4 w-4" strokeWidth={1} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Operations Group - Now Collapsible */}
        <SidebarGroup className="py-1">
          <div 
            className="flex items-center justify-between cursor-pointer px-2 py-1 hover:bg-sidebar-accent/50 bg-blue-50 dark:bg-blue-950/30"
            onClick={() => setOperationsExpanded(!operationsExpanded)}
          >
            <div className="flex items-center gap-2">
              <PlaneIcon className="h-4 w-4 text-blue-500" />
              <SidebarGroupLabel className="cursor-pointer uppercase font-medium">Operations</SidebarGroupLabel>
            </div>
            {operationsExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${operationsExpanded ? 'max-h-96' : 'max-h-0'}`}
          >
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems
                  .filter(item => getFilteredMenuItems(["Flight Records", "Stock Inventory", "Incoming Inspections", "Temperature Control", "Technical Queries"]).includes(item.title))
                  .map((item) => {
                    const isActive = pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.url} onClick={handleLinkClick}>
                            <item.icon className="h-4 w-4" strokeWidth={1} />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </div>
        </SidebarGroup>

        {/* Safety Group - Collapsible */}
        <SidebarGroup className="py-1">
          <div 
            className="flex items-center justify-between cursor-pointer px-2 py-1 hover:bg-sidebar-accent/50 bg-red-50 dark:bg-red-950/30"
            onClick={() => setSafetyExpanded(!safetyExpanded)}
          >
            <div className="flex items-center gap-2">
              <ShieldAlertIcon className="h-4 w-4 text-red-500" />
              <SidebarGroupLabel className="cursor-pointer uppercase font-medium">Safety</SidebarGroupLabel>
            </div>
            {safetyExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${safetyExpanded ? 'max-h-96' : 'max-h-0'}`}
          >
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems
                  .filter(item => ["Audits Management", "SMS Reports", "Service Difficulty Reports"].includes(item.title))
                  .filter(item => getFilteredMenuItems([item.title]).includes(item.title))
                  .map((item) => {
                    const isActive = pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.url} onClick={handleLinkClick}>
                            <item.icon className="h-4 w-4" strokeWidth={1} />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </div>
        </SidebarGroup>

        {/* Employee Group - Collapsible */}
        <SidebarGroup className="py-1">
          <div 
            className="flex items-center justify-between cursor-pointer px-2 py-1 hover:bg-sidebar-accent/50 bg-purple-50 dark:bg-purple-950/30"
            onClick={() => setEmployeeExpanded(!employeeExpanded)}
          >
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-purple-500" />
              <SidebarGroupLabel className="cursor-pointer uppercase font-medium">Employee</SidebarGroupLabel>
            </div>
            {employeeExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${employeeExpanded ? 'max-h-96' : 'max-h-0'}`}
          >
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems
                  .filter(item => ["Airport ID", "Technician Training"].includes(item.title))
                  .map((item) => {
                    const isActive = pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.url} onClick={handleLinkClick}>
                            <item.icon className="h-4 w-4" strokeWidth={1} />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </div>
        </SidebarGroup>

        {/* Business Group - Collapsible */}
        <SidebarGroup className="py-1">
          <div 
            className="flex items-center justify-between cursor-pointer px-2 py-1 hover:bg-sidebar-accent/50 bg-emerald-50 dark:bg-emerald-950/30"
            onClick={() => setBusinessExpanded(!businessExpanded)}
          >
            <div className="flex items-center gap-2">
              <BarChart3Icon className="h-4 w-4 text-emerald-500" />
              <SidebarGroupLabel className="cursor-pointer uppercase font-medium">Business</SidebarGroupLabel>
            </div>
            {businessExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${businessExpanded ? 'max-h-96' : 'max-h-0'}`}
          >
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems
                  .filter(item => ["Work Order Management", "Customer & Vendor", "Data Analytics", "Gantt Chart Schedule", "Company Reports", "Notification Center"].includes(item.title))
                  .map((item) => {
                    const isActive = pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.url} onClick={handleLinkClick}>
                            <item.icon className="h-4 w-4" strokeWidth={1} />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </div>
        </SidebarGroup>

        {/* Documentation Group - Collapsible */}
        <SidebarGroup className="py-1">
          <div 
            className="flex items-center justify-between cursor-pointer px-2 py-1 hover:bg-sidebar-accent/50 bg-amber-50 dark:bg-amber-950/30"
            onClick={() => setDocumentationExpanded(!documentationExpanded)}
          >
            <div className="flex items-center gap-2">
              <FileTextIcon className="h-4 w-4 text-amber-500" />
              <SidebarGroupLabel className="cursor-pointer uppercase font-medium">Documentation</SidebarGroupLabel>
            </div>
            {documentationExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${documentationExpanded ? 'max-h-96' : 'max-h-0'}`}
          >
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems
                  .filter(item => ["Forms Creation", "Log Pages", "Technical Publications"].includes(item.title))
                  .map((item) => {
                    const isActive = pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link href={item.url} onClick={handleLinkClick}>
                            <item.icon className="h-4 w-4" strokeWidth={1} />
                            <span>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
              </SidebarMenu>
            </SidebarGroupContent>
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 text-xs text-muted-foreground">
        <div className="flex flex-col space-y-1">
          {session?.user?.companyName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <BuildingIcon className="h-3 w-3" />
              <span className="font-medium uppercase">{session.user.companyName}</span>
            </div>
          )}
          <p>&copy; V.1.2 Beta 18-Jun-25 / 8:38 a. m.</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}