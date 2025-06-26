"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Toaster } from "sonner";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import DashboardHeader from "@/app/dashboard/DashboardHeader";
import { ToastProvider } from '@/components/ui/use-toast';
import { useSession } from "next-auth/react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  


  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (status === "unauthenticated") {
      // Redirect to signin page with callback URL
      const returnUrl = encodeURIComponent(pathname || '/dashboard');
      router.push(`/signin?callbackUrl=${returnUrl}`);
    } else {
      setLoading(false);
    }
  }, [status, router, pathname]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col w-full" data-sidebar-expanded="true">
            <DashboardHeader />
            <main className="flex-grow p-4 w-full">
              {children}
            </main>
          </div>
        </div>
        <Toaster position="top-right" />
      </SidebarProvider>
    </ToastProvider>
  );
}