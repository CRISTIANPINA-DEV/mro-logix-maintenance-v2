"use client";

import React from 'react';
import { FileCog } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const AircraftPartsCycleHeader = () => {
  return (
    <Card className="w-full mb-6">
      <header>
        <div className="w-full max-w-full mx-auto px-4">
          <div className="flex h-16 items-center justify-between w-full">
            <div>
              <h1 className="text-2xl font-bold">
                <div className="flex items-center gap-2">
                  <FileCog size={24} strokeWidth={1.5} className="text-[#f59e0b]" />
                  <Badge className="px-3 py-1 text-base bg-[#f59e0b] text-black rounded-[4px] border border-black shadow-md">Aircraft Parts Cycle</Badge>
                </div> {/* Added shadow-md */}
              </h1>
              {/* You can add a subtitle here if needed, e.g.: */}
              {/* <p className="text-sm text-muted-foreground">Manage your items</p> */}
            </div>
            {/* Add more buttons here if needed */}
          </div>
        </div>
      </header>
    </Card>
  );
};

export default AircraftPartsCycleHeader;