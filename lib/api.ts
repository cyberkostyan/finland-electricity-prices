export interface PriceData {
  date: string
  value: number
  isPrediction?: boolean
}

export interface CheapHour {
  aikaleima_suomi: string
  hinta: number
}

export async function fetchPrices(start: Date, end: Date): Promise<PriceData[]> {
  const startStr = start.toISOString()
  const endStr = end.toISOString()

  const response = await fetch(
    `/api/prices?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`
  )

  if (!response.ok) {
    throw new Error("Failed to fetch prices")
  }

  const data = await response.json()
  return data.prices || []
}

export async function fetchPredictions(): Promise<PriceData[]> {
  const response = await fetch("/api/prices/prediction")

  if (!response.ok) {
    throw new Error("Failed to fetch predictions")
  }

  const data = await response.json()
  return data.predictions || []
}

export async function fetchCheapestHours(hours: number = 3, deadline?: Date): Promise<CheapHour[]> {
  const params = new URLSearchParams({ hours: hours.toString() })
  if (deadline) {
    params.set("deadline", deadline.toISOString())
  }

  const response = await fetch(`/api/prices/cheap?${params}`)

  if (!response.ok) {
    throw new Error("Failed to fetch cheapest hours")
  }

  return response.json()
}

export function getCurrentPrice(prices: PriceData[]): PriceData | null {
  const now = new Date()
  const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())

  return prices.find(p => {
    const priceDate = new Date(p.date)
    return priceDate.getTime() === currentHour.getTime()
  }) || prices[prices.length - 1] || null
}

export function getPreviousPrice(prices: PriceData[]): PriceData | null {
  const now = new Date()
  const prevHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 1)

  return prices.find(p => {
    const priceDate = new Date(p.date)
    return priceDate.getTime() === prevHour.getTime()
  }) || null
}

export function calculateStats(prices: PriceData[]): {
  min: number
  max: number
  avg: number
} {
  if (prices.length === 0) {
    return { min: 0, max: 0, avg: 0 }
  }

  const values = prices.map(p => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const avg = values.reduce((a, b) => a + b, 0) / values.length

  return { min, max, avg }
}
