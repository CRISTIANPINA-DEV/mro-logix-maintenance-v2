"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlaneTakeoff, Users, BarChart3Icon, Thermometer, Droplets, Package, AlertTriangle, MapPin, RefreshCw, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useUserPermissions } from "@/hooks/useUserPermissions";

interface WeatherData {
  location: string;
  country: string;
  region: string;
  timezone: string;
  temperature: number;
  temperatureF: number;
  humidity: number;
  rainProbability: number;
  description: string;
  icon: string;
  feelsLike: number;
  feelsLikeF: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
}

interface SystemMetrics {
  activeWorkOrders: number;
  flightRecordsToday: number;
  maintenanceTasks: number;
  inventoryItems: number;
  pendingInspections: number;
}

interface LatestTemperatureData {
  id: string;
  temperature: number;
  humidity: number;
  location: string;
  customLocation: string | null;
  displayLocation: string;
  date: string;
  time: string;
  createdAt: string;
  employeeName: string;
}

interface ExpiryStatusData {
  expiredCount: number;
  expiringSoonCount: number;
  totalWithExpiry: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { permissions, loading: permissionsLoading } = useUserPermissions();
  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [flightRecordsCount, setFlightRecordsCount] = useState(0);
  const [monthlyFlightCount, setMonthlyFlightCount] = useState(0);
  const [currentMonth, setCurrentMonth] = useState('');
  const [usersCount, setUsersCount] = useState(0);
  const [stationsCount, setStationsCount] = useState(0);
  const [totalTrainingsCount, setTotalTrainingsCount] = useState(0);
  const [inventoryCount, setInventoryCount] = useState<number>(0);

  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [latestTemperature, setLatestTemperature] = useState<LatestTemperatureData | null>(null);
  const [temperatureLoading, setTemperatureLoading] = useState(false);
  const [expiryStatus, setExpiryStatus] = useState<ExpiryStatusData | null>(null);
  const [expiryLoading, setExpiryLoading] = useState(false);
  const [times, setTimes] = useState({
    utc: {
      time: new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false }),
      date: new Date().toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' }),
      seconds: new Date().getUTCSeconds()
    },
    local: {
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      seconds: new Date().getSeconds()
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });

  const fetchSystemMetrics = async () => {
    try {
      setMetricsLoading(true);
      const response = await fetch('/api/system-metrics', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemMetrics({
          activeWorkOrders: data.activeWorkOrders || 0,
          flightRecordsToday: data.flightRecordsToday || 0,
          maintenanceTasks: data.maintenanceTasks || 0,
          inventoryItems: data.inventoryItems || 0,
          pendingInspections: data.pendingInspections || 0,
        });
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      toast.error('Failed to fetch real-time metrics');
    } finally {
      setMetricsLoading(false);
    }
  };

  const fetchLatestTemperature = async () => {
    try {
      setTemperatureLoading(true);
      const response = await fetch('/api/temperature-control/latest', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setLatestTemperature(result.data);
        } else {
          console.log('No temperature records found');
        }
      }
    } catch (error) {
      console.error('Error fetching latest temperature:', error);
      // Don't show toast error for temperature as it's not critical
    } finally {
      setTemperatureLoading(false);
    }
  };

  const fetchExpiryStatus = async () => {
    try {
      setExpiryLoading(true);
      const response = await fetch('/api/stock-inventory/expiry-status', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setExpiryStatus(result.data);
        } else {
          console.log('No expiry data found');
        }
      }
    } catch (error) {
      console.error('Error fetching expiry status:', error);
      // Don't show toast error for expiry status as it's not critical
    } finally {
      setExpiryLoading(false);
    }
  };

  const fetchStationsCount = async () => {
    try {
      const response = await fetch('/api/flight-records/stations-count');
      const data = await response.json();
      
      if (data.success) {
        setStationsCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching stations count:', error);
    }
  };

  const fetchFlightRecordsCount = async () => {
    try {
      const response = await fetch('/api/flight-records');
      const data = await response.json();
      
      if (data.success) {
        setFlightRecordsCount(data.records.length);
      }
    } catch (error) {
      console.error('Error fetching flight records count:', error);
    }
  };

  const fetchMonthlyFlightCount = async () => {
    try {
      const response = await fetch('/api/flight-records/monthly-count');
      const data = await response.json();
      
      if (data.success) {
        setMonthlyFlightCount(data.count);
        setCurrentMonth(data.month);
      }
    } catch (error) {
      console.error('Error fetching monthly flight count:', error);
    }
  };

  const fetchUsersCount = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();

      if (data.success) {
        setUsersCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching users count:', error);
    }
  };

  const fetchTotalTrainingsCount = async () => {
    try {
      const response = await fetch('/api/technician-training');
      const data = await response.json();
      
      if (data.total !== undefined) {
        setTotalTrainingsCount(data.total);
      }
    } catch (error) {
      console.error('Error fetching total trainings count:', error);
    }
  };

  const fetchInventoryCount = async () => {
    try {
      const response = await fetch('/api/stock-inventory');
      const data = await response.json();
      if (data.success && Array.isArray(data.records)) {
        setInventoryCount(data.records.length);
      }
    } catch (error) {
      console.error('Error fetching inventory count:', error);
    }
  };

  const fetchWeatherData = async (latitude?: number, longitude?: number) => {
    try {
      console.log('Fetching weather data...');
      setWeatherLoading(true);
      
      // Build the API URL with coordinates if provided
      let weatherUrl = '/api/weather-weatherapi';
      if (latitude && longitude) {
        weatherUrl += `?lat=${latitude}&lon=${longitude}`;
        console.log('Using user location:', { latitude, longitude });
      } else {
        console.log('Using default location (Santo Domingo)');
      }
      
      console.log('Final weather API URL:', weatherUrl);
      
      const response = await fetch(weatherUrl, {
        method: 'GET',
      });
      
      console.log('Weather API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Weather API response data:', data);
        if (data.success) {
          setWeatherData(data.data);
          console.log('Weather data set successfully:', data.data);
        } else {
          console.error('Weather API returned error:', data.error);
          // Don't show toast for network-related errors as they're handled in UI
          if (!data.error.includes('timeout') && !data.error.includes('connect')) {
            toast.error(`Weather: ${data.error}`);
          }
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Weather API HTTP error:', response.status, errorData);
        // Don't show toast for network errors as they're handled in UI
        if (response.status !== 500) {
          toast.error(`Weather service unavailable (${response.status})`);
        }
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Only show toast for unexpected errors, not network timeouts
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (!errorMessage.includes('fetch') && !errorMessage.includes('timeout')) {
        toast.error('Weather service error - please try again');
      }
    } finally {
      setWeatherLoading(false);
    }
  };

  const getCurrentLocationWeather = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('User location obtained:', { latitude, longitude });
          fetchWeatherData(latitude, longitude);
        },
        (error) => {
          console.log('Geolocation error:', error.message);
          console.log('Falling back to default location');
          // Fall back to default location if geolocation fails
          fetchWeatherData();
        },
        {
          timeout: 10000, // 10 seconds timeout
          maximumAge: 300000, // Cache location for 5 minutes
          enableHighAccuracy: false // Use network-based location for faster response
        }
      );
    } else {
      console.log('Geolocation not supported, using default location');
      fetchWeatherData();
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // Fetch critical data first - don't include weather in Promise.all
        await Promise.all([
          fetchSystemMetrics(),
          fetchLatestTemperature(),
          fetchExpiryStatus(),
          fetchStationsCount(),
          fetchFlightRecordsCount(),
          fetchMonthlyFlightCount(),
          fetchUsersCount(),
          fetchTotalTrainingsCount(),
          fetchInventoryCount(),
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    // Fetch weather data independently - don't block page loading
    const fetchWeatherIndependently = async () => {
      try {
        // Small delay to let the main page render first
        await new Promise(resolve => setTimeout(resolve, 100));
        getCurrentLocationWeather();
      } catch (error) {
        console.error('Error initiating weather fetch:', error);
      }
    };

    fetchInitialData();
    fetchWeatherIndependently();

    // Set up interval for updating times
    const timeInterval = setInterval(() => {
      setTimes({
        utc: {
          time: new Date().toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false }),
          date: new Date().toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'short', day: 'numeric' }),
          seconds: new Date().getUTCSeconds()
        },
        local: {
          time: new Date().toLocaleTimeString('en-US', { hour12: false }),
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
          seconds: new Date().getSeconds()
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
    }, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full mx-auto px-4 py-10">
      <div className="space-y-6">
        {/* All three cards in the same row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="h-[165px] rounded-none border border-slate-200/50 hover:border-slate-300 dark:border-slate-800/50 dark:hover:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                UTC Time
              </CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {times.utc.time}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{times.utc.date}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Universal Coordinated Time
              </p>
            </CardContent>
          </Card>

          <Card className="h-[165px] rounded-none border border-slate-200/50 hover:border-slate-300 dark:border-slate-800/50 dark:hover:border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Local Time
              </CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {times.local.time}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{times.local.date}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {times.timezone.replace('_', ' ')}
              </p>
            </CardContent>
          </Card>

          <Link href="/dashboard/weather" className="block">
            <Card className="h-[165px] rounded-none bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer border border-blue-200/50 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Current Weather
                {weatherLoading && (
                  <div className="inline-block ml-2 animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></div>
                )}
              </CardTitle>
              <div className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 text-green-600">
                  <circle cx="12" cy="10" r="3"/>
                  <path d="m21 21-6-6m6 6v-4.8m0 4.8h-4.8"/>
                  <path d="M16 8v-2a4 4 0 0 0-8 0v2"/>
                  <rect width="18" height="12" x="3" y="11" rx="2"/>
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
                </svg>
              </div>
            </CardHeader>
            <CardContent>
              {weatherData ? (
                <div className="space-y-2">
                  {/* Main temperature and description - Optimized for tablet */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <div className="text-2xl font-bold text-blue-600">{weatherData.temperature}°C</div>
                        <div className="text-sm text-muted-foreground">({weatherData.temperatureF}°F)</div>
                      </div>
                      <p className="text-xs text-muted-foreground capitalize mt-1">{weatherData.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6" 
                        onClick={(e) => {
                          e.preventDefault();
                          getCurrentLocationWeather();
                        }}
                        disabled={weatherLoading}
                      >
                        <RefreshCw className={`h-4 w-4 ${weatherLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Condensed weather info for tablet */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Droplets className="h-3 w-3" />
                      <span>{weatherData.humidity}% humidity</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <span>{weatherData.rainProbability}% rain</span>
                    </div>
                  </div>
                  
                  {/* Location info - Tablet optimized */}
                  <div className="text-xs text-blue-600 truncate">
                    <span title={weatherData.timezone}>
                      🌍 {weatherData.location}
                    </span>
                  </div>
                </div>
              ) : weatherLoading ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="text-sm text-muted-foreground">Loading weather...</span>
                  </div>
                  <div className="text-xs text-blue-600">Getting current conditions...</div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">⚠️ Weather unavailable</div>
                  <p className="text-xs text-muted-foreground">
                    Network connectivity issue or service temporarily unavailable
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-blue-600">
                      Click to open Weather Dashboard
                    </p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={(e) => {
                        e.preventDefault();
                        getCurrentLocationWeather();
                      }}
                      disabled={weatherLoading}
                    >
                      <RefreshCw className={`h-4 w-4 ${weatherLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          </Link>
          

        </div>

                {/* Business Operations Metrics */}
        <div className="space-y-4">
          {/* Title and Refresh Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3Icon className="h-5 w-5" />
              <h2 className="text-xl font-semibold">
                {session?.user?.companyName ? `${session.user.companyName.toUpperCase()}: ` : 'MRO-LOGIX: '}Business Operations
              </h2>
              {metricsLoading && (
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {lastUpdated && (
                <span className="text-green-600">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  fetchSystemMetrics();
                  fetchLatestTemperature();
                  fetchExpiryStatus();
                  fetchStationsCount();
                }}
                disabled={metricsLoading}
                className="h-6 text-xs"
              >
                {metricsLoading ? "Refreshing..." : "Refresh Now"}
              </Button>
            </div>
          </div>

          {/* Business Operations Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            {/* Flights Recorded */}
            <Link href="/dashboard/flight-records" className="block">
              <Card className="bg-green-50/50 dark:bg-green-950/20 hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-colors cursor-pointer border border-green-200/50 hover:border-green-300 dark:border-green-900/50 dark:hover:border-green-700 rounded-none">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <PlaneTakeoff className="h-4 w-4" />
                    Flights Recorded
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-0.5">
                      {flightRecordsCount?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total flights in database
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Monthly Flights */}
            <Link href="/dashboard/flight-records" className="block">
              <Card className="bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer border border-blue-200/50 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-700 rounded-none">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <PlaneTakeoff className="h-4 w-4" />
                    Monthly Flights
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-0.5">
                      {monthlyFlightCount?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Flights in {currentMonth}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Team Members */}
            <Card className="bg-pink-50/50 dark:bg-pink-950/20 rounded-none border border-pink-200/50 hover:border-pink-300 dark:border-pink-900/50 dark:hover:border-pink-700">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  Team Members
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-600 mb-0.5">
                    {usersCount?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total registered users
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Items */}
            <Link href="/dashboard/stock-inventory" className="block">
              <Card className="bg-purple-50/50 dark:bg-purple-950/20 hover:bg-purple-100/50 dark:hover:bg-purple-900/30 transition-colors cursor-pointer border border-purple-200/50 hover:border-purple-300 dark:border-purple-900/50 dark:hover:border-purple-700 rounded-none">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Package className="h-4 w-4" />
                    Inventory Items
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-0.5">
                      {inventoryCount?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current stock count
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Temperature Reading, Stock Status, and Stations */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Latest Temperature Reading */}
          <Link href="/dashboard/temperature-control" className="block">
            <Card className="h-[150px] bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-100/50 dark:hover:bg-orange-900/30 transition-colors cursor-pointer border border-orange-200/50 hover:border-orange-300 dark:border-orange-900/50 dark:hover:border-orange-700 rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Thermometer className="h-4 w-4" />
                  Stock Temperature
                  {temperatureLoading && (
                    <div className="animate-spin h-3 w-3 border-2 border-orange-600 border-t-transparent rounded-full"></div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                {temperatureLoading ? (
                  <div className="flex justify-center items-center py-3">
                    <div className="animate-spin h-4 w-4 border-2 border-orange-600 border-t-transparent rounded-full"></div>
                    <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
                  </div>
                ) : latestTemperature ? (
                  <div className="p-2 rounded-lg bg-gradient-to-r from-orange-50/50 to-blue-50/50 dark:from-orange-950/20 dark:to-blue-950/20">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-4 w-4 text-orange-600" />
                        <span className="text-lg font-bold text-orange-600">
                          {latestTemperature.temperature}°C
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplets className="h-4 w-4 text-blue-600" />
                        <span className="text-lg font-bold text-blue-600">
                          {latestTemperature.humidity}%
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-2 [div[data-sidebar-expanded=true]_&]:hidden">
                      <div className="flex items-center gap-1">
                        <span>📍</span>
                        <span className="font-medium truncate">{latestTemperature.displayLocation}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🕒</span>
                        <span className="font-medium">
                          {new Date(latestTemperature.createdAt).toLocaleDateString()} {latestTemperature.time}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <Thermometer className="h-6 w-6 text-orange-300 mx-auto mb-1" />
                    <div className="text-sm font-bold text-orange-600 mb-1">No Data</div>
                    <p className="text-xs text-muted-foreground">
                      Click to add temperature reading
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Stock Inventory Expiry Status */}
          <Link href="/dashboard/stock-inventory" className="block">
            <Card className="h-[150px] bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-colors cursor-pointer border border-red-200/50 hover:border-red-300 dark:border-red-900/50 dark:hover:border-red-700 rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-4 w-4" />
                  Stock Inventory
                  {expiryLoading && (
                    <div className="animate-spin h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full"></div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                {expiryLoading ? (
                  <div className="flex justify-center items-center py-3">
                    <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                    <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
                  </div>
                ) : expiryStatus ? (
                  <div className="p-3 rounded-lg bg-gradient-to-r from-red-50/50 to-orange-50/50 dark:from-red-950/20 dark:to-orange-950/20">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-lg font-bold text-red-600">
                          {expiryStatus.expiredCount}
                        </span>
                        <span className="text-xs text-muted-foreground">Expired</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-orange-600" />
                        <span className="text-lg font-bold text-orange-600">
                          {expiryStatus.expiringSoonCount}
                        </span>
                        <span className="text-xs text-muted-foreground">Expiring</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-center text-xs text-muted-foreground">
                      <span>📦 {expiryStatus.totalWithExpiry} items</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-3">
                    <Package className="h-6 w-6 text-red-300 mx-auto mb-1" />
                    <div className="text-sm font-bold text-red-600 mb-1">No Data</div>
                    <p className="text-xs text-muted-foreground">
                      Click to view stock inventory
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>

          {/* Active Stations */}
          <Card className="h-[150px] bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/50 hover:border-teal-300 dark:border-teal-900/50 dark:hover:border-teal-700 rounded-none">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Active Stations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-1">
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600 mb-1">
                  {stationsCount?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Stations with flights
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Trainings */}
          <Link href="/dashboard/technician-training" className="block">
            <Card className="h-[150px] bg-indigo-50/50 dark:bg-indigo-950/20 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 transition-colors cursor-pointer border border-indigo-200/50 hover:border-indigo-300 dark:border-indigo-900/50 dark:hover:border-indigo-700 rounded-none">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Total Trainings
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600 mb-1">
                    {totalTrainingsCount?.toLocaleString() || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Recorded Trainings
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
} 