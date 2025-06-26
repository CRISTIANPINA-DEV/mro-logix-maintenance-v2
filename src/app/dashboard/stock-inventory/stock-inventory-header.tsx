"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Package, FileSpreadsheet, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StockInventoryReportDialog } from "./StockInventoryReportDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface StockInventoryHeaderProps {
  showForm: boolean;
  onAddStockClick: () => void;
}

const StockInventoryHeader: React.FC<StockInventoryHeaderProps> = ({ showForm, onAddStockClick }) => {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const { permissions, loading } = useUserPermissions();

  // Don't show buttons if permissions are still loading
  if (loading) {
    return (
      <Card className="w-full mb-6">
        <header>
          <div className="w-full max-w-full mx-auto px-4">
            <div className="flex h-16 items-center justify-between w-full">
              <div>
                <h1 className="text-2xl font-bold">
                  <div className="flex items-center gap-2">
                    <Package size={24} strokeWidth={1.5} className="text-cyan-500" />
                    <Badge className="px-3 py-1 text-base bg-cyan-100 text-cyan-600 rounded-[4px] border border-cyan-500 shadow-md">Stock Inventory</Badge>
                  </div>
                </h1>
              </div>
            </div>
          </div>
        </header>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full mb-6">
        <header>
          <div className="w-full max-w-full mx-auto px-4">
            <div className="flex h-16 items-center justify-between w-full">
              <div>
                <h1 className="text-2xl font-bold">
                  <div className="flex items-center gap-2">
                    <Package size={24} strokeWidth={1.5} className="text-cyan-500" />
                    <Badge className="px-3 py-1 text-base bg-cyan-100 text-cyan-600 rounded-[4px] border border-cyan-500 shadow-md">Stock Inventory</Badge>
                  </div>
                </h1>
              </div>
              
              {!showForm && (
                <div className="flex gap-3">
                  {permissions?.canAddStockItem && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={onAddStockClick} 
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Plus size={16} />
                          Add Stock
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click to add new stock item</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                  
                  {permissions?.canGenerateStockReport && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          size="sm"
                          className="flex items-center gap-2 bg-cyan-600 text-white hover:bg-cyan-700"
                          onClick={() => setShowReportDialog(true)}
                        >
                          <FileSpreadsheet size={16} />
                          Generate Report
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Generate stock inventory report</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>
      </Card>

      <StockInventoryReportDialog
        open={showReportDialog}
        onOpenChange={setShowReportDialog}
      />
    </>
  );
};

export default StockInventoryHeader;
