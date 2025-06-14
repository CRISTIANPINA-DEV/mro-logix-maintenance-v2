import { Badge } from "@/components/ui/badge";
import { Plane, PackageOpen, FileCog, CalendarCheck2, Clock3, BarChart3, GraduationCap, Users, ShieldAlert, FileSpreadsheet, TriangleAlert, Handshake, ChartNoAxesCombined, FileText, DatabaseBackup, Clipboard } from "lucide-react";

export const Features = () => (
  <div className="w-full pt-12 pb-20 lg:pt-12 lg:pb-40">
    <div className="container mx-auto px-4 sm:px-6 md:px-8">
      <div className="flex flex-col gap-10">
        <div className="flex gap-4 flex-col items-start">
          <div>
            <Badge>MRO Logix Maintenance</Badge>
          </div>
          <div className="flex gap-2 flex-col">
            <h2 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular text-left">
              Our most comprehensive features!
            </h2>
            <p className="text-lg max-w-xl lg:max-w-lg leading-relaxed tracking-tight text-muted-foreground  text-left">
            Discover the tools that enhance your MRO organization&apos;s workflow.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          <div className="flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg rounded-md p-4 border border-slate-200 hover:border-indigo-300 hover:bg-background">
            <div className="bg-muted rounded-md aspect-video mb-2 flex items-center justify-center">
              <Plane className="w-20 h-20 text-indigo-600" strokeWidth={0.5} />
            </div>
            <h3 className="text-xl tracking-tight">
              Flight Records
            </h3>
            <p className="text-muted-foreground text-base">
             Efficiently manage and analyze maintenance services for all aircraft fleets
            </p>
          </div>
          <div className="flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg rounded-md p-4 border border-slate-200 hover:border-indigo-300 hover:bg-background">
            <div className="bg-muted rounded-md aspect-video mb-2 flex items-center justify-center">
              <PackageOpen className="w-20 h-20 text-indigo-600" strokeWidth={0.5} />
            </div>
            <h3 className="text-xl tracking-tight">Stock Inventory</h3>
            <p className="text-muted-foreground text-base">
             Optimize inventory management with real-time tracking and analysis
            </p>
          </div>
          <div className="flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg rounded-md p-4 border border-slate-200 hover:border-indigo-300 hover:bg-background">
            <div className="bg-muted rounded-md aspect-video mb-2 flex items-center justify-center">
              <FileCog className="w-20 h-20 text-indigo-600" strokeWidth={0.5} />
            </div>
            <h3 className="text-xl tracking-tight">Aircraft Parts Cycle Tracking</h3>
            <p className="text-muted-foreground text-base">
             Real-time tracking of parts flight cycle and hours cycle
            </p>
          </div>
          <div className="flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg rounded-md p-4 border border-slate-200 hover:border-indigo-300 hover:bg-background">
            <div className="bg-muted rounded-md aspect-video mb-2 flex items-center justify-center">
              <CalendarCheck2 className="w-20 h-20 text-indigo-600" strokeWidth={0.5} />
            </div>
            <h3 className="text-xl tracking-tight">Work Order Management</h3>
            <p className="text-muted-foreground text-base">
             Streamline work order processes from creation to closure for efficient maintenance operations
            </p>
          </div>
          <div className="flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg rounded-md p-4 border border-slate-200 hover:border-indigo-300 hover:bg-background">
            <div className="bg-muted rounded-md aspect-video mb-2 flex items-center justify-center">
              <GraduationCap className="w-20 h-20 text-indigo-600" strokeWidth={0.5} />
            </div>
            <h3 className="text-xl tracking-tight">Technician Training</h3>
            <p className="text-muted-foreground text-base">
             Manage technician training ensuring compliance with requirements
            </p>
          </div>
          <div className="flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg rounded-md p-4 border border-slate-200 hover:border-indigo-300 hover:bg-background">
            <div className="bg-muted rounded-md aspect-video mb-2 flex items-center justify-center">
              <Users className="w-20 h-20 text-indigo-600" strokeWidth={0.5} />
            </div>
            <h3 className="text-xl tracking-tight">Employee Roster</h3>
            <p className="text-muted-foreground text-base">
             Manage technician rosters and qualifications across all units and fleets
            </p>
          </div>
          <div className="flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg rounded-md p-4 border border-slate-200 hover:border-indigo-300 hover:bg-background">
            <div className="bg-muted rounded-md aspect-video mb-2 flex items-center justify-center">
              <Clock3 className="w-20 h-20 text-indigo-600" strokeWidth={0.5} />
            </div>
            <h3 className="text-xl tracking-tight">Employee Shifts</h3>
            <p className="text-muted-foreground text-base">
              Manage employee shifts and availability for efficient scheduling
            </p>
          </div>
          <div className="flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg rounded-md p-4 border border-slate-200 hover:border-indigo-300 hover:bg-background">
            <div className="bg-muted rounded-md aspect-video mb-2 flex items-center justify-center">
              <ShieldAlert className="w-20 h-20 text-indigo-600" strokeWidth={0.5} />
            </div>
            <h3 className="text-xl tracking-tight">Audits Management</h3>
            <p className="text-muted-foreground text-base">
              Comprehensive audit management system for internal, external, and safety audits
            </p>
          </div>
          <div className="flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg rounded-md p-4 border border-slate-200 hover:border-indigo-300 hover:bg-background">
            <div className="bg-muted rounded-md aspect-video mb-2 flex items-center justify-center">
              <FileSpreadsheet className="w-20 h-20 text-indigo-600" strokeWidth={0.5} />
            </div>
            <h3 className="text-xl tracking-tight">SMS Reports</h3>
            <p className="text-muted-foreground text-base">
              Generate and manage anonymous SMS reports to promote safety culture.
            </p>
          </div>
          <div className="flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg rounded-md p-4 border border-slate-200 hover:border-indigo-300 hover:bg-background">
            <div className="bg-muted rounded-md aspect-video mb-2 flex items-center justify-center">
              <TriangleAlert className="w-20 h-20 text-indigo-600" strokeWidth={0.5} />
            </div>
            <h3 className="text-xl tracking-tight">SDR Reports</h3>
            <p className="text-muted-foreground text-base">
              Real-time tool for incident and risk management focusing on safety
            </p>
          </div>
          <div className="flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg rounded-md p-4 border border-slate-200 hover:border-indigo-300 hover:bg-background">
            <div className="bg-muted rounded-md aspect-video mb-2 flex items-center justify-center">
              <Handshake className="w-20 h-20 text-indigo-600" strokeWidth={0.5} />
            </div>
            <h3 className="text-xl tracking-tight">Customer & Vendor</h3>
            <p className="text-muted-foreground text-base">
              Comprehensive management of customer and vendor relationships, including contracts, invoices, and order tracking
            </p>
          </div>
          <div className="flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg rounded-md p-4 border border-slate-200 hover:border-indigo-300 hover:bg-background">
            <div className="bg-muted rounded-md aspect-video mb-2 flex items-center justify-center">
              <ChartNoAxesCombined className="w-20 h-20 text-indigo-600" strokeWidth={0.5} />
            </div>
            <h3 className="text-xl tracking-tight">Gantt Chart Schedule</h3>
            <p className="text-muted-foreground text-base">
              Visual timeline planning tool for maintenance projects, resource allocation, and compliance with regulations
            </p>
          </div>
          <div className="flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg rounded-md p-4 border border-slate-200 hover:border-indigo-300 hover:bg-background">
            <div className="bg-muted rounded-md aspect-video mb-2 flex items-center justify-center">
              <BarChart3 className="w-20 h-20 text-indigo-600" strokeWidth={0.5} />
            </div>
            <h3 className="text-xl tracking-tight">Data Analytics</h3>
            <p className="text-muted-foreground text-base">
              Leverage advanced analytics for performance and maintenance insights
            </p>
          </div>
          <div className="flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg rounded-md p-4 border border-slate-200 hover:border-indigo-300 hover:bg-background">
            <div className="bg-muted rounded-md aspect-video mb-2 flex items-center justify-center">
              <FileText className="w-20 h-20 text-indigo-600" strokeWidth={0.5} />
            </div>
            <h3 className="text-xl tracking-tight">Forms Creation</h3>
            <p className="text-muted-foreground text-base">
              Design and generate custom forms for all maintenance checks, verifications and audits
            </p>
          </div>
          <div className="flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg rounded-md p-4 border border-slate-200 hover:border-indigo-300 hover:bg-background">
            <div className="bg-muted rounded-md aspect-video mb-2 flex items-center justify-center">
              <DatabaseBackup className="w-20 h-20 text-indigo-600" strokeWidth={0.5} />
            </div>
            <h3 className="text-xl tracking-tight">Doc Storage</h3>
            <p className="text-muted-foreground text-base">
              Centralized document management system for all MRO-related paperwork and records
            </p>
          </div>
          <div className="flex flex-col gap-2 transition-all duration-300 hover:-translate-y-2 hover:shadow-lg rounded-md p-4 border border-slate-200 hover:border-indigo-300 hover:bg-background">
            <div className="bg-muted rounded-md aspect-video mb-2 flex items-center justify-center">
              <Clipboard className="w-20 h-20 text-indigo-600" strokeWidth={0.5} />
            </div>
            <h3 className="text-xl tracking-tight">Reports</h3>
            <p className="text-muted-foreground text-base">
              Generate comprehensive reports for all aspects of the MRO, including inventory, maintenance, and compliance
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);