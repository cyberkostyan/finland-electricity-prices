"use client"

import { useTranslations, useLocale } from "next-intl"
import { Card } from "@/components/ui/card"
import { PriceData, TemperatureData } from "@/lib/api"
import { getWeatherIcon, getWeatherLabelKey } from "@/lib/weather"
import { groupByDay, groupByBlock } from "@/lib/weather-grouping"

interface WeatherCardsProps {
  prices: PriceData[]
  temperatures: TemperatureData[]
  view: "24h" | "7d" | "30d"
  loading: boolean
}

function PriceStats({ min, max, avg }: { min: number | null; max: number | null; avg: number | null }) {
  const t = useTranslations("price")

  if (min === null || max === null || avg === null) {
    return (
      <div className="border-t pt-2 mt-2">
        <div className="grid grid-cols-3 text-center gap-1">
          <div>
            <div className="text-[10px] text-muted-foreground">{t("min")}</div>
            <div className="text-sm font-semibold">—</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">{t("avg")}</div>
            <div className="text-sm font-semibold">—</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground">{t("max")}</div>
            <div className="text-sm font-semibold">—</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t pt-2 mt-2">
      <div className="grid grid-cols-3 text-center gap-1">
        <div>
          <div className="text-[10px] text-muted-foreground">{t("min")}</div>
          <div className="text-sm font-semibold text-green-600 dark:text-green-400">{min.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">{t("avg")}</div>
          <div className="text-sm font-semibold">{avg.toFixed(1)}</div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground">{t("max")}</div>
          <div className="text-sm font-semibold text-red-600 dark:text-red-400">{max.toFixed(1)}</div>
        </div>
      </div>
      <div className="text-center text-[10px] text-muted-foreground mt-0.5">{t("centsPerKwh")}</div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <Card className="p-4 animate-pulse">
      <div className="h-4 bg-muted rounded w-2/3 mx-auto mb-3" />
      <div className="flex justify-center gap-4 mb-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="h-3 bg-muted rounded w-10" />
            <div className="h-7 bg-muted rounded w-7" />
            <div className="h-3 bg-muted rounded w-6" />
          </div>
        ))}
      </div>
      <div className="border-t pt-2">
        <div className="grid grid-cols-3 gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="h-2 bg-muted rounded w-6" />
              <div className="h-4 bg-muted rounded w-8" />
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

function DailyCard({ card, locale }: { card: ReturnType<typeof groupByDay>[0]; locale: string }) {
  const t = useTranslations("chart")

  // Parse YYYY-MM-DD dateKey and format for display
  const [year, month, day] = card.dateKey.split("-").map(Number)
  const displayDate = new Date(year, month - 1, day)
  const dateLabel = displayDate.toLocaleDateString(locale === "fi" ? "fi-FI" : "en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  return (
    <Card className="p-4">
      <div className="text-center text-sm font-semibold mb-3">{dateLabel}</div>
      <div className="flex justify-center gap-4">
        {card.periods.map((period) => (
          <div key={period.label} className="flex flex-col items-center gap-0.5">
            <div className="text-[10px] text-muted-foreground">{t(period.label.replace("chart.", ""))}</div>
            <div className="text-2xl">
              {period.weatherCode !== null ? getWeatherIcon(period.weatherCode, period.isDay) : ""}
            </div>
            <div className="text-xs">
              {period.temperature !== null ? `${period.temperature > 0 ? "+" : ""}${period.temperature}°` : "—"}
            </div>
          </div>
        ))}
      </div>
      <PriceStats min={card.priceMin} max={card.priceMax} avg={card.priceAvg} />
    </Card>
  )
}

function BlockCard({ card }: { card: ReturnType<typeof groupByBlock>[0] }) {
  const t = useTranslations()

  return (
    <Card className="p-4">
      <div className="text-center text-sm font-semibold mb-1">
        {t(card.label)} {card.timeRange}
      </div>
      <div className="flex flex-col items-center gap-0.5 my-3">
        <div className="text-4xl">
          {card.weatherCode !== null ? getWeatherIcon(card.weatherCode, card.isDay) : ""}
        </div>
        <div className="text-xl font-bold">
          {card.temperature !== null ? `${card.temperature > 0 ? "+" : ""}${card.temperature}°C` : "—"}
        </div>
        {card.weatherCode !== null && (
          <div className="text-xs text-muted-foreground">{t(getWeatherLabelKey(card.weatherCode))}</div>
        )}
      </div>
      <PriceStats min={card.priceMin} max={card.priceMax} avg={card.priceAvg} />
    </Card>
  )
}

export function WeatherCards({ prices, temperatures, view, loading }: WeatherCardsProps) {
  const locale = useLocale()

  if (loading) {
    const skeletonCount = view === "24h" ? 4 : 7
    return (
      <div className={`grid gap-4 ${view === "24h" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-3 lg:grid-cols-4"}`}>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (view === "24h") {
    const blocks = groupByBlock(prices, temperatures)
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {blocks.map((block) => (
          <BlockCard key={block.label} card={block} />
        ))}
      </div>
    )
  }

  // 7d / 30d — daily cards
  const days = groupByDay(prices, temperatures)

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3 lg:grid-cols-4">
      {days.map((day) => (
        <DailyCard key={day.dateKey} card={day} locale={locale} />
      ))}
    </div>
  )
}
