"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import FormsCreationHeader from './forms-creation-header';

export default function FormsCreation() {
  return (
    <div className="w-full max-w-full mx-auto px-2 pt-1 pb-10">
      <FormsCreationHeader />
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Form Templates</CardTitle>
              <CardDescription className="underline text-[#22c55e]">Reusable Form Designs</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Form Builder</CardTitle>
              <CardDescription className="underline text-[#22c55e]">Custom Form Creation</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Form Management</CardTitle>
              <CardDescription className="underline text-[#22c55e]">Form Library & Settings</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
