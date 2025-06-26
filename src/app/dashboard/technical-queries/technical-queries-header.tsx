"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, MessageSquareIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface TechnicalQueriesHeaderProps {
  onQueryCreated?: () => void;
}

const TechnicalQueriesHeader: React.FC<TechnicalQueriesHeaderProps> = ({ onQueryCreated }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
    if (onQueryCreated) {
      onQueryCreated();
    }
  };

  return (
    <Card className="w-full mb-6">
      <header>
        <div className="w-full max-w-full mx-auto px-4">
          <div className="flex h-16 items-center justify-between w-full">
            <div>
              <h1 className="text-2xl font-bold">
                <div className="flex items-center gap-2">
                  <MessageSquareIcon size={24} strokeWidth={1.5} style={{ color: '#004953' }} />
                  <Badge className="px-3 py-1 text-base text-white rounded-[4px] border shadow-md" style={{ backgroundColor: '#004953', borderColor: '#004953' }}>Technical Queries</Badge>
                </div>
              </h1>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-2"
              onClick={handleOpenCreateDialog}
            >
              <PlusCircle size={16} />
              New Query
            </Button>
          </div>
        </div>
      </header>
    </Card>
  );
};

export default TechnicalQueriesHeader; 