import { NextResponse } from "next/server"

// Helsinki coordinates (central Finland for representative temperature)
const HELSINKI_LAT = 60.17
const HELSINKI_LON = 24.94

interface OpenMeteoResponse {
  hourly: {
    time: string[]
    temperature_2m: number[]
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const pastDays = searchParams.get("past_days") || "1"
    const forecastDays = searchParams.get("forecast_days") || "7"

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${HELSINKI_LAT}&longitude=${HELSINKI_LON}&hourly=temperature_2m&past_days=${pastDays}&forecast_days=${forecastDays}&timezone=Europe%2FHelsinki`

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
