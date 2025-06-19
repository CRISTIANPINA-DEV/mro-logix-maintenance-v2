import Link from "next/link";
import { Activity, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SystemStatusSection() {
  return (
    <div className="p-4 hover:bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="font-semibold">System Status</h2>
            <p className="text-sm text-muted-foreground">
              View system metrics and database statistics
            </p>
          </div>
        </div>
        <Link href="/dashboard/administration/system-status">
          <Button 
            variant="outline"
            size="sm"
            className={cn(
              "ml-8 px-3 h-7 gap-2",
              "bg-[#e8f5e9] hover:bg-[#c8e6c9]",
              "border-[#2e7d32]",
              "text-black text-xs font-medium",
              "rounded-none"
            )}
          >
            <BarChart3 className="h-3 w-3 text-[#1b5e20]" />
            View Metrics
          </Button>
        </Link>
      </div>
    </div>
  );
} 