"use client";

import { ProfessionalSidebar } from "./professional-sidebar";
import { cn } from "@/lib/utils";

interface ProfessionalLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function ProfessionalLayout({ children, className }: ProfessionalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <ProfessionalSidebar />
      <main className={cn("transition-all duration-300", className)}>
        <div className="p-6 max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
}