"use client";

import React from 'react';
import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const DataAnalyticsHeader = () => {
  return (
    <Card className="w-full mb-6">
      <header>
        <div className="w-full max-w-full mx-auto px-4">
          <div className="flex h-16 items-center justify-between w-full">
            <div>
              <h1 className="text-2xl font-bold">
                <div className="flex items-center gap-2">
                  <BarChart3 size={24} strokeWidth={1.5} className="text-[#3b82f6]" />
                  <Badge className="px-3 py-1 text-base bg-[#3b82f6] text-white rounded-[4px] border border-black shadow-md">Data Analytics</Badge>
                </div>
              </h1>
            </div>
          </div>
        </div>
      </header>
    </Card>
  );
};

export default DataAnalyticsHeader;
