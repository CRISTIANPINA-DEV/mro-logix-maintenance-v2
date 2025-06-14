"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import AircraftPartsCycleHeader from './aircraft-parts-header';

export default function AircraftPartsCycle() {
  return (
    <div className="w-full max-w-full mx-auto px-2 pt-1 pb-10">
      <AircraftPartsCycleHeader />
      <div className="space-y-6">
        {/* Adjust grid to handle 3 items */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3"> 
          {/* Original Card - remove w-full */}
          <Card> 
            <CardHeader className="text-center">
              <CardTitle>Aircraft Parts Cycle Analytics</CardTitle>
              <CardDescription className="underline text-red-500">AircraftPartsCycle Overview</CardDescription> 
            </CardHeader>
            {/* Add CardContent if needed later */}
          </Card>

        </div>

        {/* You can add more sections/cards below, they will stack vertically due to space-y-6 */}
      </div>
    </div>
  );
}
