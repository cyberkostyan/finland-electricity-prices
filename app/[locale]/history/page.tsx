"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { MonthlyStatsCard } from "@/components/MonthlyStatsCard"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { Zap, ArrowLeft, Loader2 } from "lucide-react"
import { fetchPrices, type PriceData } from "@/lib/api"

interface DailyAverage {
  date: string
  avg: number
  min: number
  max: number
}

interface MonthData {
  month: string
  monthNum: number
  year: number
  data: DailyAverage[]
  stats: {
    min: number
    max: number
    avg: number
  }
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

function groupByDay(prices: PriceData[]): DailyAverage[] {
  const days = new Map<string, PriceData[]>()

  prices.forEach((p) => {
    const date = new Date(p.date)
    const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    if (!days.has(dayKey)) {
      days.set(dayKey, [])
    }
    days.get(dayKey)!.push(p)
  })

  return Array.from(days.entries())
    .map(([date, dayPrices]) => {
      const values = dayPrices.map((p) => p.value)
      return {
        date,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

function calculateMonthStats(data: DailyAverage[]): {
  min: number
  max: number
  avg: number
} {
  if (data.length === 0) return { min: 0, max: 0, avg: 0 }

  const allMins = data.map((d) => d.min)
  const allMaxs = data.map((d) => d.max)
  const allAvgs = data.map((d) => d.avg)

  return {
    min: Math.min(...allMins),
    max: Math.max(...allMaxs),
    avg: allAvgs.reduce((a, b) => a + b, 0) / allAvgs.length,
  }
}

export default function HistoryPage() {
  const t = useTranslations()
  const [months, setMonths] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true)
        setError(null)

        // Load last 12 months of data
        const now = new Date()
        const monthsData: MonthData[] = []

        // Fetch data for each month (we'll do 6 months to avoid too many requests)
        for (let i = 0; i < 6; i++) {
          const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const startOfMonth = new Date(
            monthDate.getFullYear(),
            monthDate.getMonth(),
            1
          )
          const endOfMonth = new Date(
            monthDate.getFullYear(),
            monthDate.getMonth() + 1,
            0,
            23,
            59,
            59
          )

          // Skip future dates
          if (startOfMonth > now) continue

          // Adjust end date if it's the current month
          const adjustedEnd = endOfMonth > now ? now : endOfMonth

          try {
            const prices = await fetchPrices(startOfMonth, adjustedEnd)

            if (prices.length > 0) {
              const dailyData = groupByDay(prices)
              const stats = calculateMonthStats(dailyData)

              monthsData.push({
                month: MONTH_NAMES[monthDate.getMonth()],
                monthNum: monthDate.getMonth(),
                year: monthDate.getFullYear(),
                data: dailyData,
                stats,
              })
            }
          } catch (e) {
            console.error(
              `Failed to load data for ${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`
            )
          }
        }

        setMonths(monthsData)
      } catch (e) {
        console.error("Failed to load history:", e)
        setError("Failed to load historical data")
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-2 bg-primary rounded-lg">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{t("history.title")}</h1>
              <p className="text-muted-foreground text-sm">
                {t("history.description")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center text-destructive py-8">{error}</div>
        ) : months.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            {t("history.noData")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {months.map((monthData, index) => (
              <MonthlyStatsCard
                key={`${monthData.year}-${monthData.monthNum}`}
                month={monthData.month}
                year={monthData.year}
                data={monthData.data}
                stats={monthData.stats}
                previousAvg={
                  index < months.length - 1
                    ? months[index + 1]?.stats.avg
                    : undefined
                }
              />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>
            {t("footer.data")}:{" "}
            <a
              href="https://sahkotin.fi"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              sahkotin.fi
            </a>
            {" • "}{t("footer.vatNote")}
          </p>
        </footer>
      </div>
    </main>
  )
}
