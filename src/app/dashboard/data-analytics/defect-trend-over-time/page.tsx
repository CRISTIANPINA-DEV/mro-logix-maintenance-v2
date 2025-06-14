// Defect Trend Over Time Page

"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Layers, Activity, TrendingUp, AlertCircle, PieChartIcon, Plane } from 'lucide-react'; 
import DataAnalyticsHeader from '../data-analytics-header'; 
import Link from 'next/link';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';

interface AnalyticsData {
  totalFleetCount: number;
  totalLogPageNoCount: number;
  topSystemAffected: {
    name: string;
    count: number;
  };
  donutChartData: { name: string; value: number }[];
  fleetTypeChartData: { name: string; value: number }[];
}

interface ApiResponse {
  success: boolean;
  data?: AnalyticsData;
  message?: string;
  error?: string;
}

export default function DefectTrendOverTimePage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/defect-analytics?months=all`);
        const result: ApiResponse = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        } else {
          setError(result.message || result.error || 'Failed to load analytics data');
        }
      } catch (err) {
        console.error('Error fetching analytics data:', err);
        setError('An error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        <p className="ml-4 text-lg">Loading Analytics Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <DataAnalyticsHeader />
        <Card className="mt-6 bg-destructive/10 border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertCircle className="mr-2" /> Error Loading Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
            <p>Please try refreshing the page or contact support if the issue persists.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-4">
        <DataAnalyticsHeader />
        <p className="mt-6 text-center">No data available.</p>
      </div>
    );
  }
  
  // Your app's primary color, similar to the blue in data-analytics-header
  const primaryColor = "#3b82f6"; 

  return (
    <div className="container mx-auto p-4 space-y-6">
      <DataAnalyticsHeader />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fleet Count</CardTitle>
            <Layers className="h-5 w-5" style={{ color: primaryColor }} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalFleetCount}</div>
            <p className="text-xs text-muted-foreground">Active fleets with reported defects</p>
          </CardContent>
        </Card>
        <Link href="/dashboard/log-pages" className="block transition-transform hover:scale-[1.02]">
          <Card className="cursor-pointer hover:border-primary/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Log Entries</CardTitle>
              <Activity className="h-5 w-5" style={{ color: primaryColor }} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{data.totalLogPageNoCount}</div>
              <p className="text-xs text-muted-foreground">Defect log entries recorded</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top System Affected</CardTitle>
            <TrendingUp className="h-5 w-5" style={{ color: primaryColor }} />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.topSystemAffected?.name || 'No data'}</div>
            <p className="text-xs text-muted-foreground">
              With {data.topSystemAffected?.count || 0} reported defects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Defect Distribution Donut Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChartIcon className="mr-2 h-5 w-5" style={{ color: primaryColor }}/>
            Top 10 Systems by Defect Distribution
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Showing the 10 systems with the highest number of reported defects
          </p>
        </CardHeader>
        <CardContent className="h-[350px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.donutChartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
                nameKey="name"
                label={({ name, value }) => `${name} (${value})`}
                labelLine={true}
              >
                {data.donutChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={[
                      '#3b82f6', // Primary blue
                      '#10b981', // Emerald
                      '#6366f1', // Indigo
                      '#f59e0b', // Amber
                      '#ef4444', // Red
                      '#8b5cf6', // Purple
                      '#ec4899', // Pink
                      '#14b8a6', // Teal
                    ][index % 8]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [
                  `${value} defects`,
                  name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Fleet Type Distribution Chart Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plane className="mr-2 h-5 w-5" style={{ color: primaryColor }}/>
            Fleet Types with Most Log Pages
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[450px] pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.fleetTypeChartData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 70,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={70} 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                label={{ value: 'Log Pages', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
              />
              <Tooltip 
                formatter={(value: number) => [`${value}`, 'Log Pages']}
                labelFormatter={(name) => `Fleet: ${name}`}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar 
                dataKey="value" 
                name="Log Pages" 
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={30}
                maxBarSize={35}
              >
                {data.fleetTypeChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={[
                      '#3b82f6', // Primary blue
                      '#10b981', // Emerald
                      '#6366f1', // Indigo
                      '#f59e0b', // Amber
                      '#ef4444', // Red
                      '#8b5cf6', // Purple
                      '#ec4899', // Pink
                      '#14b8a6', // Teal
                    ][index % 8]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
