"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import RosterHeader from './roster-header';

export default function Roster() {
  return (
    <div className="w-full max-w-full mx-auto px-2 pt-1 pb-10">
      <RosterHeader />
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Active Employees</CardTitle>
              <CardDescription className="underline text-cyan-500">Current Staff Overview</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Department Distribution</CardTitle>
              <CardDescription className="underline text-cyan-500">Staff by Department</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Certifications Status</CardTitle>
              <CardDescription className="underline text-cyan-500">Training & Qualifications</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
