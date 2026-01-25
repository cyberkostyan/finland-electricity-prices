"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { formatPrice, getPriceColor } from "@/lib/utils"
import { PriceData } from "@/lib/api"

interface PriceDisplayProps {
  currentPrice: PriceData | null
  previousPrice: PriceData | null
  loading?: boolean
}

export function PriceDisplay({
  currentPrice,
  previousPrice,
  loading,
}: PriceDisplayProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Current Price</CardTitle>
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
  const prevPrice = previousPrice?.value ?? price
  const trend = price - prevPrice
  const trendPercent =
    prevPrice !== 0 ? ((price - prevPrice) / prevPrice) * 100 : 0

  const getBadgeVariant = (price: number) => {
    if (price < 5) return "success"
    if (price < 10) return "warning"
    return "danger"
  }

  const getTrendIcon = () => {
    if (Math.abs(trend) < 0.1)
      return <Minus className="h-4 w-4 text-muted-foreground" />
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-red-500" />
    return <TrendingDown className="h-4 w-4 text-green-500" />
  }

  const getPriceLevel = (price: number) => {
    if (price < 5) return "Cheap"
    if (price < 10) return "Normal"
    return "Expensive"
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Current Price</CardTitle>
          <Badge variant={getBadgeVariant(price)}>{getPriceLevel(price)}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2">
          <span className={`text-4xl font-bold ${getPriceColor(price)}`}>
            {formatPrice(price)}
          </span>
          <span className="text-muted-foreground mb-1">c/kWh</span>
        </div>
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          {getTrendIcon()}
          <span className={trend > 0 ? "text-red-500" : "text-green-500"}>
            {trend > 0 ? "+" : ""}
            {formatPrice(trend)} ({trendPercent > 0 ? "+" : ""}
            {trendPercent.toFixed(1)}%)
          </span>
          <span>vs last hour</span>
        </div>
      </CardContent>
    </Card>
  )
}
