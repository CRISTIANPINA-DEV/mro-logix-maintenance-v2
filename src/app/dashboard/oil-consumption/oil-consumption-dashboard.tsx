"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Zap,
  Droplets,
  Calendar,
  AlertTriangle,
  CheckCircle,
  CircleDot as Engine,
  Plane,
  Fuel,
  Clock,
  Target,
  Gauge,
  ArrowUp,
  ArrowDown,
  Minus,
  PieChart,
  Filter,
  MapPin
} from "lucide-react";

interface OilConsumptionDashboardProps {
  loading: boolean;
  onRefresh: () => void;
  selectedStation?: string;
  onStationChange?: (station: string) => void;
}

import { useEffect, useState, useCallback } from 'react';

interface OilServiceRecord {
  id: string;
  date: string;
  airline: string;
  fleet: string;
  tailNumber?: string;
  flightNumber?: string;
  station?: string;
  serviceType: string;
  enginePosition?: string;
  engineModel?: string;
  hydraulicSystem?: string;
  oilAmount: number;
  oilType?: string;
  Attachment: any[];
}

interface DashboardStats {
  totalRecords: number;
  totalOilUsed: number;
  avgOilPerService: number;
  servicesThisMonth: number;
  servicesLastMonth: number;
  monthlyGrowth: number;
  topAirline: string;
  topFleet: string;
  mostCommonServiceType: string;
  recentAlerts: Array<{
    type: 'warning' | 'info' | 'success';
    message: string;
    aircraft: string;
    date: string;
    severity: 'high' | 'medium' | 'low';
  }>;
  serviceTypeBreakdown: Array<{
    type: string;
    count: number;
    totalOil: number;
    avgOil: number;
    percentage: number;
  }>;
  oilTypeUsage: Array<{
    type: string;
    count: number;
    totalAmount: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    services: number;
    oilUsed: number;
  }>;
  fleetAnalysis: Array<{
    fleet: string;
    services: number;
    totalOil: number;
    avgOil: number;
    lastService: string;
  }>;
  engineAnalysis: Array<{
    engine: string;
    services: number;
    totalOil: number;
    avgOil: number;
    lastService: string;
  }>;
  consumptionPatterns: {
    highConsumption: number;
    normalConsumption: number;
    lowConsumption: number;
  };
}

