"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CustomersVendorsHeader from './customers-vendors-header';

export default function CustomersVendors() {
  return (
    <div className="w-full max-w-full mx-auto px-2 pt-1 pb-10">
      <CustomersVendorsHeader />
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Partner Directory</CardTitle>
              <CardDescription className="underline text-[#14b8a6]">Customer & Vendor Contacts</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Business Analytics</CardTitle>
              <CardDescription className="underline text-[#14b8a6]">Partnership Performance</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Contract Management</CardTitle>
              <CardDescription className="underline text-[#14b8a6]">Agreement Status</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
