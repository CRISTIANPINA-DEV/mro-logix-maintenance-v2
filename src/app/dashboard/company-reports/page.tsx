"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CompanyReportsHeader from './company-reports-header';

export default function CompanyReports() {
  return (
    <div className="w-full max-w-full mx-auto px-2 pt-1 pb-10">
      <CompanyReportsHeader />
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Financial Reports</CardTitle>
              <CardDescription className="underline text-[#0ea5e9]">Revenue & Expenses</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Operational Reports</CardTitle>
              <CardDescription className="underline text-[#0ea5e9]">Performance Metrics</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Compliance Reports</CardTitle>
              <CardDescription className="underline text-[#0ea5e9]">Regulatory Standards</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
