"use client";

import { usePathname } from "next/navigation";
import Header from "./header";

export function HeaderWrapper() {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  // Only show the landing page header when not in dashboard
  if (!isDashboard) {
    return <Header />;
  }

  // Return null when in dashboard to avoid rendering anything
  return null;
}
