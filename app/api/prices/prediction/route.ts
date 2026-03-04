import { NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"

const PREDICTION_API_URL =
  "https://raw.githubusercontent.com/vividfog/nordpool-predict-fi/main/deploy/prediction.json"

const DB_SAVE_TIMEOUT_MS = 5000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ])
}

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

    // Await DB save before returning (Vercel kills detached promises after response)
    try {
      await withTimeout(savePredictionsToDb(predictions), DB_SAVE_TIMEOUT_MS)
    } catch (err) {
      console.error("Failed to save predictions to DB:", err)
    }

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
    console.warn("savePredictionsToDb: Prisma unavailable, skipping DB save")
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
  const result = await prisma.predictionSnapshot.createMany({
    data: predictions.map((p) => ({
      fetchedAt,
      targetTime: new Date(p.date),
      predictedPrice: p.value,
    })),
    skipDuplicates: true,
  })

  console.log(
    `savePredictionsToDb: saved ${result.count} predictions for fetchedAt=${fetchedAt.toISOString()}`
  )
}
