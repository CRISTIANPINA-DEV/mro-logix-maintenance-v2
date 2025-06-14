"use client";

import React from 'react';
import { FileTextIcon} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const LogPagesHeader = () => {
  return (
    <Card className="w-full mb-6">
      <header>
        <div className="w-full max-w-full mx-auto px-4">
          <div className="flex h-16 items-center justify-between w-full">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileTextIcon size={24} strokeWidth={1.5} className="text-emerald-400" />
                <Badge className="px-3 py-1 text-base bg-emerald-400 text-black rounded-[4px] border border-black shadow-md">Log Pages</Badge> {/* Added shadow-md */}
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

export default LogPagesHeader;
