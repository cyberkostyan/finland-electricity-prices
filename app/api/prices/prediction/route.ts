import { NextResponse } from "next/server"

const PREDICTION_API_URL =
  "https://raw.githubusercontent.com/vividfog/nordpool-predict-fi/main/deploy/prediction.json"

export async function GET() {
  try {
    const response = await fetch(PREDICTION_API_URL, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch predictions: ${response.status}`)
    }

    const data: [number, number][] = await response.json()

    // Transform to our format: { date: ISO string, value: price in c/kWh }
    const predictions = data.map(([timestamp, price]) => ({
      date: new Date(timestamp).toISOString(),
      value: price,
      isPrediction: true,
    }))

    return NextResponse.json({ predictions })
  } catch (error) {
    console.error("Error fetching predictions:", error)
    return NextResponse.json(
      { error: "Failed to fetch price predictions" },
      { status: 500 }
    )
  }
}
