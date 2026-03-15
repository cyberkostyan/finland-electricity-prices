"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ComposedChart,
  Area,
  Line,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { PriceData, TemperatureData, HistoricalPrediction, calculateStats } from "@/lib/api"
import { getWeatherIcon, getWeatherLabelKey } from "@/lib/weather"
import { formatPrice } from "@/lib/utils"

interface PriceChartProps {
  prices: PriceData[]
  predictions?: PriceData[]
  historicalPredictions?: HistoricalPrediction[]
  temperatures?: TemperatureData[]
  view: "24h" | "7d" | "30d"
  onViewChange: (view: "24h" | "7d" | "30d") => void
  loading?: boolean
  alertThresholds?: {
    enabled: boolean
    lowPrice: number
    highPrice: number
  }
  isDefaultLocation?: boolean
  locationCityName?: string | null
  onRequestLocation?: () => void
}

interface ChartDataPoint {
  time: string
  timeKey: string
  fullTime: string
  price?: number
  prediction?: number
  histPrediction?: number
  temperature?: number
  weatherCode?: number
  isDay?: boolean
  date: Date
  isCurrent?: boolean
  isPrediction?: boolean
}

// Purple color for temperature (distinct from orange "Now" marker)
const TEMP_COLOR = "#8b5cf6"
// Orange color for historical predictions
const HIST_PRED_COLOR = "#f59e0b"

