"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Zap } from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface CheapHour {
  aikaleima_suomi: string
  hinta: number
}

interface BestHoursProps {
  refreshTrigger?: number
  compact?: boolean
}

export function BestHours({ refreshTrigger, compact = false }: BestHoursProps) {
  const [cheapestHours, setCheapestHours] = useState<CheapHour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCheapestHours() {
      try {
        setLoading(true)
        const response = await fetch("/api/prices/cheap?hours=5")
        if (!response.ok) throw new Error("Failed to fetch")
        const data = await response.json()
        setCheapestHours(data)
        setError(null)
      } catch (err) {
        setError("Failed to load cheapest hours")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchCheapestHours()
  }, [refreshTrigger])

  const formatHourTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("fi-FI", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatHourDate = (timestamp: string) => {
    const date = new Date(timestamp)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return "Today"
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow"
    }
    return date.toLocaleDateString("fi-FI", { weekday: "short", day: "numeric" })
  }

  const isCurrentHour = (timestamp: string) => {
    const hourDate = new Date(timestamp)
    const now = new Date()
    return (
      hourDate.getHours() === now.getHours() &&
      hourDate.toDateString() === now.toDateString()
    )
  }

  const isPastHour = (timestamp: string) => {
    const hourDate = new Date(timestamp)
    const now = new Date()
    return hourDate < new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
  }

  // Compact mode - horizontal grid
  if (compact) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            <CardTitle className="text-base font-medium">Best Hours</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {loading ? (
            <div className="grid grid-cols-5 gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-16 bg-muted rounded-lg" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center text-muted-foreground py-2 text-sm">{error}</div>
          ) : cheapestHours.length === 0 ? (
            <div className="text-center text-muted-foreground py-2 text-sm">
              No data
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {cheapestHours.slice(0, 5).map((hour, index) => {
                const current = isCurrentHour(hour.aikaleima_suomi)
                const past = isPastHour(hour.aikaleima_suomi)

                return (
                  <div
                    key={hour.aikaleima_suomi}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-colors ${
                      current
                        ? "bg-green-100 dark:bg-green-900/30 border border-green-500"
                        : past
                        ? "opacity-50 bg-muted/50"
                        : index === 0
                        ? "bg-green-500/10 border border-green-500/30"
                        : "bg-muted/50"
                    }`}
                  >
                    <div className={`text-sm font-bold ${current ? "text-green-600" : ""}`}>
                      {formatHourTime(hour.aikaleima_suomi)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {formatHourDate(hour.aikaleima_suomi)}
                    </div>
                    <div className={`text-xs font-semibold mt-1 ${
                      index === 0 ? "text-green-600" : "text-green-600/80"
                    }`}>
                      {formatPrice(hour.hinta)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Full mode - vertical list
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          <CardTitle className="text-lg font-medium">
            Best Hours to Use Electricity
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-16 mt-1" />
                </div>
                <div className="h-6 bg-muted rounded w-20" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-muted-foreground py-4">{error}</div>
        ) : cheapestHours.length === 0 ? (
          <div className="text-center text-muted-foreground py-4">
            No price data available
          </div>
        ) : (
          <div className="space-y-2">
            {cheapestHours.map((hour, index) => {
              const current = isCurrentHour(hour.aikaleima_suomi)
              const past = isPastHour(hour.aikaleima_suomi)

              return (
                <div
                  key={hour.aikaleima_suomi}
                  className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    current
                      ? "bg-green-100 dark:bg-green-900/30 border border-green-500"
                      : past
                      ? "opacity-50"
                      : "hover:bg-muted"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center h-10 w-10 rounded-full ${
                      index === 0
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {formatHourTime(hour.aikaleima_suomi)}
                      {current && (
                        <Badge variant="success" className="ml-2">
                          Now
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatHourDate(hour.aikaleima_suomi)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-green-600">
                      {formatPrice(hour.hinta)} c/kWh
                    </div>
                    {index === 0 && (
                      <div className="text-xs text-muted-foreground">
                        Cheapest
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> Schedule high-consumption activities like
            laundry, dishwasher, or EV charging during these hours to save money.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
