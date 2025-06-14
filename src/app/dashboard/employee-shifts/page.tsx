"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import EmployeeShiftsHeader from './employee-shifts-header';

export default function EmployeeShifts() {
  return (
    <div className="w-full max-w-full mx-auto px-2 pt-1 pb-10">
      <EmployeeShiftsHeader />
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Current Shifts</CardTitle>
              <CardDescription className="underline text-sky-500">Active Shift Status</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Shift Schedule</CardTitle>
              <CardDescription className="underline text-sky-500">Weekly Overview</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Shift Analytics</CardTitle>
              <CardDescription className="underline text-sky-500">Performance Metrics</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
