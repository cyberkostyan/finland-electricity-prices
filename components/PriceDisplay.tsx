"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, Target } from "lucide-react"
import { formatPrice, getPriceColor } from "@/lib/utils"
import { PriceData, HistoricalPrediction, calculateTrends, getForecastForCurrentHour } from "@/lib/api"

interface PriceDisplayProps {
  currentPrice: PriceData | null
  prices: PriceData[]
  historicalPredictions?: HistoricalPrediction[]
  loading?: boolean
}

export function PriceDisplay({
  currentPrice,
  prices,
  historicalPredictions = [],
  loading,
}: PriceDisplayProps) {
  const t = useTranslations()

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">{t("price.currentPrice")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-12 w-32 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const price = currentPrice?.value ?? 0
  const trends = calculateTrends(prices, price)
  const forecast = getForecastForCurrentHour(historicalPredictions)

  // Calculate forecast accuracy
  const forecastDiff = forecast ? price - forecast.value : null
  const forecastPercent = forecast && forecast.value !== 0
    ? (forecastDiff! / forecast.value) * 100
    : null

  const getBadgeVariant = (price: number) => {
    if (price < 5) return "success"
    if (price < 10) return "warning"
    return "danger"
  }

  const getTrendIcon = (percent: number) => {
    if (Math.abs(percent) < 1)
      return <Minus className="h-3 w-3 text-muted-foreground" />
    if (percent > 0) return <TrendingUp className="h-3 w-3 text-red-500" />
    return <TrendingDown className="h-3 w-3 text-green-500" />
  }

  const getPriceLevel = (price: number) => {
    if (price < 5) return t("price.cheap")
    if (price < 10) return t("price.normal")
    return t("price.expensive")
  }

  const formatTrendPercent = (percent: number, decimals: number = 0) => {
    const sign = percent > 0 ? "+" : ""
    return `${sign}${percent.toFixed(decimals)}%`
  }

  const getTrendColor = (percent: number) => {
    if (Math.abs(percent) < 1) return "text-muted-foreground"
    return percent < 0 ? "text-green-500" : "text-red-500"
  }

  // For forecast accuracy: green if prediction was close, yellow if moderate, red if far off
  const getForecastAccuracyColor = (percent: number) => {
    const absPercent = Math.abs(percent)
    if (absPercent < 5) return "text-green-500"
    if (absPercent < 15) return "text-yellow-500"
    return "text-red-500"
  }

  const renderTrendItem = (
    label: string,
    trend: { diff: number; percent: number } | null,
    showSeparator: boolean
  ) => {
    if (!trend) return null
    return (
      <>
        {getTrendIcon(trend.percent)}
        <span className="text-muted-foreground">{label}</span>
        <span className={getTrendColor(trend.percent)}>
          {formatTrendPercent(trend.percent)}
        </span>
        {showSeparator && <span className="text-muted-foreground mx-1">|</span>}
      </>
    )
  }

  // Filter available trends
  const availableTrends = [
    { key: "h1", trend: trends.h1, label: t("price.h1") },
    { key: "h12", trend: trends.h12, label: t("price.h12") },
    { key: "h24", trend: trends.h24, label: t("price.h24") },
  ].filter(item => item.trend !== null)

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">{t("price.currentPrice")}</CardTitle>
          <Badge variant={getBadgeVariant(price)}>{getPriceLevel(price)}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <span className={`text-4xl font-bold ${getPriceColor(price)}`}>
            {formatPrice(price)}
          </span>
          <span className="text-muted-foreground mb-1">{t("price.centsPerKwh")}</span>
        </div>
        {availableTrends.length > 0 && (
          <div className="flex items-center gap-1 mt-2 text-sm flex-wrap">
            <span className="text-muted-foreground">{t("price.vs")}:</span>
            {availableTrends.map((item, index) =>
              renderTrendItem(
                item.label,
                item.trend,
                index < availableTrends.length - 1
              )
            )}
          </div>
        )}
        {forecast && forecastPercent !== null && (
          <div className="flex items-center gap-1 mt-1 text-sm">
            <Target className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground ml-1">{t("price.vsForecast")}:</span>
            <span className={getForecastAccuracyColor(forecastPercent)}>
              {formatTrendPercent(forecastPercent, 1)}
            </span>
            <span className="text-muted-foreground">
              ({formatPrice(forecast.value)} {t("price.predicted")})
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
