import { NextRequest, NextResponse } from "next/server"

interface PriceData {
  date: string
  value: number
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const hours = parseInt(searchParams.get("hours") || "5", 10)

  try {
    // Get prices for the next 48 hours from sahkotin.fi
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
    const end = new Date(start)
    end.setHours(end.getHours() + 48)

    const url = `https://sahkotin.fi/prices?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}&fix&vat`

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    const data = await response.json()
    const prices: PriceData[] = data.prices || []

    // Filter only future hours (starting from next hour)
    const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1)
    const futurePrices = prices.filter(p => new Date(p.date) >= nextHour)

    // Sort by price (ascending) and take the cheapest N hours
    const sortedPrices = [...futurePrices].sort((a, b) => a.value - b.value)
    const cheapestHours = sortedPrices.slice(0, hours)

    // Sort by time for display
    cheapestHours.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Transform to expected format
    const result = cheapestHours.map(p => ({
      aikaleima_suomi: p.date,
      hinta: p.value
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error fetching cheapest hours:", error)
    return NextResponse.json(
      { error: "Failed to fetch cheapest hours" },
      { status: 500 }
    )
  }
}
