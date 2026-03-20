import { PriceData, TemperatureData } from "./api"

export interface WeatherPeriod {
  label: string // i18n key: "chart.morning" etc.
  temperature: number | null
  weatherCode: number | null
  isDay: boolean
}

export interface DailyWeatherCard {
  dateKey: string // YYYY-MM-DD in Finnish timezone
  periods: WeatherPeriod[]
  priceMin: number | null
  priceMax: number | null
  priceAvg: number | null
}

export interface BlockWeatherCard {
  label: string // i18n key: "chart.morning" etc.
  timeRange: string // "00–06", "06–12", etc.
  temperature: number | null
  weatherCode: number | null
  isDay: boolean
  priceMin: number | null
  priceMax: number | null
  priceAvg: number | null
}

const PERIOD_CONFIG = [
  { key: "chart.night", startHour: 0, endHour: 6, repHour: 2, isDay: false },
  { key: "chart.morning", startHour: 6, endHour: 12, repHour: 9, isDay: true },
  { key: "chart.day", startHour: 12, endHour: 18, repHour: 14, isDay: true },
  { key: "chart.evening", startHour: 18, endHour: 24, repHour: 20, isDay: false },
]

const BLOCK_CONFIG = [
  { key: "chart.night", range: "00–06", startHour: 0, endHour: 6, repHour: 3, isDay: false },
  { key: "chart.morning", range: "06–12", startHour: 6, endHour: 12, repHour: 9, isDay: true },
  { key: "chart.day", range: "12–18", startHour: 12, endHour: 18, repHour: 15, isDay: true },
  { key: "chart.evening", range: "18–00", startHour: 18, endHour: 24, repHour: 21, isDay: false },
]

function getFinnishDateKey(dateStr: string): string {
  const d = new Date(dateStr)
  // Format as YYYY-MM-DD in Finnish timezone
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Helsinki" })
}

function getFinnishHour(dateStr: string): number {
  const d = new Date(dateStr)
  return parseInt(d.toLocaleString("en-US", { timeZone: "Europe/Helsinki", hour: "numeric", hour12: false }))
}

function calcStats(prices: PriceData[]): { min: number | null; max: number | null; avg: number | null } {
  if (prices.length === 0) return { min: null, max: null, avg: null }
  const values = prices.map((p) => p.value)
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
  }
}

export function groupByDay(
  prices: PriceData[],
  temperatures: TemperatureData[]
): DailyWeatherCard[] {
  // Group by Finnish calendar date
  const dateMap = new Map<string, { prices: PriceData[]; temps: TemperatureData[] }>()

  for (const p of prices) {
    const key = getFinnishDateKey(p.date)
    if (!dateMap.has(key)) dateMap.set(key, { prices: [], temps: [] })
    dateMap.get(key)!.prices.push(p)
  }

  for (const t of temperatures) {
    const key = getFinnishDateKey(t.date)
    if (!dateMap.has(key)) dateMap.set(key, { prices: [], temps: [] })
    dateMap.get(key)!.temps.push(t)
  }

  const result: DailyWeatherCard[] = []

  for (const [dateKey, data] of Array.from(dateMap)) {
    const periods: WeatherPeriod[] = PERIOD_CONFIG.map((cfg) => {
      // Find the temperature entry closest to the representative hour
      const rep = data.temps.find((t: TemperatureData) => getFinnishHour(t.date) === cfg.repHour)
      return {
        label: cfg.key,
        temperature: rep ? Math.round(rep.temperature) : null,
        weatherCode: rep?.weatherCode ?? null,
        isDay: rep?.isDay ?? cfg.isDay,
      }
    })

    const stats = calcStats(data.prices)

    result.push({
      dateKey,
      periods,
      priceMin: stats.min,
      priceMax: stats.max,
      priceAvg: stats.avg,
    })
  }

  // Sort by date ascending
  result.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  return result
}

export function groupByBlock(
  prices: PriceData[],
  temperatures: TemperatureData[]
): BlockWeatherCard[] {
  return BLOCK_CONFIG.map((cfg) => {
    const blockPrices = prices.filter((p) => {
      const h = getFinnishHour(p.date)
      return h >= cfg.startHour && h < cfg.endHour
    })

    const blockTemps = temperatures.filter((t) => {
      const h = getFinnishHour(t.date)
      return h >= cfg.startHour && h < cfg.endHour
    })

    // Average temperature
    const avgTemp =
      blockTemps.length > 0
        ? Math.round(blockTemps.reduce((sum, t) => sum + t.temperature, 0) / blockTemps.length)
        : null

    // Representative hour for weather icon
    const rep = blockTemps.find((t) => getFinnishHour(t.date) === cfg.repHour) || blockTemps[0]

    const stats = calcStats(blockPrices)

    return {
      label: cfg.key,
      timeRange: cfg.range,
      temperature: avgTemp,
      weatherCode: rep?.weatherCode ?? null,
      isDay: rep?.isDay ?? cfg.isDay,
      priceMin: stats.min,
      priceMax: stats.max,
      priceAvg: stats.avg,
    }
  })
}
