"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, PlaneTakeoff, Users, BarChart3Icon, Thermometer, Droplets, Package, AlertTriangle, MapPin, RefreshCw, FileText, Settings } from "lucide-react";
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

interface FlightDashboardMetrics {
  totalFlights: number;
  monthlyFlights: number;
  weeklyFlights: number;
  dailyFlights: number;
  flightsWithDefects: number;
  monthlyDefects: number;
  previousMonthFlights: number;
  previousMonthDefects: number;
  twoMonthsAgoFlights: number;
  threeMonthsAgoFlights: number;
  yearToDateFlights: number;
  last30DaysFlights: number;
  defectRate: number;
  monthlyDefectRate: number;
  previousMonthDefectRate: number;
  monthOverMonthChange: number;
  monthlyTrend: 'up' | 'down' | 'stable';
  monthProgress: number;
  uniqueStations: number;
  uniqueAirlines: number;
  currentMonth: string;
  previousMonthName: string;
  twoMonthsAgoName: string;
  threeMonthsAgoName: string;
  recentFlights: Array<{
    id: string;
    date: string;
    airline: string;
    fleet: string;
    tail: string | null;
    station: string;
    hasDefect: boolean;
    createdAt: string;
  }>;
  topStations: Array<{
    name: string;
    count: number;
  }>;
  topAirlines: Array<{
    name: string;
    count: number;
  }>;
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
  const [wheelRotationsTodayCount, setWheelRotationsTodayCount] = useState(0);
  const [wheelRotationsLoading, setWheelRotationsLoading] = useState(false);
  const [flightMetrics, setFlightMetrics] = useState<FlightDashboardMetrics | null>(null);
  const [flightMetricsLoading, setFlightMetricsLoading] = useState(false);

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

  const fetchWheelRotationsTodayCount = async () => {
    try {
      setWheelRotationsLoading(true);
      const response = await fetch('/api/wheel-rotation/today-count');
      const data = await response.json();
      if (data.success) {
        setWheelRotationsTodayCount(data.count);
      } else {
        console.error('Failed to fetch wheel rotation count:', data.error);
        // Do not show a toast for this, as it's not critical
      }
    } catch (error) {
      console.error('Error fetching wheel rotation count:', error);
    } finally {
      setWheelRotationsLoading(false);
    }
  };

