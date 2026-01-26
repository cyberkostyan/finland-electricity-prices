"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { PriceDisplay } from "@/components/PriceDisplay"
import { PriceChart } from "@/components/PriceChart"
import { BestHours } from "@/components/BestHours"
import {
  fetchPrices,
  fetchPredictions,
  getCurrentPrice,
  getPreviousPrice,
  type PriceData,
} from "@/lib/api"
import { Link } from "@/i18n/navigation"
import { Zap, RefreshCw, History, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"

export default function Home() {
  const t = useTranslations()
  const [prices, setPrices] = useState<PriceData[]>([])
  const [predictions, setPredictions] = useState<PriceData[]>([])
  const [view, setView] = useState<"24h" | "7d" | "30d">("24h")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const getDateRange = useCallback((view: "24h" | "7d" | "30d") => {
    const end = new Date()
    end.setHours(end.getHours() + 24) // Include future prices for today/tomorrow
    const start = new Date()

    switch (view) {
      case "24h":
        start.setHours(start.getHours() - 24)
        break
      case "7d":
        start.setDate(start.getDate() - 7)
        break
      case "30d":
        start.setDate(start.getDate() - 30)
        break
    }

    return { start, end }
  }, [])

  const loadPrices = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true)
        } else {
          setLoading(true)
        }

        const { start, end } = getDateRange(view)

        // Fetch prices and predictions in parallel
        const [pricesData, predictionsData] = await Promise.all([
          fetchPrices(start, end),
          fetchPredictions().catch(() => []), // Don't fail if predictions unavailable
        ])

        setPrices(pricesData)
        setPredictions(predictionsData)
        setLastUpdate(new Date())
        setRefreshTrigger((t) => t + 1)
      } catch (error) {
        console.error("Failed to load prices:", error)
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [view, getDateRange]
  )

  useEffect(() => {
    loadPrices()
  }, [loadPrices])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadPrices(true)
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [loadPrices])

  const currentPrice = getCurrentPrice(prices)
  const previousPrice = getPreviousPrice(prices)

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                <span className="sm:hidden">{t("common.appNameShort")}</span>
                <span className="hidden sm:inline">{t("common.appName")}</span>
              </h1>
              <p className="text-muted-foreground text-sm hidden sm:block">
                {t("common.tagline")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {lastUpdate && (
              <span className="text-sm text-muted-foreground hidden md:block">
                {t("common.updated")}: {lastUpdate.toLocaleTimeString("fi-FI")}
              </span>
            )}
            <Link href="/history">
              <Button variant="outline" size="sm">
                <History className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t("common.history")}</span>
              </Button>
            </Link>
            <Link href="/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <LanguageSwitcher />
            <ThemeToggle />
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPrices(true)}
              disabled={refreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">{t("common.refresh")}</span>
            </Button>
          </div>
        </div>

        {/* Top Row - Current Price & Best Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <PriceDisplay
            currentPrice={currentPrice}
            previousPrice={previousPrice}
            loading={loading}
          />
          <BestHours refreshTrigger={refreshTrigger} compact />
        </div>

        {/* Chart - Full Width */}
        <PriceChart
          prices={prices}
          predictions={predictions}
          view={view}
          onViewChange={setView}
          loading={loading}
        />

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
            {" • "}{t("footer.predictions")}: {" "}
            <a
              href="https://github.com/vividfog/nordpool-predict-fi"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              nordpool-predict-fi
            </a>
          </p>
          <p className="mt-2">{t("footer.vatNote")}</p>
        </footer>
      </div>
    </main>
  )
}
