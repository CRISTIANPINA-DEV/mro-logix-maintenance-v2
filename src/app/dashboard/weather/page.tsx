"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  RefreshCw, 
  Thermometer, 
  Wind, 
  Eye, 
  Droplets, 
  Cloud, 
  Sun, 
  Gauge,
  MapPin,
  Calendar,
  Activity,
  TrendingUp,
  Compass,
  Zap
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface DetailedWeatherData {
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
  lastUpdatedEpoch: number;
  lastUpdated: string;
  isDay: number;
  conditionText: string;
  conditionCode: number;
  windMph: number;
  windDir: string;
  pressureIn: number;
  precipMm: number;
  precipIn: number;
  cloud: number;
  visibilityKm: number;
  visibilityMiles: number;
  gustMph: number;
  gustKph: number;
  uv: number;
  windchillC: number;
  windchillF: number;
  heatindexC: number;
  heatindexF: number;
  dewpointC: number;
  dewpointF: number;
}

export default function WeatherDashboard() {
  const [weatherData, setWeatherData] = useState<DetailedWeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchWeatherData = async (latitude?: number, longitude?: number) => {
    try {
      setLoading(true);
      
      let weatherUrl = '/api/weather-weatherapi';
      if (latitude && longitude) {
        weatherUrl += `?lat=${latitude}&lon=${longitude}`;
      }
      
      const response = await fetch(weatherUrl, {
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setWeatherData(data.data);
          setLastRefresh(new Date());
        } else {
          toast.error(`Weather API error: ${data.error}`);
        }
      } else {
        toast.error(`Failed to fetch weather: ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching weather data:', error);
      toast.error('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocationWeather = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherData(latitude, longitude);
        },
        (error) => {
          console.log('Geolocation error:', error.message);
          fetchWeatherData();
        },
        {
          timeout: 10000,
          maximumAge: 300000,
          enableHighAccuracy: true
        }
      );
    } else {
      fetchWeatherData();
    }
  };

  useEffect(() => {
    getCurrentLocationWeather();
  }, []);

  const getWindDirectionName = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions[Math.round(degrees / 22.5) % 16];
  };

  const getUVIndexLevel = (uv: number) => {
    if (uv <= 2) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-100', variant: 'secondary' as const };
    if (uv <= 5) return { level: 'Moderate', color: 'text-yellow-700', bgColor: 'bg-yellow-100', variant: 'secondary' as const };
    if (uv <= 7) return { level: 'High', color: 'text-orange-700', bgColor: 'bg-orange-100', variant: 'destructive' as const };
    if (uv <= 10) return { level: 'Very High', color: 'text-red-700', bgColor: 'bg-red-100', variant: 'destructive' as const };
    return { level: 'Extreme', color: 'text-purple-700', bgColor: 'bg-purple-100', variant: 'destructive' as const };
  };

  const getComfortLevel = (humidity: number) => {
    if (humidity < 30) return { level: 'Dry', color: 'text-orange-600' };
    if (humidity <= 60) return { level: 'Comfortable', color: 'text-green-600' };
    if (humidity <= 80) return { level: 'Humid', color: 'text-yellow-600' };
    return { level: 'Very Humid', color: 'text-red-600' };
  };

  const getPressureTrend = (pressure: number) => {
    if (pressure > 1020) return { trend: 'High', color: 'text-green-600', icon: TrendingUp };
    if (pressure >= 1000) return { trend: 'Normal', color: 'text-blue-600', icon: Activity };
    return { trend: 'Low', color: 'text-orange-600', icon: TrendingUp };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground">Loading weather data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
            <div className="text-center space-y-4">
              <Cloud className="h-16 w-16 text-muted-foreground mx-auto" />
              <div>
                <h2 className="text-xl font-semibold mb-2">Weather data unavailable</h2>
                <p className="text-muted-foreground">Unable to load weather information</p>
              </div>
            </div>
            <Button onClick={getCurrentLocationWeather} size="lg">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const uvInfo = getUVIndexLevel(weatherData.uv);
  const comfortLevel = getComfortLevel(weatherData.humidity);
  const pressureTrend = getPressureTrend(weatherData.pressure);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="hover:bg-white/50">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Weather Dashboard
              </h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <MapPin className="h-4 w-4" />
                <span>{weatherData.location}, {weatherData.region}</span>
                <Separator orientation="vertical" className="h-4" />
                <Calendar className="h-4 w-4" />
                <span>{weatherData.timezone}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <div className="text-sm text-muted-foreground text-right">
                <div>Last updated</div>
                <div className="font-medium">{lastRefresh.toLocaleTimeString()}</div>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={getCurrentLocationWeather}
              disabled={loading}
              className="hover:bg-white/50 min-w-[100px]"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Updating...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Hero Weather Card */}
        <Card className="relative overflow-hidden border-none shadow-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
          
          <CardContent className="relative p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    {weatherData.isDay ? '☀️ Day' : '🌙 Night'}
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                    Updated {new Date(weatherData.lastUpdated).toLocaleTimeString()}
                  </Badge>
                </div>
                
                <div>
                  <div className="text-6xl font-bold mb-2">
                    {weatherData.temperature}°
                  </div>
                  <div className="text-xl text-blue-100 mb-1">
                    {weatherData.temperatureF}°F
                  </div>
                  <div className="text-2xl font-medium capitalize text-blue-100">
                    {weatherData.conditionText}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-blue-100">
                  <div className="flex items-center gap-1">
                    <Thermometer className="h-4 w-4" />
                    <span>Feels like {weatherData.feelsLike}°C</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Droplets className="h-4 w-4" />
                    <span className="text-sm font-medium">Humidity</span>
                  </div>
                  <div className="text-2xl font-bold">{weatherData.humidity}%</div>
                  <div className={`text-sm ${comfortLevel.color.replace('text-', 'text-white ')}`}>
                    {comfortLevel.level}
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Wind className="h-4 w-4" />
                    <span className="text-sm font-medium">Wind</span>
                  </div>
                  <div className="text-2xl font-bold">{weatherData.windSpeed}</div>
                  <div className="text-sm text-blue-100">km/h {weatherData.windDir}</div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Gauge className="h-4 w-4" />
                    <span className="text-sm font-medium">Pressure</span>
                  </div>
                  <div className="text-2xl font-bold">{weatherData.pressure}</div>
                  <div className="text-sm text-blue-100">mb</div>
                </div>

                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="h-4 w-4" />
                    <span className="text-sm font-medium">Rain</span>
                  </div>
                  <div className="text-2xl font-bold">{weatherData.rainProbability}%</div>
                  <div className="text-sm text-blue-100">chance</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Metrics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Wind Information */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wind className="h-4 w-4" />
                </div>
                Wind Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{weatherData.windSpeed}</div>
                <div className="text-sm text-muted-foreground">km/h</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Direction</span>
                  <div className="flex items-center gap-1">
                    <Compass className="h-3 w-3" />
                    <span className="font-medium">{weatherData.windDirection}° {getWindDirectionName(weatherData.windDirection)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Speed (mph)</span>
                  <span className="font-medium">{weatherData.windMph} mph</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gusts</span>
                  <span className="font-medium">{weatherData.gustKph} km/h</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visibility */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-green-700">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="h-4 w-4" />
                </div>
                Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{weatherData.visibilityKm}</div>
                <div className="text-sm text-muted-foreground">kilometers</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Miles</span>
                  <span className="font-medium">{weatherData.visibilityMiles} mi</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Cloud cover</span>
                  <span className="font-medium">{weatherData.cloud}%</span>
                </div>
                <div className="mt-2">
                  <Progress value={weatherData.cloud} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Atmospheric Pressure */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-purple-700">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Gauge className="h-4 w-4" />
                </div>
                Pressure
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{weatherData.pressure}</div>
                <div className="text-sm text-muted-foreground">millibars</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Inches</span>
                  <span className="font-medium">{weatherData.pressureIn.toFixed(2)} in</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Trend</span>
                  <div className="flex items-center gap-1">
                    <pressureTrend.icon className={`h-3 w-3 ${pressureTrend.color}`} />
                    <span className={`font-medium ${pressureTrend.color}`}>{pressureTrend.trend}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* UV Index */}
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-orange-700">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Sun className="h-4 w-4" />
                </div>
                UV Index
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className={`text-3xl font-bold ${uvInfo.color}`}>{weatherData.uv}</div>
                <Badge variant={uvInfo.variant} className={`${uvInfo.bgColor} ${uvInfo.color} border-none`}>
                  {uvInfo.level}
                </Badge>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Protection</span>
                  <span className="font-medium text-xs">
                    {weatherData.uv <= 2 ? 'None needed' : weatherData.uv <= 5 ? 'Minimal' : 'Required'}
                  </span>
                </div>
                <div className="mt-2">
                  <Progress value={(weatherData.uv / 12) * 100} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Temperature Analysis */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Zap className="h-4 w-4" />
                </div>
                Heat Index
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-red-600">{weatherData.heatindexC}°C</div>
                <div className="text-lg text-muted-foreground">{weatherData.heatindexF}°F</div>
                <p className="text-sm text-muted-foreground">How hot it feels with humidity</p>
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-700 font-medium">
                    {weatherData.heatindexC > 32 ? 'Caution: Very hot conditions' : 
                     weatherData.heatindexC > 27 ? 'Warm and humid' : 'Comfortable heat level'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Wind className="h-4 w-4" />
                </div>
                Wind Chill
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-blue-600">{weatherData.windchillC}°C</div>
                <div className="text-lg text-muted-foreground">{weatherData.windchillF}°F</div>
                <p className="text-sm text-muted-foreground">How cold it feels with wind</p>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-700 font-medium">
                    {weatherData.windchillC < 0 ? 'Warning: Freezing conditions' : 
                     weatherData.windchillC < 10 ? 'Cool with wind effect' : 'Mild wind chill'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2 text-teal-700">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Droplets className="h-4 w-4" />
                </div>
                Dew Point
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-teal-600">{weatherData.dewpointC}°C</div>
                <div className="text-lg text-muted-foreground">{weatherData.dewpointF}°F</div>
                <p className="text-sm text-muted-foreground">Humidity comfort level</p>
                <div className="mt-3 p-3 bg-teal-50 rounded-lg">
                  <p className="text-xs text-teal-700 font-medium">
                    {weatherData.dewpointC > 20 ? 'Very humid and uncomfortable' : 
                     weatherData.dewpointC > 15 ? 'Humid but tolerable' : 'Comfortable humidity'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Precipitation Details */}
        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Droplets className="h-5 w-5" />
              </div>
              Precipitation Analysis
            </CardTitle>
            <CardDescription>
              Current precipitation levels and probability forecast
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="text-center space-y-3">
                <div className="text-4xl font-bold text-blue-600">{weatherData.precipMm}</div>
                <div className="text-sm text-muted-foreground">mm today</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(weatherData.precipMm * 10, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-center space-y-3">
                <div className="text-4xl font-bold text-blue-600">{weatherData.precipIn.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">inches today</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(weatherData.precipIn * 50, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-center space-y-3">
                <div className="text-4xl font-bold text-blue-600">{weatherData.rainProbability}%</div>
                <div className="text-sm text-muted-foreground">chance of rain</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${weatherData.rainProbability}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="text-center">
              <Badge variant={weatherData.rainProbability > 70 ? 'destructive' : weatherData.rainProbability > 30 ? 'secondary' : 'default'}>
                {weatherData.rainProbability > 70 ? 'High chance of rain' : 
                 weatherData.rainProbability > 30 ? 'Possible light rain' : 'Clear skies expected'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 