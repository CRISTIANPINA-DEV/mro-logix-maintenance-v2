import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
    
    return NextResponse.json({
      success: true,
      data: {
        apiKeyConfigured: !!WEATHER_API_KEY,
        apiKeyLength: WEATHER_API_KEY?.length || 0,
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
        testData: {
          location: 'Test Location',
          country: 'Test Country',
          region: 'Test Region',
          timezone: 'America/Test_Zone',
          temperature: 25,
          temperatureF: 77,
          humidity: 60,
          rainProbability: 20,
          description: 'test conditions',
          icon: 'test-icon',
          feelsLike: 28,
          feelsLikeF: 82,
          windSpeed: 15,
          windDirection: 225,
          pressure: 1013,
        }
      },
      message: 'Weather API test endpoint working'
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Test endpoint failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 