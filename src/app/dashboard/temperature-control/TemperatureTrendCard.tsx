"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TrendData {
  temperature: number;
  humidity: number;
  temperatureDirection: 'up' | 'down' | 'stable';
  humidityDirection: 'up' | 'down' | 'stable';
}

interface TemperatureTrendCardProps {
  refreshTrigger?: number;
  onClick: () => void;
}

export function TemperatureTrendCard({ refreshTrigger, onClick }: TemperatureTrendCardProps) {
  const [trends, setTrends] = useState<TrendData>({
    temperature: 0,
    humidity: 0,
    temperatureDirection: 'stable',
    humidityDirection: 'stable',
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/temperature-control/trends?days=7');
        const result = await response.json();

        if (result.success) {
          setTrends(result.data.trends);
        } else {
          toast({
            title: "Error",
            description: "Failed to fetch trend data",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching trends:', error);
        toast({
          title: "Error",
          description: "Failed to fetch trend data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTrends();
  }, [refreshTrigger, toast]);

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-600" />;
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

  if (loading) {
    return (
      <Card className="shadow-sm cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="py-2">
          <CardTitle className="text-sm flex items-center">
            <BarChart3 className="h-4 w-4 mr-1" />
            Trend Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-xs">Loading...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="shadow-sm cursor-pointer hover:shadow-md transition-shadow" 
      onClick={onClick}
    >
      <CardHeader className="py-2">
        <CardTitle className="text-sm flex items-center">
          <BarChart3 className="h-4 w-4 mr-1" />
          Trend Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="py-2">
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs">Temperature:</span>
            <div className="flex items-center gap-1">
              {getTrendIcon(trends.temperatureDirection)}
              <span className={`text-xs font-semibold ${getTrendColor(trends.temperatureDirection)}`}>
                {formatTrendValue(trends.temperature, '°C')}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs">Humidity:</span>
            <div className="flex items-center gap-1">
              {getTrendIcon(trends.humidityDirection)}
              <span className={`text-xs font-semibold ${getTrendColor(trends.humidityDirection)}`}>
                {formatTrendValue(trends.humidity, '%')}
              </span>
            </div>
          </div>
          <div className="mt-2 pt-1 border-t border-gray-100">
            <span className="text-xs text-gray-500">Click for details</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 