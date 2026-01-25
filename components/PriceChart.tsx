"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { PriceData, calculateStats } from "@/lib/api"
import { formatPrice } from "@/lib/utils"

interface PriceChartProps {
  prices: PriceData[]
  predictions?: PriceData[]
  view: "24h" | "7d" | "30d"
  onViewChange: (view: "24h" | "7d" | "30d") => void
  loading?: boolean
}

interface ChartDataPoint {
  time: string
  timeKey: string
  fullTime: string
  price?: number
  prediction?: number
  date: Date
  isCurrent?: boolean
  isPrediction?: boolean
}

export function PriceChart({
  prices,
  predictions = [],
  view,
  onViewChange,
  loading,
}: PriceChartProps) {
  const stats = calculateStats(prices)

  const now = new Date()
  // Get current hour start in UTC for comparison with API data
  const currentHourUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours())

  // Find the last official price timestamp
  const lastPriceTime = prices.length > 0
    ? new Date(prices[prices.length - 1].date).getTime()
    : 0

  // Limit predictions based on view
  const getPredictionLimit = (): number => {
    switch (view) {
      case "24h":
        return 24 // Show only 24 hours of predictions
      case "7d":
        return 24 * 7 // Show up to 7 days
      case "30d":
        return 24 * 7 // Predictions are only ~7 days anyway
    }
  }

  // Filter predictions to only show data after official prices, with limit
  const futurePredictions = predictions
    .filter(p => {
      const predTime = new Date(p.date).getTime()
      return predTime > lastPriceTime
    })
    .slice(0, getPredictionLimit())

  const formatTime = (date: Date): string => {
    if (view === "24h") {
      return date.toLocaleTimeString("fi-FI", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } else if (view === "7d") {
      return date.toLocaleDateString("fi-FI", {
        weekday: "short",
        day: "numeric",
      })
    } else {
      return date.toLocaleDateString("fi-FI", {
        day: "numeric",
        month: "short",
      })
    }
  }

  // Build chart data from prices
  const priceData: ChartDataPoint[] = prices.map((p, index) => {
    const date = new Date(p.date)
    const isCurrent = date.getTime() === currentHourUTC

    return {
      time: formatTime(date),
      timeKey: `price-${index}`,
      fullTime: date.toLocaleString("fi-FI"),
      price: p.value,
      date,
      isCurrent,
      isPrediction: false,
    }
  })

  // Add predictions to chart data
  const predictionData: ChartDataPoint[] = futurePredictions.map((p, index) => {
    const date = new Date(p.date)

    return {
      time: formatTime(date),
      timeKey: `pred-${index}`,
      fullTime: date.toLocaleString("fi-FI"),
      prediction: p.value,
      date,
      isCurrent: false,
      isPrediction: true,
    }
  })

  // Add bridge point: last price also as prediction start
  if (prices.length > 0 && futurePredictions.length > 0) {
    const lastPrice = prices[prices.length - 1]
    const bridgeDate = new Date(lastPrice.date)
    priceData[priceData.length - 1].prediction = lastPrice.value
  }

  // Combine data
  const chartData: ChartDataPoint[] = [...priceData, ...predictionData]

  // Find current data point
  const currentIndex = chartData.findIndex(d => d.isCurrent)

  const getPriceColor = (price: number) => {
    if (price < 5) return "hsl(142, 76%, 36%)"
    if (price < 10) return "hsl(48, 96%, 53%)"
    return "hsl(0, 84%, 60%)"
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as ChartDataPoint
      const value = data.price ?? data.prediction ?? 0
      const isPred = data.isPrediction || (!data.price && data.prediction)
      return (
        <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg shadow-xl px-3 py-2">
          <p className="text-xs text-muted-foreground mb-1">
            {data.fullTime}
            {isPred && <span className="ml-2 text-cyan-500">(prediction)</span>}
          </p>
          <p className="text-lg font-bold" style={{ color: isPred ? "#06b6d4" : getPriceColor(value) }}>
            {formatPrice(value)} <span className="text-xs font-normal text-muted-foreground">c/kWh</span>
          </p>
        </div>
      )
    }
    return null
  }

  // Calculate dynamic tick interval based on data length
  const getTickInterval = () => {
    const dataLen = chartData.length
    if (view === "24h") {
      // For 24h + predictions, show ~8-10 ticks
      return Math.max(4, Math.ceil(dataLen / 10))
    }
    if (view === "7d") return Math.ceil(dataLen / 7)
    return Math.ceil(dataLen / 10)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Price History</CardTitle>
          <Tabs value={view} onValueChange={(v) => onViewChange(v as any)}>
            <TabsList className="grid grid-cols-3 w-auto">
              <TabsTrigger value="24h" className="text-xs px-3">24h</TabsTrigger>
              <TabsTrigger value="7d" className="text-xs px-3">7 Days</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs px-3">30 Days</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <div className="h-[280px] px-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: 20, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    interval={getTickInterval()}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value.toFixed(1)}`}
                    domain={["dataMin - 2", "dataMax + 2"]}
                    width={45}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <ReferenceLine
                    y={stats.avg}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                    label={{
                      value: `Avg ${stats.avg.toFixed(1)}`,
                      position: "insideTopRight",
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 10,
                    }}
                  />
                  {/* Official prices - solid area */}
                  <Area
                    type="natural"
                    dataKey="price"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#priceGradient)"
                    isAnimationActive={false}
                    connectNulls={false}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props
                      if (payload?.isCurrent && cx && cy) {
                        return (
                          <g key="current-time-marker">
                            <line
                              x1={cx}
                              y1={20}
                              x2={cx}
                              y2={260}
                              stroke="#f59e0b"
                              strokeWidth={2}
                              strokeOpacity={0.8}
                            />
                            <text
                              x={cx}
                              y={12}
                              textAnchor="middle"
                              fill="#f59e0b"
                              fontSize={11}
                              fontWeight={700}
                            >
                              Now
                            </text>
                            <circle
                              cx={cx}
                              cy={cy}
                              r={6}
                              fill="#f59e0b"
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          </g>
                        )
                      }
                      return <g key={`dot-${payload?.timeKey}`} />
                    }}
                    activeDot={{
                      r: 4,
                      fill: "hsl(var(--background))",
                      stroke: "hsl(var(--primary))",
                      strokeWidth: 2
                    }}
                  />
                  {/* Predictions - dashed line */}
                  {futurePredictions.length > 0 && (
                    <Line
                      type="natural"
                      dataKey="prediction"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      strokeDasharray="6 4"
                      isAnimationActive={false}
                      connectNulls={true}
                      dot={false}
                      activeDot={{
                        r: 4,
                        fill: "#06b6d4",
                        stroke: "#fff",
                        strokeWidth: 2
                      }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {/* Legend for predictions */}
            {futurePredictions.length > 0 && (
              <div className="flex items-center justify-center gap-6 px-4 py-2 text-xs text-muted-foreground border-t">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-primary" />
                  <span>Official price</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-cyan-500" />
                  <span>ML Prediction</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-3 gap-4 p-4 border-t bg-muted/30">
              <div className="text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Min</div>
                <div className="font-bold text-green-600 dark:text-green-400">
                  {formatPrice(stats.min)} <span className="text-xs font-normal">c/kWh</span>
                </div>
              </div>
              <div className="text-center border-x border-border/50">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Average</div>
                <div className="font-bold">
                  {formatPrice(stats.avg)} <span className="text-xs font-normal text-muted-foreground">c/kWh</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Max</div>
                <div className="font-bold text-red-600 dark:text-red-400">
                  {formatPrice(stats.max)} <span className="text-xs font-normal">c/kWh</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
