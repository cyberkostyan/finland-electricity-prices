"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { formatPrice } from "@/lib/utils"
import { TrendingDown, TrendingUp, Minus } from "lucide-react"

interface DailyAverage {
  date: string
  avg: number
  min: number
  max: number
}

interface MonthlyStatsCardProps {
  month: string
  year: number
  data: DailyAverage[]
  stats: {
    min: number
    max: number
    avg: number
  }
  previousAvg?: number
}

export function MonthlyStatsCard({
  month,
  year,
  data,
  stats,
  previousAvg,
}: MonthlyStatsCardProps) {
  const trend = previousAvg ? stats.avg - previousAvg : 0
  const trendPercent = previousAvg ? ((stats.avg - previousAvg) / previousAvg) * 100 : 0

  const getTrendIcon = () => {
    if (Math.abs(trendPercent) < 1) return <Minus className="h-3 w-3" />
    if (trendPercent > 0) return <TrendingUp className="h-3 w-3" />
    return <TrendingDown className="h-3 w-3" />
  }

  const getTrendColor = () => {
    if (Math.abs(trendPercent) < 1) return "text-muted-foreground"
    if (trendPercent > 0) return "text-red-500"
    return "text-green-500"
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DailyAverage
      return (
        <div className="bg-background border rounded-lg shadow-lg p-2 text-xs">
          <p className="font-medium">{new Date(data.date).toLocaleDateString("fi-FI", { day: "numeric", month: "short" })}</p>
          <div className="grid grid-cols-3 gap-2 mt-1">
            <div>
              <span className="text-muted-foreground">Min: </span>
              <span className="text-green-600">{formatPrice(data.min)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Avg: </span>
              <span>{formatPrice(data.avg)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Max: </span>
              <span className="text-red-600">{formatPrice(data.max)}</span>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            {month} {year}
          </CardTitle>
          {previousAvg && (
            <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
              {getTrendIcon()}
              <span>{trendPercent > 0 ? "+" : ""}{trendPercent.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mini Chart */}
        <div className="h-24 px-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <defs>
                <linearGradient id={`gradient-${month}-${year}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="avg"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                fill={`url(#gradient-${month}-${year})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 p-4 pt-2 border-t bg-muted/30">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Min</div>
            <div className="font-semibold text-green-600 text-sm">
              {formatPrice(stats.min)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Avg</div>
            <div className="font-semibold text-sm">
              {formatPrice(stats.avg)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Max</div>
            <div className="font-semibold text-red-600 text-sm">
              {formatPrice(stats.max)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
