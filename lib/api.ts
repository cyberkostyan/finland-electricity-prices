export interface PriceData {
  date: string
  value: number
  isPrediction?: boolean
}

export interface CheapHour {
  aikaleima_suomi: string
  hinta: number
}

export interface TemperatureData {
  date: string
  temperature: number
}

export interface HistoricalPrediction {
  date: string
  value: number
  predictedAt: string
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

export async function fetchWeather(view: "24h" | "7d" | "30d"): Promise<TemperatureData[]> {
  // Adjust past_days and forecast_days based on view
  let pastDays: number
  let forecastDays: number

  switch (view) {
    case "24h":
      pastDays = 1
      forecastDays = 2
      break
    case "7d":
      pastDays = 7
      forecastDays = 7
      break
    case "30d":
      pastDays = 30
      forecastDays = 7
      break
  }

  const response = await fetch(
    `/api/weather?past_days=${pastDays}&forecast_days=${forecastDays}`
  )

  if (!response.ok) {
    throw new Error("Failed to fetch weather data")
  }

  return response.json()
}

export async function fetchHistoricalPredictions(
  start: Date,
  end: Date
): Promise<HistoricalPrediction[]> {
  const startStr = start.toISOString()
  const endStr = end.toISOString()

  const response = await fetch(
    `/api/prices/prediction/history?start=${encodeURIComponent(startStr)}&end=${encodeURIComponent(endStr)}`
  )

  if (!response.ok) {
    throw new Error("Failed to fetch historical predictions")
  }

  const data = await response.json()
  return data.historicalPredictions || []
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

export function getForecastForCurrentHour(
  historicalPredictions: HistoricalPrediction[]
): HistoricalPrediction | null {
  const now = new Date()
  const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())

  return historicalPredictions.find(p => {
    const predDate = new Date(p.date)
    return predDate.getTime() === currentHour.getTime()
  }) || null
}

export function calculateTrends(prices: PriceData[], currentPrice: number): {
  h1: { diff: number; percent: number } | null
  h12: { diff: number; percent: number } | null
  h24: { diff: number; percent: number } | null
} {
  const now = new Date()

  const getPriceAtHoursAgo = (hoursAgo: number): number | null => {
    const targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - hoursAgo)
    const found = prices.find(p => {
      const priceDate = new Date(p.date)
      return priceDate.getTime() === targetTime.getTime()
    })
    return found ? found.value : null
  }

  const calculateTrend = (hoursAgo: number): { diff: number; percent: number } | null => {
    const pastPrice = getPriceAtHoursAgo(hoursAgo)
    if (pastPrice === null) return null
    const diff = currentPrice - pastPrice
    const percent = pastPrice !== 0 ? (diff / pastPrice) * 100 : 0
    return { diff, percent }
  }

  return {
    h1: calculateTrend(1),
    h12: calculateTrend(12),
    h24: calculateTrend(24),
  }
}
