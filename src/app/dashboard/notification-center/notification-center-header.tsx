"use client";

import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Bell } from "lucide-react";

const NotificationCenterHeader: React.FC = () => {
  return (
    <Card className="w-full mb-6">
      <header>
        <div className="w-full max-w-full mx-auto px-4">
          <div className="flex h-16 items-center justify-between w-full">
            <div>
              <h1 className="text-2xl font-bold">
                <div className="flex items-center gap-2">
                  <Bell size={24} strokeWidth={1.5} className="text-blue-500" />
                  <Badge className="px-3 py-1 text-base bg-blue-100 text-blue-600 rounded-[4px] border border-blue-500 shadow-md">Notification Center</Badge>
                </div>
              </h1>
            </div>
          </div>
        </div>
      </header>
    </Card>
  );
};

export default NotificationCenterHeader; 