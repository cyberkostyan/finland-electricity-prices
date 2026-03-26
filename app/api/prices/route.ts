import { NextRequest, NextResponse } from "next/server"
import { fetchPricesFromSahkotin } from "@/lib/prices"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  if (!start || !end) {
    return NextResponse.json(
      { error: "Missing start or end parameter" },
      { status: 400 }
    )
  }

  try {
    const data = await fetchPricesFromSahkotin(start, end)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching prices:", error)
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    )
  }
}
