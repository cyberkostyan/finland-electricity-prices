import { NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"

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

    // Save predictions to database (non-blocking, don't fail if DB is unavailable)
    savePredictionsToDb(predictions).catch((err) => {
      console.error("Failed to save predictions to DB:", err)
    })

    return NextResponse.json({ predictions })
  } catch (error) {
    console.error("Error fetching predictions:", error)
    return NextResponse.json(
      { error: "Failed to fetch price predictions" },
      { status: 500 }
    )
  }
}

async function savePredictionsToDb(
  predictions: { date: string; value: number }[]
) {
  const prisma = getPrisma()
  if (!prisma) {
    // Database not configured - skip saving
    return
  }

  // Round fetchedAt to the current hour to group predictions
  const now = new Date()
  const fetchedAt = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
    0,
    0,
    0
  )

  // Use createMany with skipDuplicates to efficiently insert predictions
  await prisma.predictionSnapshot.createMany({
    data: predictions.map((p) => ({
      fetchedAt,
      targetTime: new Date(p.date),
      predictedPrice: p.value,
    })),
    skipDuplicates: true,
  })
}