export function PriceChart({
  prices,
  predictions = [],
  historicalPredictions = [],
  temperatures = [],
  view,
  onViewChange,
  loading,
  alertThresholds,
  isDefaultLocation = true,
  locationCityName,
  onRequestLocation,
}: PriceChartProps) {
  const t = useTranslations()
  const [showTemperature, setShowTemperature] = useState(true)
  const [showHistoricalPrediction, setShowHistoricalPrediction] = useState(false)
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

  // Create temperature + weather code lookup maps by hour
  const tempMap = new Map<string, number>()
  const weatherCodeMap = new Map<string, number>()
  const isDayMap = new Map<string, boolean>()
  temperatures.forEach(t => {
    const date = new Date(t.date)
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
    tempMap.set(key, t.temperature)
    if (t.weatherCode !== undefined) weatherCodeMap.set(key, t.weatherCode)
    if (t.isDay !== undefined) isDayMap.set(key, t.isDay)
  })

  const getTemperature = (date: Date): number | undefined => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
    return tempMap.get(key)
  }

  const getWeatherData = (date: Date): { weatherCode?: number; isDay?: boolean } => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
    return { weatherCode: weatherCodeMap.get(key), isDay: isDayMap.get(key) }
  }

  // Create historical prediction lookup map by hour
  const histPredMap = new Map<string, number>()
  historicalPredictions.forEach(p => {
    const date = new Date(p.date)
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
    histPredMap.set(key, p.value)
  })

  const getHistoricalPrediction = (date: Date): number | undefined => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
    return histPredMap.get(key)
  }

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
    const weather = getWeatherData(date)

    return {
      time: formatTime(date),
      timeKey: `price-${index}`,
      fullTime: date.toLocaleString("fi-FI"),
      price: p.value,
      histPrediction: showHistoricalPrediction ? getHistoricalPrediction(date) : undefined,
      temperature: getTemperature(date),
      weatherCode: weather.weatherCode,
      isDay: weather.isDay,
      date,
      isCurrent,
      isPrediction: false,
    }
  })

  // Add predictions to chart data
  const predictionData: ChartDataPoint[] = futurePredictions.map((p, index) => {
    const date = new Date(p.date)
    const weather = getWeatherData(date)

    return {
      time: formatTime(date),
      timeKey: `pred-${index}`,
      fullTime: date.toLocaleString("fi-FI"),
      prediction: p.value,
      temperature: getTemperature(date),
      weatherCode: weather.weatherCode,
      isDay: weather.isDay,
      date,
      isCurrent: false,
      isPrediction: true,
    }
  })

  // Add bridge point: last price also as prediction start
  if (prices.length > 0 && futurePredictions.length > 0) {
    const lastPrice = prices[prices.length - 1]
    priceData[priceData.length - 1].prediction = lastPrice.value
  }

  // Combine data
  const chartData: ChartDataPoint[] = [...priceData, ...predictionData]

  // Check if we have temperature data
  const hasTemperature = chartData.some(d => d.temperature !== undefined)
  const displayTemperature = hasTemperature && showTemperature

  // Check if we have historical prediction data
  const hasHistoricalPrediction = historicalPredictions.length > 0
  const displayHistoricalPrediction = hasHistoricalPrediction && showHistoricalPrediction

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
            {isPred && <span className="ml-2 text-cyan-500">({t("chart.prediction")})</span>}
          </p>
          <p className="text-lg font-bold" style={{ color: isPred ? "#06b6d4" : getPriceColor(value) }}>
            {formatPrice(value)} <span className="text-xs font-normal text-muted-foreground">{t("price.centsPerKwh")}</span>
          </p>
          {data.histPrediction !== undefined && showHistoricalPrediction && (
            <p className="text-sm mt-1" style={{ color: HIST_PRED_COLOR }}>
              {t("chart.historicalPrediction")}: {formatPrice(data.histPrediction)} {t("price.centsPerKwh")}
            </p>
          )}
          {data.temperature !== undefined && showTemperature && (
            <p className="text-sm mt-1" style={{ color: TEMP_COLOR }}>
              {data.weatherCode !== undefined && (
                <span className="mr-1">
                  {getWeatherIcon(data.weatherCode, data.isDay ?? true)}
                </span>
              )}
              {data.weatherCode !== undefined && (
                <span className="mr-1">{t(getWeatherLabelKey(data.weatherCode))}</span>
              )}
              <span>· {data.temperature.toFixed(1)}°C</span>
            </p>
          )}
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
          <CardTitle className="text-lg font-medium">{t("price.priceHistory")}</CardTitle>
          <Tabs value={view} onValueChange={(v) => onViewChange(v as any)}>
            <TabsList className="grid grid-cols-3 w-auto">
              <TabsTrigger value="24h" className="text-xs px-3">{t("chart.24h")}</TabsTrigger>
              <TabsTrigger value="7d" className="text-xs px-3">{t("chart.7days")}</TabsTrigger>
              <TabsTrigger value="30d" className="text-xs px-3">{t("chart.30days")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-4 py-0">
        {loading ? (
          <div className="h-[280px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartData}
                  margin={{ top: 20, right: displayTemperature ? 0 : 20, left: 0, bottom: 0 }}
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
                    yAxisId="price"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value.toFixed(1)}`}
                    domain={["dataMin - 2", "dataMax + 2"]}
                    width={45}
                  />
                  {displayTemperature && (
                    <YAxis
                      yAxisId="temp"
                      orientation="right"
                      tick={{ fontSize: 11, fill: TEMP_COLOR }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${Math.round(value)}°`}
                      domain={["dataMin - 5", "dataMax + 5"]}
                      width={35}
                    />
                  )}
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <ReferenceLine
                    yAxisId="price"
                    y={stats.avg}
                    stroke="hsl(var(--muted-foreground))"
                    strokeDasharray="4 4"
                    strokeOpacity={0.6}
                    label={{
                      value: `${t("price.avg")} ${stats.avg.toFixed(1)}`,
                      position: "insideTopRight",
                      fill: "hsl(var(--muted-foreground))",
                      fontSize: 10,
                    }}
                  />
                  {/* Low price alert threshold (green) */}
                  {alertThresholds?.enabled && (
                    <ReferenceLine
                      yAxisId="price"
                      y={alertThresholds.lowPrice}
                      stroke="#22c55e"
                      strokeDasharray="6 3"
                      strokeOpacity={0.8}
                      label={{
                        value: `< ${alertThresholds.lowPrice}`,
                        position: "insideBottomLeft",
                        fill: "#22c55e",
                        fontSize: 10,
                      }}
                    />
                  )}
                  {/* High price alert threshold (red) */}
                  {alertThresholds?.enabled && (
                    <ReferenceLine
                      yAxisId="price"
                      y={alertThresholds.highPrice}
                      stroke="#ef4444"
                      strokeDasharray="6 3"
                      strokeOpacity={0.8}
                      label={{
                        value: `> ${alertThresholds.highPrice}`,
                        position: "insideTopLeft",
                        fill: "#ef4444",
                        fontSize: 10,
                      }}
                    />
                  )}
                  {/* Temperature line */}
                  {displayTemperature && (
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="temperature"
                      stroke={TEMP_COLOR}
                      strokeWidth={1.5}
                      strokeOpacity={0.7}
                      isAnimationActive={false}
                      connectNulls={true}
                      dot={false}
                    />
                  )}
                  {/* Official prices - solid area */}
                  <Area
                    yAxisId="price"
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
                              {t("common.now")}
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
                      yAxisId="price"
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
                  {/* Historical predictions - orange scatter points */}
                  {displayHistoricalPrediction && (
                    <Scatter
                      yAxisId="price"
                      dataKey="histPrediction"
                      fill={HIST_PRED_COLOR}
                      stroke="#fff"
                      strokeWidth={2}
                      isAnimationActive={false}
                      shape={(props: unknown) => {
                        const p = props as { cx?: number; cy?: number }
                        if (p.cx && p.cy) {
                          return (
                            <circle
                              cx={p.cx}
                              cy={p.cy}
                              r={6}
                              fill={HIST_PRED_COLOR}
                              stroke="#fff"
                              strokeWidth={2}
                            />
                          )
                        }
                        return <g />
                      }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            {/* Weather icon strip */}
            {displayTemperature && view !== "30d" && (
              <WeatherIconStrip chartData={chartData} view={view} />
            )}
            {/* Legend */}
            <div className="flex items-center justify-center gap-4 sm:gap-6 px-4 py-2 text-xs text-muted-foreground border-t flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-0.5 bg-primary" />
                <span>{t("chart.officialPrice")}</span>
              </div>
              {futurePredictions.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-cyan-500" />
                  <span>{t("chart.mlPrediction")}</span>
                </div>
              )}
              {hasHistoricalPrediction && (
                <button
                  onClick={() => setShowHistoricalPrediction(!showHistoricalPrediction)}
                  className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                    showHistoricalPrediction
                      ? "bg-amber-100 dark:bg-amber-900/30"
                      : "opacity-50 hover:opacity-75"
                  }`}
                >
                  <div
                    className="w-4 h-0.5 border-t border-dashed"
                    style={{ borderColor: HIST_PRED_COLOR, opacity: showHistoricalPrediction ? 1 : 0.5 }}
                  />
                  <span>{t("chart.historicalPrediction")}</span>
                </button>
              )}
              {hasTemperature && (
                <button
                  onClick={() => setShowTemperature(!showTemperature)}
                  className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                    showTemperature
                      ? "bg-violet-100 dark:bg-violet-900/30"
                      : "opacity-50 hover:opacity-75"
                  }`}
                >
                  <div
                    className="w-4 h-0.5"
                    style={{ backgroundColor: TEMP_COLOR, opacity: showTemperature ? 1 : 0.5 }}
                  />
                  <span>
                    {isDefaultLocation
                      ? t("chart.temperatureHelsinki")
                      : locationCityName
                        ? t("chart.temperatureCity", { city: locationCityName })
                        : t("chart.temperatureYourLocation")}
                  </span>
                </button>
              )}
              {hasTemperature && isDefaultLocation && onRequestLocation && (
                <button
                  onClick={onRequestLocation}
                  className="text-xs text-primary hover:underline px-1"
                  title={t("chart.temperatureYourLocation")}
                >
                  📍
                </button>
              )}
              {alertThresholds?.enabled && (
                <>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 border-t-2 border-dashed" style={{ borderColor: "#22c55e" }} />
                    <span>{t("chart.lowAlert")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-0.5 border-t-2 border-dashed" style={{ borderColor: "#ef4444" }} />
                    <span>{t("chart.highAlert")}</span>
                  </div>
                </>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 p-4 border-t bg-muted/30">
              <div className="text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("price.min")}</div>
                <div className="font-bold text-green-600 dark:text-green-400">
                  {formatPrice(stats.min)} <span className="text-xs font-normal">{t("price.centsPerKwh")}</span>
                </div>
              </div>
              <div className="text-center border-x border-border/50">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("price.average")}</div>
                <div className="font-bold">
                  {formatPrice(stats.avg)} <span className="text-xs font-normal text-muted-foreground">{t("price.centsPerKwh")}</span>
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground uppercase tracking-wide">{t("price.max")}</div>
                <div className="font-bold text-red-600 dark:text-red-400">
                  {formatPrice(stats.max)} <span className="text-xs font-normal">{t("price.centsPerKwh")}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// Weather icon strip component shown below chart
// Positions icons using percentage-based alignment matching recharts' categorical axis
function WeatherIconStrip({
  chartData,
  view,
}: {
  chartData: ChartDataPoint[]
  view: "24h" | "7d" | "30d"
}) {
  const hasWeather = chartData.some(d => d.weatherCode !== undefined)
  if (!hasWeather) return null

  // Sample at fixed hour boundaries (00, 06, 12, 18 for 24h; every 12h for 7d)
  const hourInterval = view === "24h" ? 6 : 12
  const totalPoints = chartData.length

  const sampled = chartData
    .map((d, i) => ({ ...d, dataIndex: i }))
    .filter(d => d.date.getHours() % hourInterval === 0)

  if (sampled.length === 0 || totalPoints < 2) return null

  return (
    <div
      className="relative border-t overflow-hidden"
      style={{ marginLeft: 45, marginRight: 35, height: 22 }}
    >
      {sampled.map((d, i) => {
        const leftPercent = (d.dataIndex / (totalPoints - 1)) * 100
        return (
          <span
            key={i}
            className="absolute text-xs -translate-x-1/2"
            style={{ left: `${leftPercent}%`, top: 2 }}
            title={d.time}
          >
            {d.weatherCode !== undefined
              ? getWeatherIcon(d.weatherCode, d.isDay ?? true)
              : ""}
          </span>
        )
      })}
    </div>
  )
}
