"use client";

import { 
  PlaneIcon, 
  BarChart3Icon, 
  FileTextIcon, 
  HomeIcon, 
  Settings2Icon, 
  UsersIcon, 
  Clock3Icon,
  ShieldAlertIcon,
  FileSpreadsheetIcon,
  TriangleAlertIcon,
  HandshakeIcon,
  ChartNoAxesCombinedIcon,
  DatabaseBackupIcon,
  ClipboardIcon,
  PackageOpenIcon,
  FileCogIcon,
  CalendarCheck2Icon,
  ChevronDownIcon,
  ChevronRightIcon,
  ThermometerSnowflake,
  IdCardIcon,
  ClipboardCheckIcon,
  DatabaseIcon,
  ActivityIcon,
  GraduationCapIcon,
  MessageSquareDot
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

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
    title: "Aircraft Parts Cycle",
    url: "/dashboard/aircraft-parts-cycle",
    icon: FileCogIcon,
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
    title: "Employee Roster",
    url: "/dashboard/roster",
    icon: UsersIcon,
  },
  {
    title: "Employee Shifts",
    url: "/dashboard/employee-shifts",
    icon: Clock3Icon,
  },
  {
    title: "Airport ID",
    url: "/dashboard/airport-id",
    icon: IdCardIcon,
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
    title: "AI Chat",
    url: "/dashboard/ai-chat",
    icon: Settings2Icon,
  },
  {
    title: "Manage Data Records",
    url: "/dashboard/manage-data-records",
    icon: DatabaseIcon,
  },
  {
    title: "User Activity",
    url: "/dashboard/user-activity",
    icon: ActivityIcon,
  },
  {
    title: "Technician Training",
    url: "/dashboard/technician-training",
    icon: GraduationCapIcon,
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
  const [safetyExpanded, setSafetyExpanded] = useState(false);
  const [employeeExpanded, setEmployeeExpanded] = useState(false);
  const [businessExpanded, setBusinessExpanded] = useState(false);
  const [documentationExpanded, setDocumentationExpanded] = useState(false);
  const [systemExpanded, setSystemExpanded] = useState(false);
  const [operationsExpanded, setOperationsExpanded] = useState(false);

  // Function to handle navigation link clicks and close mobile sidebar
  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className="border-r border-border">
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
            className="flex items-center justify-between cursor-pointer px-2 py-1 rounded-md hover:bg-sidebar-accent/50 bg-blue-50 dark:bg-blue-950/30"
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
                  .filter(item => ["Flight Records", "Stock Inventory", "Incoming Inspections", "Temperature Control", "Aircraft Parts Cycle", "Technical Queries"].includes(item.title))
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
            className="flex items-center justify-between cursor-pointer px-2 py-1 rounded-md hover:bg-sidebar-accent/50 bg-red-50 dark:bg-red-950/30"
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
            className="flex items-center justify-between cursor-pointer px-2 py-1 rounded-md hover:bg-sidebar-accent/50 bg-purple-50 dark:bg-purple-950/30"
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
                  .filter(item => ["Employee Roster", "Employee Shifts", "Airport ID", "Technician Training"].includes(item.title))
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
            className="flex items-center justify-between cursor-pointer px-2 py-1 rounded-md hover:bg-sidebar-accent/50 bg-emerald-50 dark:bg-emerald-950/30"
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
                  .filter(item => ["Work Order Management", "Customer & Vendor", "Data Analytics", "Gantt Chart Schedule", "Company Reports"].includes(item.title))
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
            className="flex items-center justify-between cursor-pointer px-2 py-1 rounded-md hover:bg-sidebar-accent/50 bg-amber-50 dark:bg-amber-950/30"
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

        {/* System Group - Collapsible */}
        <SidebarGroup className="py-1">
          <div 
            className="flex items-center justify-between cursor-pointer px-2 py-1 rounded-md hover:bg-sidebar-accent/50 bg-slate-50 dark:bg-slate-950/30"
            onClick={() => setSystemExpanded(!systemExpanded)}
          >
            <div className="flex items-center gap-2">
              <Settings2Icon className="h-4 w-4 text-slate-500" />
              <SidebarGroupLabel className="cursor-pointer uppercase font-medium">System</SidebarGroupLabel>
            </div>
            {systemExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div 
            className={`overflow-hidden transition-all duration-300 ease-in-out ${systemExpanded ? 'max-h-96' : 'max-h-0'}`}
          >
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems
                  .filter(item => ["AI Chat", "Manage Data Records", "User Activity", "Settings"].includes(item.title))
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
          <p>&copy; 2025 MRO Logix v1.0.0</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}