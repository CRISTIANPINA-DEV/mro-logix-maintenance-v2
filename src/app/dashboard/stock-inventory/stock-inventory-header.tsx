"use client";

import { Button } from "@/components/ui/button";
import { Package, FileSpreadsheet, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { StockInventoryReportDialog } from "./StockInventoryReportDialog";
import { useIsTabletLandscape } from "@/hooks/use-tablet-landscape";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StockInventoryHeaderProps {
  showForm: boolean;
  onAddStockClick: () => void;
}

export default function StockInventoryHeader({ showForm, onAddStockClick }: StockInventoryHeaderProps) {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const isTabletLandscape = useIsTabletLandscape();
  const isMobile = useIsMobile();

  // For tablet landscape and mobile, use dropdown menu to save space
  const useCompactLayout = isTabletLandscape || isMobile;

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Package className="h-6 w-6" />
          <h1 className="text-2xl font-semibold truncate">Stock Inventory</h1>
        </div>
        {!showForm && (
          <div className="flex items-center space-x-2">
            {useCompactLayout ? (
              // Compact layout for tablet landscape and mobile
              <DropdownMenu>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="cursor-pointer">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>More options</p>
                  </TooltipContent>
                </Tooltip>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setShowReportDialog(true)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Generate Report
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onAddStockClick}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Package className="h-4 w-4" />
                    Add Stock Item
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              // Normal layout for desktop and tablet portrait
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      onClick={() => setShowReportDialog(true)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span className="hidden sm:inline">Generate Report</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Generate Stock Inventory Report</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button onClick={onAddStockClick} className="cursor-pointer">
                      <span className="hidden sm:inline">Add Stock Item</span>
                      <span className="sm:hidden">Add</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Add a new stock item</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        )}
      </div>

      <StockInventoryReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
      />
    </TooltipProvider>
  );
}
