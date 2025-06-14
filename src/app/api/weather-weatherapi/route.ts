import { NextResponse } from 'next/server';

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const WEATHER_API_BASE_URL = 'https://api.weatherapi.com/v1';
const TIMEOUT_MS = 8000; // 8 seconds timeout
const MAX_RETRIES = 2;
const CACHE_DURATION = 300; // 5 minutes in seconds

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (retries > 0 && (error instanceof Error && 
      (error.name === 'AbortError' || error.message.includes('failed')))) {
      console.log(`Retrying... ${retries} attempts remaining`);
      // Exponential backoff: wait longer between each retry
      await new Promise(resolve => setTimeout(resolve, (MAX_RETRIES - retries + 1) * 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function GET(request: Request) {
  console.log('=== WeatherAPI.com Request Started ===');
  console.log('Request URL:', request.url);
  
  try {
    if (!WEATHER_API_KEY) {
      console.error('WeatherAPI.com API key not found');
      return NextResponse.json(
        { success: false, error: 'WeatherAPI.com API key not configured' },
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store'
          }
        }
      );
    }

    // Get coordinates from query parameters or default to Santo Domingo, Dominican Republic
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '18.4861');
    const lon = parseFloat(searchParams.get('lon') || '-69.9312');
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      console.error('Invalid coordinates provided:', { lat, lon });
      return NextResponse.json(
        { success: false, error: 'Invalid coordinates provided' },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-store'
          }
        }
      );
    }
    
    const query = `${lat},${lon}`;
    console.log('Using coordinates:', { lat, lon });

    // Common request options
    const requestOptions = {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'application/json',
      },
      next: { revalidate: CACHE_DURATION }
    };

    // Fetch current weather data from WeatherAPI.com
    const weatherUrl = `${WEATHER_API_BASE_URL}/current.json?key=${WEATHER_API_KEY}&q=${query}&aqi=no`;
    console.log('Fetching weather from:', weatherUrl.replace(WEATHER_API_KEY, 'API_KEY_HIDDEN'));
    
    const weatherResponse = await fetchWithRetry(weatherUrl, requestOptions);
    
    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text();
      console.error('WeatherAPI.com error:', errorText);
      
      if (weatherResponse.status === 401 || weatherResponse.status === 403) {
        return NextResponse.json(
          { success: false, error: 'Invalid WeatherAPI.com API key. Please check your configuration.' },
          { 
            status: 401,
            headers: {
              'Cache-Control': 'no-store'
            }
          }
        );
      }
      
      throw new Error(`Failed to fetch weather data: ${weatherResponse.status} - ${errorText}`);
    }

    const weatherData = await weatherResponse.json();
    console.log('Weather data received successfully');

    // Fetch forecast data for rain probability
    const forecastUrl = `${WEATHER_API_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${query}&days=1&aqi=no&alerts=no`;
    console.log('Fetching forecast from:', forecastUrl.replace(WEATHER_API_KEY, 'API_KEY_HIDDEN'));
    
    let rainProbability = 0;
    try {
      const forecastResponse = await fetchWithRetry(forecastUrl, requestOptions);
      
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json();
        console.log('Forecast data received successfully');
        // Get rain probability from today's forecast
        const todayForecast = forecastData.forecast?.forecastday?.[0]?.day;
        rainProbability = todayForecast?.daily_chance_of_rain || 0;
      } else {
        console.warn('Forecast request failed:', forecastResponse.status);
      }
    } catch (forecastError) {
      // Don't fail the entire request if forecast fails
      console.warn('Failed to fetch forecast data:', forecastError);
    }

    // Map WeatherAPI.com response to our format
    const weather = {
      location: weatherData.location.name,
      country: weatherData.location.country,
      region: weatherData.location.region,
      timezone: weatherData.location.tz_id,
      temperature: Math.round(weatherData.current.temp_c),
      temperatureF: Math.round(weatherData.current.temp_f),
      humidity: weatherData.current.humidity,
      rainProbability,
      description: weatherData.current.condition.text.toLowerCase(),
      icon: weatherData.current.condition.icon,
      feelsLike: Math.round(weatherData.current.feelslike_c),
      feelsLikeF: Math.round(weatherData.current.feelslike_f),
      windSpeed: Math.round(weatherData.current.wind_kph),
      windDirection: weatherData.current.wind_degree,
      pressure: Math.round(weatherData.current.pressure_mb),
      lastUpdatedEpoch: weatherData.current.last_updated_epoch,
      lastUpdated: weatherData.current.last_updated,
      isDay: weatherData.current.is_day,
      conditionText: weatherData.current.condition.text,
      conditionCode: weatherData.current.condition.code,
      windMph: Math.round(weatherData.current.wind_mph),
      windDir: weatherData.current.wind_dir,
      pressureIn: weatherData.current.pressure_in,
      precipMm: weatherData.current.precip_mm,
      precipIn: weatherData.current.precip_in,
      cloud: weatherData.current.cloud,
      visibilityKm: weatherData.current.vis_km,
      visibilityMiles: weatherData.current.vis_miles,
      gustMph: Math.round(weatherData.current.gust_mph || 0),
      gustKph: Math.round(weatherData.current.gust_kph || 0),
      uv: weatherData.current.uv,
      windchillC: Math.round(weatherData.current.windchill_c || weatherData.current.temp_c),
      windchillF: Math.round(weatherData.current.windchill_f || weatherData.current.temp_f),
      heatindexC: Math.round(weatherData.current.heatindex_c || weatherData.current.temp_c),
      heatindexF: Math.round(weatherData.current.heatindex_f || weatherData.current.temp_f),
      dewpointC: Math.round(weatherData.current.dewpoint_c || 0),
      dewpointF: Math.round(weatherData.current.dewpoint_f || 0),
    };

    // Return response with caching headers
    return NextResponse.json(
      {
        success: true,
        data: weather,
        provider: 'WeatherAPI.com'
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`,
          'CDN-Cache-Control': `public, s-maxage=${CACHE_DURATION}`,
          'Vercel-CDN-Cache-Control': `public, s-maxage=${CACHE_DURATION}`,
        }
      }
    );
  } catch (error) {
    console.error('=== WeatherAPI.com Error ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Full error object:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to fetch weather data';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        errorMessage = 'Weather service timeout - please try again';
        statusCode = 408;
      } else if (error.message.includes('fetch failed') || error.message.includes('ENOTFOUND')) {
        errorMessage = 'Unable to connect to weather service';
        statusCode = 503;
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { 
        status: statusCode,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }
} 