"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { PlusCircle, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import CreateAuditDialog from './components/create-audit-dialog';

interface AuditsManagementHeaderProps {
  onAuditCreated?: () => void;
}

const AuditsManagementHeader: React.FC<AuditsManagementHeaderProps> = ({ onAuditCreated }) => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleOpenCreateDialog = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
  };

  const handleAuditCreated = () => {
    if (onAuditCreated) {
      onAuditCreated();
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
                  <ShieldAlert size={24} strokeWidth={1.5} className="text-rose-500" />
                  <Badge className="px-3 py-1 text-base bg-rose-100 text-rose-600 rounded-[4px] border border-rose-500 shadow-md">Audits Management</Badge>
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
              New Audit
            </Button>
            
            <CreateAuditDialog
              isOpen={isCreateDialogOpen}
              onClose={handleCloseCreateDialog}
              onAuditCreated={handleAuditCreated}
            />
          </div>
        </div>
      </header>
    </Card>
  );
};

export default AuditsManagementHeader; 