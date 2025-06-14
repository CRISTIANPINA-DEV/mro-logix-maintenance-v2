"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import WorkOrdersHeader from './work-orders-header';

export default function WorkOrders() {
  return (
    <div className="w-full max-w-full mx-auto px-2 pt-1 pb-10">
      <WorkOrdersHeader />
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Active Work Orders</CardTitle>
              <CardDescription className="underline text-[#8b5cf6]">Current Maintenance Tasks</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Work Order Status</CardTitle>
              <CardDescription className="underline text-[#8b5cf6]">Task Progress Overview</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Resource Allocation</CardTitle>
              <CardDescription className="underline text-[#8b5cf6]">Technician Assignments</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
