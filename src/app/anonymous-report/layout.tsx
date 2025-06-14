"use client";

import { ReactNode } from "react";
import { Toaster } from "sonner";
import { ToastProvider } from '@/components/ui/use-toast';

interface AnonymousReportLayoutProps {
  children: ReactNode;
}

export default function AnonymousReportLayout({
  children,
}: AnonymousReportLayoutProps) {
  return (
    <ToastProvider>
      <div className="min-h-screen w-full">
        {children}
      </div>
      <Toaster position="top-right" />
    </ToastProvider>
  );
} 