  const fetchFlightMetrics = async () => {
    try {
      setFlightMetricsLoading(true);
      const response = await fetch('/api/flight-records/dashboard-metrics', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setFlightMetrics(result.data);
          // Update existing state variables for backward compatibility
          setFlightRecordsCount(result.data.totalFlights);
          setMonthlyFlightCount(result.data.monthlyFlights);
          setCurrentMonth(result.data.currentMonth);
          setStationsCount(result.data.uniqueStations);
        } else {
          console.error('Failed to fetch flight metrics:', result.message);
        }
      }
    } catch (error) {
      console.error('Error fetching flight metrics:', error);
      // Don't show toast error as this is not critical
    } finally {
      setFlightMetricsLoading(false);
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
          fetchFlightMetrics(), // Replace individual flight calls with comprehensive metrics
          fetchUsersCount(),
          fetchTotalTrainingsCount(),
          fetchInventoryCount(),
          fetchWheelRotationsTodayCount(),
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
        {/* All four cards in the same row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="h-[165px] rounded-none border border-slate-200/50 hover:border-slate-300 dark:border-slate-800/50 dark:hover:border-slate-700 bg-gradient-to-br from-slate-50/50 to-gray-100/50 dark:from-slate-900/20 dark:to-gray-900/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                UTC Time
              </CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-blue-600">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 font-mono tracking-wide">
                  {times.utc.time}
                </div>
                <div className="text-sm text-muted-foreground mt-1 font-medium">{times.utc.date}</div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-blue-100/50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="m12 2 3 3-3 3"/>
                  </svg>
                  <span>UTC+0</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-[165px] rounded-none border border-slate-200/50 hover:border-slate-300 dark:border-slate-800/50 dark:hover:border-slate-700 bg-gradient-to-br from-slate-50/50 to-gray-100/50 dark:from-slate-900/20 dark:to-gray-900/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">
                Local Time
              </CardTitle>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-emerald-600">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 font-mono tracking-wide">
                  {times.local.time}
                </div>
                <div className="text-sm text-muted-foreground mt-1 font-medium">{times.local.date}</div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-emerald-100/50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4"/>
                    <path d="M12 18v4"/>
                    <path d="M4.93 4.93l2.83 2.83"/>
                    <path d="M16.24 16.24l2.83 2.83"/>
                    <path d="M2 12h4"/>
                    <path d="M18 12h4"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <span className="truncate max-w-[80px]">{times.timezone.replace('_', ' ')}</span>
                </div>
              </div>
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

          {/* Team Members & Active Stations */}
          <Card className="h-[165px] bg-pink-50/50 dark:bg-pink-950/20 rounded-none border border-pink-200/50 hover:border-pink-300 dark:border-pink-900/50 dark:hover:border-pink-700">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4" />
                Team & Stations
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 pb-3 space-y-3">
              {/* Team Members Section */}
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600 mb-0.5">
                  {usersCount?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Total registered users
                </p>
              </div>
              
              {/* Active Stations Section */}
              <div className="flex items-center justify-between pt-2 border-t border-pink-200/50">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-teal-600" />
                  <span className="text-xs text-muted-foreground">Active Stations:</span>
                </div>
                <div className="text-sm font-bold text-teal-600">
                  {stationsCount?.toLocaleString() || 0}
                </div>
              </div>
            </CardContent>
          </Card>

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
                  fetchFlightMetrics();
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
            {/* Flights Recorded - Enhanced */}
            <Link href="/dashboard/flight-records" className="block">
              <Card className="h-[220px] bg-green-50/50 dark:bg-green-950/20 hover:bg-green-100/50 dark:hover:bg-green-900/30 transition-all duration-200 cursor-pointer border border-green-200/50 hover:border-green-300 dark:border-green-900/50 dark:hover:border-green-700 rounded-none hover:shadow-md group">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <PlaneTakeoff className="h-4 w-4" />
                      Flights Recorded
                      {flightMetricsLoading && (
                        <div className="animate-spin h-3 w-3 border-2 border-green-600 border-t-transparent rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Growth indicator */}
                      <div className="text-xs text-green-600 font-medium">
                        +{flightMetrics?.monthlyFlights || monthlyFlightCount}
                      </div>
                      <ArrowRight className="h-3 w-3 text-green-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3 space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-0.5">
                      {flightMetrics?.totalFlights?.toLocaleString() || flightRecordsCount?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total flights in database
                    </p>
                  </div>
                  
                  {/* Enhanced metrics with multiple insights */}
                  <div className="space-y-2">
                    {/* Monthly progress */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground">This month</span>
                      <span className="font-medium text-green-600">
                        {flightMetrics?.monthlyFlights || monthlyFlightCount} flights
                      </span>
                    </div>
                    <div className="w-full bg-green-100 dark:bg-green-900/30 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-green-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(((flightMetrics?.monthlyFlights || monthlyFlightCount) / Math.max(flightMetrics?.totalFlights || flightRecordsCount, 1)) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    
                    {/* Activity indicators */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-muted-foreground">Today: </span>
                        <span className="font-medium text-blue-600">
                          {flightMetrics?.dailyFlights || 0}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span className="text-muted-foreground">Week: </span>
                        <span className="font-medium text-amber-600">
                          {flightMetrics?.weeklyFlights || 0}
                        </span>
                      </div>
                    </div>

                    {/* Bottom row with defect rate and stations */}
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-green-200/50">
                      <div className="flex items-center gap-1">
                        {flightMetrics?.defectRate !== undefined && (
                          <>
                            <AlertTriangle className="h-3 w-3 text-red-500" />
                            <span className="text-muted-foreground">
                              {flightMetrics.defectRate}% defects
                            </span>
                          </>
                        )}
                      </div>
                      <span className="text-muted-foreground">
                        {flightMetrics?.uniqueStations || stationsCount} stations
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {/* Monthly Flights - Enhanced */}
            <Link href="/dashboard/flight-records" className="block">
              <Card className="h-[220px] bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/30 transition-all duration-200 cursor-pointer border border-blue-200/50 hover:border-blue-300 dark:border-blue-900/50 dark:hover:border-blue-700 rounded-none hover:shadow-md group">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <PlaneTakeoff className="h-4 w-4" />
                      Monthly Flights
                      {flightMetricsLoading && (
                        <div className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {/* Month-over-month change indicator */}
                      {flightMetrics?.monthOverMonthChange !== undefined && (
                        <div className={`flex items-center gap-1 text-xs font-medium ${
                          flightMetrics.monthlyTrend === 'up' 
                            ? 'text-green-600' 
                            : flightMetrics.monthlyTrend === 'down' 
                            ? 'text-red-600' 
                            : 'text-gray-600'
                        }`}>
                          {flightMetrics.monthlyTrend === 'up' && '↗'}
                          {flightMetrics.monthlyTrend === 'down' && '↘'}
                          {flightMetrics.monthlyTrend === 'stable' && '→'}
                          <span>{Math.abs(flightMetrics.monthOverMonthChange)}%</span>
                        </div>
                      )}
                      <ArrowRight className="h-3 w-3 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3 space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-0.5">
                      {flightMetrics?.monthlyFlights?.toLocaleString() || monthlyFlightCount?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Flights in {flightMetrics?.currentMonth || currentMonth}
                    </p>
                  </div>
                  
                  {/* Month progress indicator */}
                  {flightMetrics?.monthProgress && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Month progress</span>
                        <span className="font-medium text-blue-600">
                          {Math.round(flightMetrics.monthProgress)}% complete
                        </span>
                      </div>
                      <div className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-full h-1.5">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${flightMetrics.monthProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* Past three months comparison */}
                  <div className="grid grid-cols-3 gap-1 text-xs">
                    <div className="text-center p-1.5 bg-blue-100/50 dark:bg-blue-900/20 rounded">
                      <div className="font-bold text-blue-700 dark:text-blue-300 text-xs">
                        {flightMetrics?.previousMonthFlights?.toLocaleString() || '—'}
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        {flightMetrics?.previousMonthName || 'Last month'}
                      </div>
                    </div>
                    <div className="text-center p-1.5 bg-blue-100/50 dark:bg-blue-900/20 rounded">
                      <div className="font-bold text-blue-700 dark:text-blue-300 text-xs">
                        {flightMetrics?.twoMonthsAgoFlights?.toLocaleString() || '—'}
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        {flightMetrics?.twoMonthsAgoName || '2 months ago'}
                      </div>
                    </div>
                    <div className="text-center p-1.5 bg-blue-100/50 dark:bg-blue-900/20 rounded">
                      <div className="font-bold text-blue-700 dark:text-blue-300 text-xs">
                        {flightMetrics?.threeMonthsAgoFlights?.toLocaleString() || '—'}
                      </div>
                      <div className="text-muted-foreground text-[10px]">
                        {flightMetrics?.threeMonthsAgoName || '3 months ago'}
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </Link>

            {/* Stock Inventory - Moved from lower section */}
            <Link href="/dashboard/stock-inventory" className="block">
              <Card className="h-[220px] bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-900/30 transition-all duration-200 cursor-pointer border border-red-200/50 hover:border-red-300 dark:border-red-900/50 dark:hover:border-red-700 rounded-none hover:shadow-md group">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Stock Inventory
                      {expiryLoading && (
                        <div className="animate-spin h-3 w-3 border-2 border-red-600 border-t-transparent rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="text-xs text-red-600 font-medium">
                        {inventoryCount || 0} items
                      </div>
                      <ArrowRight className="h-3 w-3 text-red-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3 space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 mb-0.5">
                      {inventoryCount?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Total inventory items
                    </p>
                  </div>
                  
                  {expiryLoading ? (
                    <div className="flex justify-center items-center py-3">
                      <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                      <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
                    </div>
                  ) : expiryStatus ? (
                    <div className="space-y-2">
                      {/* Status indicators in a compact grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center justify-center gap-1 p-1.5 bg-red-100/50 dark:bg-red-900/20 rounded">
                          <AlertTriangle className="h-3 w-3 text-red-600" />
                          <span className="font-bold text-red-600">
                            {expiryStatus.expiredCount}
                          </span>
                          <span className="text-muted-foreground">expired</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 p-1.5 bg-orange-100/50 dark:bg-orange-900/20 rounded">
                          <Package className="h-3 w-3 text-orange-600" />
                          <span className="font-bold text-orange-600">
                            {expiryStatus.expiringSoonCount}
                          </span>
                          <span className="text-muted-foreground">expiring</span>
                        </div>
                      </div>
                      
                      {/* Bottom summary bar */}
                      <div className="flex justify-between items-center text-xs pt-1 border-t border-red-200/50">
                        <span className="text-muted-foreground">
                          With expiry dates: {expiryStatus.totalWithExpiry}
                        </span>
                        <span className="text-muted-foreground">
                          Health check
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-center p-2 bg-red-100/50 dark:bg-red-900/20 rounded">
                        <div className="text-xs text-muted-foreground">
                          Click to manage inventory
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>

            {/* Wheel Rotations Due - Moved from lower section */}
            <Link href="/dashboard/wheel-rotation" className="block">
              <Card className="h-[220px] bg-cyan-50/50 dark:bg-cyan-950/20 hover:bg-cyan-100/50 dark:hover:bg-cyan-900/30 transition-all duration-200 cursor-pointer border border-cyan-200/50 hover:border-cyan-300 dark:border-cyan-900/50 dark:hover:border-cyan-700 rounded-none hover:shadow-md group">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Wheel Rotations Due
                      {wheelRotationsLoading && (
                        <div className="animate-spin h-3 w-3 border-2 border-cyan-600 border-t-transparent rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="text-xs text-cyan-600 font-medium">
                        Today
                      </div>
                      <ArrowRight className="h-3 w-3 text-cyan-600 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-3 space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-600 mb-0.5">
                      {wheelRotationsTodayCount?.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Required for today
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Status indicator */}
                    <div className="text-center p-2 bg-cyan-100/50 dark:bg-cyan-900/20 rounded">
                    </div>
                    
                    {/* Bottom summary bar */}
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-cyan-200/50">
                      <span className="text-muted-foreground">
                        Due today
                      </span>
                      <span className="text-muted-foreground">
                        Maintenance
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
} 