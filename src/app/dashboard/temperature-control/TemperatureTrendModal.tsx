"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus, MapPin, Calendar, BarChart3 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ChartDataPoint {
  id: string;
  date: string;
  displayDate: string;
  time: string;
  temperature: number;
  humidity: number;
  location: string;
  timestamp: number;
}

interface TrendData {
  temperature: number;
  humidity: number;
  temperatureDirection: 'up' | 'down' | 'stable';
  humidityDirection: 'up' | 'down' | 'stable';
}

interface TrendModalData {
  chartData: ChartDataPoint[];
  locations: string[];
  trends: TrendData;
  summary: {
    totalRecords: number;
    dateRange: {
      start: string;
      end: string;
    };
    averages: {
      temperature: number;
      humidity: number;
    };
  };
}

interface TemperatureTrendModalProps {
  isOpen: boolean;
  onClose: () => void;
  refreshTrigger?: number;
}

export function TemperatureTrendModal({ isOpen, onClose, refreshTrigger }: TemperatureTrendModalProps) {
  const [data, setData] = useState<TrendModalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedDays, setSelectedDays] = useState<string>('30');
  const { toast } = useToast();

  const fetchTrendData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        days: selectedDays,
        ...(selectedLocation !== 'all' && { location: selectedLocation })
      });

      const response = await fetch(`/api/temperature-control/trends?${params}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch trend data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching trend data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch trend data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTrendData();
    }
  }, [isOpen, selectedLocation, selectedDays, refreshTrigger]);

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTrendValue = (value: number, unit: string) => {
    const absValue = Math.abs(value);
    if (absValue < 0.1) return 'Stable';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}${unit}`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-sm">{`${data.displayDate} at ${data.time}`}</p>
          <p className="text-sm text-blue-600">
            {`Temperature: ${payload.find((p: any) => p.dataKey === 'temperature')?.value}°C`}
          </p>
          <p className="text-sm text-green-600">
            {`Humidity: ${payload.find((p: any) => p.dataKey === 'humidity')?.value}%`}
          </p>
          <p className="text-xs text-gray-500 mt-1">{`Location: ${data.location}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-screen-xl w-full max-h-[95vh] h-[95vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Temperature & Humidity Trends
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Select value={selectedDays} onValueChange={setSelectedDays}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="14">Last 14 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="60">Last 60 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {data?.locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={fetchTrendData} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">Loading trend data...</p>
              </div>
            </div>
          ) : data ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{data.summary.totalRecords}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Avg Temperature</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-blue-600">
                      {data.summary.averages.temperature.toFixed(1)}°C
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Avg Humidity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold text-green-600">
                      {data.summary.averages.humidity.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Trend Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(data.trends.temperatureDirection)}
                        <span className={`text-sm font-medium ${getTrendColor(data.trends.temperatureDirection)}`}>
                          {formatTrendValue(data.trends.temperature, '°C')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(data.trends.humidityDirection)}
                        <span className={`text-sm font-medium ${getTrendColor(data.trends.humidityDirection)}`}>
                          {formatTrendValue(data.trends.humidity, '%')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              {data.chartData.length > 0 ? (
                <div className="space-y-6">
                  {/* Temperature Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        Temperature Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="displayDate" 
                              tick={{ fontSize: 12 }}
                              stroke="#666"
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              stroke="#666"
                              domain={['dataMin - 2', 'dataMax + 2']}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line 
                              type="monotone" 
                              dataKey="temperature" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                              activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2 }}
                            />
                            <ReferenceLine 
                              y={data.summary.averages.temperature} 
                              stroke="#94a3b8" 
                              strokeDasharray="5 5" 
                              label={{ value: "Average", position: "top" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Humidity Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        Humidity Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="displayDate" 
                              tick={{ fontSize: 12 }}
                              stroke="#666"
                            />
                            <YAxis 
                              tick={{ fontSize: 12 }}
                              stroke="#666"
                              domain={['dataMin - 5', 'dataMax + 5']}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line 
                              type="monotone" 
                              dataKey="humidity" 
                              stroke="#10b981" 
                              strokeWidth={2}
                              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                              activeDot={{ r: 5, stroke: '#10b981', strokeWidth: 2 }}
                            />
                            <ReferenceLine 
                              y={data.summary.averages.humidity} 
                              stroke="#94a3b8" 
                              strokeDasharray="5 5" 
                              label={{ value: "Average", position: "top" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Combined Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Combined Trend Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis 
                              dataKey="displayDate" 
                              tick={{ fontSize: 12 }}
                              stroke="#666"
                            />
                            <YAxis 
                              yAxisId="temp"
                              orientation="left"
                              tick={{ fontSize: 12 }}
                              stroke="#3b82f6"
                              domain={['dataMin - 2', 'dataMax + 2']}
                            />
                            <YAxis 
                              yAxisId="humidity"
                              orientation="right"
                              tick={{ fontSize: 12 }}
                              stroke="#10b981"
                              domain={['dataMin - 5', 'dataMax + 5']}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line 
                              yAxisId="temp"
                              type="monotone" 
                              dataKey="temperature" 
                              stroke="#3b82f6" 
                              strokeWidth={2}
                              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
                              name="Temperature (°C)"
                            />
                            <Line 
                              yAxisId="humidity"
                              type="monotone" 
                              dataKey="humidity" 
                              stroke="#10b981" 
                              strokeWidth={2}
                              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                              name="Humidity (%)"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                    <p className="text-gray-500">
                      No temperature records found for the selected criteria.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
} 