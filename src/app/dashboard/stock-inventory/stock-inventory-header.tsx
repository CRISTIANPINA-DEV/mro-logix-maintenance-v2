"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Package, FileSpreadsheet, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useState } from "react";
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
      <TooltipProvider>
        {/* Mobile: Separate card for title */}
        <Card className="w-full mb-4 sm:hidden rounded-none">
          <header>
            <div className="w-full max-w-full mx-auto px-3">
              <div className="flex justify-center items-center min-h-12 py-2">
                <div className="text-center">
                  <h1 className="text-xl font-bold">
                    <div className="flex items-center justify-center gap-1.5">
                      <Package size={20} strokeWidth={1.5} className="text-orange-500" />
                      <Badge className="px-2 py-0.5 text-sm bg-orange-500 text-white rounded-none border border-black shadow-md">Stock Inventory</Badge>
                    </div>
                  </h1>
                </div>
              </div>
            </div>
          </header>
        </Card>

        {/* Desktop: Combined layout */}
        <Card className="w-full mb-6 hidden sm:block rounded-none">
          <header>
            <div className="w-full max-w-full mx-auto px-4">
              <div className="flex flex-row h-16 items-center justify-between w-full">
                <div>
                  <h1 className="text-2xl font-bold">
                    <div className="flex items-center gap-2">
                      <Package size={24} strokeWidth={1.5} className="text-orange-500" />
                      <Badge className="px-3 py-1 text-base bg-orange-500 text-white rounded-none border border-black shadow-md">Stock Inventory</Badge>
                    </div>
                  </h1>
                </div>
              </div>
            </div>
          </header>
        </Card>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      {/* Mobile: Separate card for title */}
      <Card className="w-full mb-3 sm:hidden rounded-none">
        <header>
          <div className="w-full max-w-full mx-auto px-3">
            <div className="flex justify-center items-center min-h-12 py-2">
              <div className="text-center">
                <h1 className="text-xl font-bold">
                  <div className="flex items-center justify-center gap-1.5">
                    <Package size={20} strokeWidth={1.5} className="text-orange-500" />
                    <Badge className="px-2 py-0.5 text-sm bg-orange-500 text-white rounded-none border border-black shadow-md">Stock Inventory</Badge>
                  </div>
                </h1>
              </div>
            </div>
          </div>
        </header>
      </Card>

      {/* Mobile: Separate card for buttons */}
      {!showForm && (
        <Card className="w-full mb-4 sm:hidden rounded-none">
          <div className="w-full max-w-full mx-auto px-3">
            <div className="flex justify-center items-center min-h-10 py-2">
              <div className="flex flex-wrap justify-center gap-2">
                {permissions?.canAddStockItem && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={onAddStockClick} 
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus size={14} />
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
                        className="h-8 text-xs flex items-center gap-1.5 bg-green-600 text-white hover:bg-green-700"
                        onClick={() => setShowReportDialog(true)}
                      >
                        <FileSpreadsheet size={14} />
                        Generate Report
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Generate stock inventory report</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Desktop: Combined layout */}
      <Card className="w-full mb-6 hidden sm:block rounded-none">
        <header>
          <div className="w-full max-w-full mx-auto px-4">
            <div className="flex flex-row h-16 items-center justify-between w-full">
              <div>
                <h1 className="text-2xl font-bold">
                  <div className="flex items-center gap-2">
                    <Package size={24} strokeWidth={1.5} className="text-orange-500" />
                    <Badge className="px-3 py-1 text-base bg-orange-500 text-white rounded-none border border-black shadow-md">Stock Inventory</Badge>
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
                          className="h-8 flex items-center gap-2 cursor-pointer"
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
                          className="h-8 flex items-center gap-2 bg-green-600 text-white hover:bg-green-700"
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
    </TooltipProvider>
  );
};

export default StockInventoryHeader;