export const OilConsumptionDashboard: React.FC<OilConsumptionDashboardProps> = ({ loading, onRefresh, selectedStation, onStationChange }) => {
  const [records, setRecords] = useState<OilServiceRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch records from API
  const fetchRecords = useCallback(async () => {
    setLoadingData(true);
    setError(null);
    try {
      const res = await fetch('/api/oil-consumption');
      if (!res.ok) throw new Error('Failed to fetch records');
      const data = await res.json();
      setRecords(data);
      calculateStats(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch records');
      setRecords([]);
      setStats(null);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Recalculate stats when station filter changes
  useEffect(() => {
    if (records.length > 0) {
      calculateStats(records);
    }
  }, [selectedStation, records]);

  // Calculate comprehensive statistics
  const calculateStats = (records: OilServiceRecord[]): void => {
    if (!records.length) {
      setStats(null);
      return;
    }

    // Filter records by selected station if one is selected
    const filteredRecords = selectedStation && selectedStation !== 'all' 
      ? records.filter(record => {
          const recordStation = record.station ? record.station.split(' - ')[0] : '';
          return recordStation === selectedStation;
        })
      : records;

    if (!filteredRecords.length) {
      setStats(null);
      return;
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Basic stats
    const totalRecords = filteredRecords.length;
    const totalOilUsed = filteredRecords.reduce((sum, r) => sum + r.oilAmount, 0);
    const avgOilPerService = totalOilUsed / totalRecords;

    // Monthly comparisons
    const thisMonthRecords = filteredRecords.filter(r => {
      const recordDate = new Date(r.date);
      return recordDate.getMonth() === currentMonth && recordDate.getFullYear() === currentYear;
    });
    
    const lastMonthRecords = filteredRecords.filter(r => {
      const recordDate = new Date(r.date);
      return recordDate.getMonth() === lastMonth && recordDate.getFullYear() === lastMonthYear;
    });

    const servicesThisMonth = thisMonthRecords.length;
    const servicesLastMonth = lastMonthRecords.length;
    const monthlyGrowth = servicesLastMonth > 0 
      ? ((servicesThisMonth - servicesLastMonth) / servicesLastMonth) * 100 
      : 0;

    // Top performers
    const airlineCounts = filteredRecords.reduce((acc, r) => {
      const airline = r.airline.split(' - ')[0];
      acc[airline] = (acc[airline] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const fleetCounts = filteredRecords.reduce((acc, r) => {
      acc[r.fleet] = (acc[r.fleet] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const serviceTypeCounts = filteredRecords.reduce((acc, r) => {
      acc[r.serviceType] = (acc[r.serviceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topAirline = Object.entries(airlineCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const topFleet = Object.entries(fleetCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
    const mostCommonServiceType = Object.entries(serviceTypeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Service type breakdown
    const serviceTypeBreakdown = Object.entries(serviceTypeCounts).map(([type, count]) => {
      const typeRecords = filteredRecords.filter(r => r.serviceType === type);
      const totalOil = typeRecords.reduce((sum, r) => sum + r.oilAmount, 0);
      const avgOil = totalOil / count;
      const percentage = (count / totalRecords) * 100;
      
      return { type, count, totalOil, avgOil, percentage };
    }).sort((a, b) => b.count - a.count);

    // Oil type usage
    const oilTypeCounts = filteredRecords.reduce((acc, r) => {
      if (r.oilType) {
        const type = r.oilType;
        if (!acc[type]) acc[type] = { count: 0, totalAmount: 0 };
        acc[type].count += 1;
        acc[type].totalAmount += r.oilAmount;
      }
      return acc;
    }, {} as Record<string, { count: number; totalAmount: number }>);

    const oilTypeUsage = Object.entries(oilTypeCounts).map(([type, data]) => ({
      type,
      count: data.count,
      totalAmount: data.totalAmount
    })).sort((a, b) => b.count - a.count).slice(0, 5);

    // Monthly trends (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(currentYear, currentMonth - i, 1);
      const monthRecords = filteredRecords.filter(r => {
        const recordDate = new Date(r.date);
        return recordDate.getMonth() === targetDate.getMonth() && 
               recordDate.getFullYear() === targetDate.getFullYear();
      });
      
      monthlyTrends.push({
        month: targetDate.toLocaleDateString('en-US', { month: 'short' }),
        services: monthRecords.length,
        oilUsed: monthRecords.reduce((sum, r) => sum + r.oilAmount, 0)
      });
    }

    // Fleet analysis
    const fleetAnalysis = Object.entries(fleetCounts).map(([fleet, services]) => {
      const fleetRecords = filteredRecords.filter(r => r.fleet === fleet);
      const totalOil = fleetRecords.reduce((sum, r) => sum + r.oilAmount, 0);
      const avgOil = totalOil / services;
      const lastService = fleetRecords.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]?.date || '';
      
      return { fleet, services, totalOil, avgOil, lastService };
    }).sort((a, b) => b.services - a.services).slice(0, 5);

    // Engine analysis
    const engineCounts = filteredRecords.reduce((acc, r) => {
      if (r.engineModel) {
        acc[r.engineModel] = (acc[r.engineModel] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const engineAnalysis = Object.entries(engineCounts).map(([engine, services]) => {
      const engineRecords = filteredRecords.filter(r => r.engineModel === engine);
      const totalOil = engineRecords.reduce((sum, r) => sum + r.oilAmount, 0);
      const avgOil = totalOil / services;
      const lastService = engineRecords.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )[0]?.date || '';
      
      return { engine, services, totalOil, avgOil, lastService };
    }).sort((a, b) => b.services - a.services).slice(0, 5);

    // Consumption patterns
    const avgConsumption = avgOilPerService;
    const highThreshold = avgConsumption * 1.5;
    const lowThreshold = avgConsumption * 0.5;
    
    const consumptionPatterns = {
      highConsumption: filteredRecords.filter(r => r.oilAmount > highThreshold).length,
      normalConsumption: filteredRecords.filter(r => r.oilAmount >= lowThreshold && r.oilAmount <= highThreshold).length,
      lowConsumption: filteredRecords.filter(r => r.oilAmount < lowThreshold).length
    };

    // Generate intelligent alerts
    const recentAlerts = [];
    const recentRecords = filteredRecords.slice(0, 10);
    
    for (const record of recentRecords) {
      if (record.oilAmount > avgConsumption * 2) {
        recentAlerts.push({
          type: 'warning' as const,
          message: `High oil consumption detected: ${record.oilAmount}Qt (${record.serviceType})`,
          aircraft: `${record.fleet} ${record.tailNumber || ''}`.trim(),
          date: record.date,
          severity: 'high' as const
        });
      } else if (record.oilAmount > avgConsumption * 1.5) {
        recentAlerts.push({
          type: 'info' as const,
          message: `Above average oil consumption: ${record.oilAmount}Qt (${record.serviceType})`,
          aircraft: `${record.fleet} ${record.tailNumber || ''}`.trim(),
          date: record.date,
          severity: 'medium' as const
        });
      } else {
        recentAlerts.push({
          type: 'success' as const,
          message: `Normal oil service completed: ${record.oilAmount}Qt (${record.serviceType})`,
          aircraft: `${record.fleet} ${record.tailNumber || ''}`.trim(),
          date: record.date,
          severity: 'low' as const
        });
      }
    }

    setStats({
      totalRecords,
      totalOilUsed,
      avgOilPerService,
      servicesThisMonth,
      servicesLastMonth,
      monthlyGrowth,
      topAirline,
      topFleet,
      mostCommonServiceType,
      recentAlerts: recentAlerts.slice(0, 5),
      serviceTypeBreakdown,
      oilTypeUsage,
      monthlyTrends,
      fleetAnalysis,
      engineAnalysis,
      consumptionPatterns
    });
  };

  if (loadingData || loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <span className="text-muted-foreground">Loading oil consumption analytics...</span>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground mb-4">
              {error || "No oil consumption records found. Start by adding your first oil service record."}
            </p>
            <button 
              onClick={onRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh Data
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTrendIcon = (value: number) => {
    if (value > 5) return <ArrowUp className="h-3 w-3 text-green-500" />;
    if (value < -5) return <ArrowDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-gray-500" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 5) return "text-green-600";
    if (value < -5) return "text-red-600";
    return "text-gray-600";
  };

      return (
      <div className="space-y-6">
        {/* Station Filter Indicator */}
        {selectedStation && selectedStation !== 'all' && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <MapPin className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Showing data for station: <span className="font-bold">{selectedStation}</span>
                </span>
                {onStationChange && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onStationChange('all')}
                    className="h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    View All Stations
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</div>
            <div className="flex items-center mt-2">
              {getTrendIcon(stats.monthlyGrowth)}
              <span className={`text-xs ml-1 ${getTrendColor(stats.monthlyGrowth)}`}>
                {stats.monthlyGrowth > 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}% from last month
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.servicesThisMonth} this month
            </p>
          </CardContent>
        </Card>

        {/* Total Oil Used */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Oil Used</CardTitle>
            <Fuel className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOilUsed.toFixed(1)} Qt</div>
            <p className="text-xs text-muted-foreground">
              Avg: {stats.avgOilPerService.toFixed(1)}Qt per service
            </p>
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-1">
                Most common: {stats.mostCommonServiceType}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Engines */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Engines Serviced</CardTitle>
            <Engine className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.engineAnalysis.slice(0, 3).map((engine, index) => (
                <div key={engine.engine} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      index === 0 ? 'bg-green-500' : 
                      index === 1 ? 'bg-blue-500' : 'bg-orange-500'
                    }`}></div>
                    <span className="text-sm font-medium truncate max-w-[120px]" title={engine.engine}>
                      {engine.engine}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{engine.services}</div>
                    <div className="text-xs text-muted-foreground">{engine.totalOil.toFixed(1)}Qt</div>
                  </div>
                </div>
              ))}
            </div>
            {stats.engineAnalysis.length === 0 && (
              <div className="text-center py-2">
                <p className="text-xs text-muted-foreground">No engine data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Service Type Breakdown and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Type Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Service Type Analysis
            </CardTitle>
            <CardDescription>
              Breakdown by system type and oil consumption
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.serviceTypeBreakdown.map((service, index) => (
                <div key={service.type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {service.type === 'Engine' && <Engine className="h-4 w-4 text-orange-500" />}
                      {service.type === 'APU' && <Zap className="h-4 w-4 text-purple-500" />}
                      {service.type === 'Hydraulic SYS' && <Droplets className="h-4 w-4 text-blue-500" />}
                      <span className="text-sm font-medium">{service.type}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{service.count} services</div>
                      <div className="text-xs text-muted-foreground">
                        {service.totalOil.toFixed(1)}Qt total
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Progress value={service.percentage} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{service.percentage.toFixed(1)}% of services</span>
                      <span>Avg: {service.avgOil.toFixed(1)}Qt</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts & Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity & Alerts
            </CardTitle>
            <CardDescription>
              Latest oil consumption monitoring insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentAlerts.map((alert, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                  {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />}
                  {alert.type === 'info' && <Activity className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />}
                  {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Plane className="h-3 w-3" />
                        {alert.aircraft}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(alert.date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Analysis and Oil Type Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fleet Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Fleet Performance
            </CardTitle>
            <CardDescription>
              Top fleets by service frequency and oil consumption
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.fleetAnalysis.map((fleet, index) => (
                <div key={fleet.fleet} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{fleet.fleet}</div>
                    <div className="text-xs text-muted-foreground">
                      Last service: {new Date(fleet.lastService).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-sm font-semibold">{fleet.services} services</div>
                    <div className="text-xs text-muted-foreground">
                      {fleet.totalOil.toFixed(1)}Qt total
                    </div>
                    <div className="text-xs text-blue-600">
                      Avg: {fleet.avgOil.toFixed(1)}Qt
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Oil Type Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Oil Type Usage
            </CardTitle>
            <CardDescription>
              Most frequently used oil types and quantities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.oilTypeUsage.length > 0 ? (
                stats.oilTypeUsage.map((oil, index) => (
                  <div key={oil.type} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{oil.type}</div>
                      <div className="text-xs text-muted-foreground">
                        {oil.count} services
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{oil.totalAmount.toFixed(1)}Qt</div>
                      <div className="text-xs text-blue-600">
                        Avg: {(oil.totalAmount / oil.count).toFixed(1)}Qt
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Droplets className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No oil type data available</p>
                  <p className="text-xs">Oil types will appear as services are recorded</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      
    </div>
  );
};
