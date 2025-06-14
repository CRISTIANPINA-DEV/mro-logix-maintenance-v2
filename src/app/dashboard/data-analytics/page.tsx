"use client";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import DataAnalyticsHeader from './data-analytics-header';
import Link from 'next/link';

export default function DataAnalytics() {
  return (
    <div className="w-full max-w-full mx-auto px-2 pt-1 pb-10">
      <DataAnalyticsHeader />
      <div className="space-y-6">
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/dashboard/data-analytics/defect-trend-over-time">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="text-center">
                <CardTitle>Defect Trend Over Time</CardTitle>
                <CardDescription className="text-gray-600">Analyzes the most repetitive defects over time</CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Trend Analysis</CardTitle>
              <CardDescription className="text-gray-600">Historical Data Patterns</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Predictive Analytics</CardTitle>
              <CardDescription className="text-gray-600">Future Forecasting</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Data Visualization</CardTitle>
              <CardDescription className="text-gray-600">Interactive Charts</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
