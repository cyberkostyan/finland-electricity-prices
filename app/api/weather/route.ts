import { NextResponse } from "next/server"

// Helsinki coordinates (default fallback)
const DEFAULT_LAT = 60.17
const DEFAULT_LON = 24.94

interface OpenMeteoResponse {
  hourly: {
    time: string[]
    temperature_2m: number[]
    weather_code: number[]
    is_day: number[]
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pastDays = searchParams.get("past_days") || "1"
    const forecastDays = searchParams.get("forecast_days") || "7"
    const lat = parseFloat(searchParams.get("lat") || "") || DEFAULT_LAT
    const lon = parseFloat(searchParams.get("lon") || "") || DEFAULT_LON

    // Clamp coordinates to valid ranges
    const clampedLat = Math.max(-90, Math.min(90, lat))
    const clampedLon = Math.max(-180, Math.min(180, lon))

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${clampedLat}&longitude=${clampedLon}&hourly=temperature_2m,weather_code,is_day&past_days=${pastDays}&forecast_days=${forecastDays}&timezone=Europe%2FHelsinki`

    const response = await fetch(url, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.status}`)
    }

    const data: OpenMeteoResponse = await response.json()

    // Transform to our format
    const temperatures = data.hourly.time.map((time, index) => ({
      date: time,
      temperature: data.hourly.temperature_2m[index],
      weatherCode: data.hourly.weather_code[index],
      isDay: data.hourly.is_day[index] === 1,
    }))

    return NextResponse.json(temperatures)
  } catch (error) {
    console.error("Weather API error:", error)
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    )
  }
}
