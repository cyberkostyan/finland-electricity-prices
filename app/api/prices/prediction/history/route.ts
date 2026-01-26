import { NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"

interface PredictionRow {
  targetTime: Date
  predictedPrice: number
  fetchedAt: Date
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startParam = searchParams.get("start")
    const endParam = searchParams.get("end")

    if (!startParam || !endParam) {
      return NextResponse.json(
        { error: "Missing start or end parameter" },
        { status: 400 }
      )
    }

    const start = new Date(startParam)
    const end = new Date(endParam)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      )
    }

    const prisma = getPrisma()
    if (!prisma) {
      // Database not configured - return empty result
      return NextResponse.json({ historicalPredictions: [] })
    }

    // Get the earliest prediction for each target hour within the range
    // This shows what was predicted BEFORE the actual hour arrived
    const predictions = await prisma.$queryRaw<PredictionRow[]>`
      SELECT DISTINCT ON ("targetTime")
        "targetTime",
        "predictedPrice",
        "fetchedAt"
      FROM "PredictionSnapshot"
      WHERE "targetTime" >= ${start}
        AND "targetTime" <= ${end}
        AND "fetchedAt" < "targetTime"
      ORDER BY "targetTime", "fetchedAt" ASC
    `

    const historicalPredictions = predictions.map((p) => ({
      date: p.targetTime.toISOString(),
      value: p.predictedPrice,
      predictedAt: p.fetchedAt.toISOString(),
    }))

    return NextResponse.json({ historicalPredictions })
  } catch (error) {
    console.error("Error fetching historical predictions:", error)
    return NextResponse.json(
      { error: "Failed to fetch historical predictions" },
      { status: 500 }
    )
  }
}
