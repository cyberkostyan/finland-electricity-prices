"use client"

import { useTranslations, useLocale } from "next-intl"
import { Card } from "@/components/ui/card"
import { PriceData, TemperatureData, type SunTimes } from "@/lib/api"
import { getWeatherIcon, getWeatherLabelKey } from "@/lib/weather"
import { groupByDay, groupByBlock } from "@/lib/weather-grouping"

interface WeatherCardsProps {
  prices: PriceData[]
  temperatures: TemperatureData[]
  sunTimes?: SunTimes
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

function formatSunTime(isoTime: string): string {
  // isoTime is like "2026-03-21T06:15" — extract HH:MM
  const match = isoTime.match(/T(\d{2}:\d{2})/)
  return match ? match[1] : ""
}

function DailyCard({ card, locale, isToday, sunrise, sunset }: {
  card: ReturnType<typeof groupByDay>[0]
  locale: string
  isToday: boolean
  sunrise?: string
  sunset?: string
}) {
  const t = useTranslations("price")

  // Parse YYYY-MM-DD dateKey and format for display
  const [year, month, day] = card.dateKey.split("-").map(Number)
  const displayDate = new Date(year, month - 1, day)
  const weekday = displayDate.toLocaleDateString(locale === "fi" ? "fi-FI" : "en-US", {
    weekday: "short",
  })
  const dateNum = displayDate.getDate()

  // Pick the "day" period icon (index 2 = chart.day, 12-18h) as the main icon
  const dayPeriod = card.periods[2] // chart.day
  const mainIcon = dayPeriod?.weatherCode !== null
    ? getWeatherIcon(dayPeriod.weatherCode!, dayPeriod.isDay)
    : card.periods.find(p => p.weatherCode !== null)
      ? getWeatherIcon(card.periods.find(p => p.weatherCode !== null)!.weatherCode!, true)
      : null

  // Temperature range from all periods
  const temps = card.periods.map(p => p.temperature).filter((t): t is number => t !== null)
  const tempMin = temps.length > 0 ? Math.min(...temps) : null
  const tempMax = temps.length > 0 ? Math.max(...temps) : null

  return (
    <Card className={`p-2 sm:p-3 text-center ${isToday ? "ring-2 ring-primary" : ""}`}>
      <div className="text-[10px] sm:text-xs text-muted-foreground uppercase">{weekday}</div>
      <div className={`text-sm sm:text-base font-semibold ${isToday ? "text-primary" : ""}`}>{dateNum}</div>
      {mainIcon && <div className="text-2xl sm:text-3xl my-1">{mainIcon}</div>}
      {tempMin !== null && tempMax !== null && (
        <div className="text-[10px] sm:text-xs">
          <span className="text-blue-500">{tempMin > 0 ? "+" : ""}{tempMin}°</span>
          {" / "}
          <span className="text-red-500">{tempMax > 0 ? "+" : ""}{tempMax}°</span>
        </div>
      )}
      {(sunrise || sunset) && (
        <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
          {sunrise && <span>☀↑{formatSunTime(sunrise)}</span>}
          {sunrise && sunset && " "}
          {sunset && <span>☀↓{formatSunTime(sunset)}</span>}
        </div>
      )}
      {card.priceAvg !== null && (
        <div className="border-t mt-1.5 pt-1.5">
          <div className="text-xs sm:text-sm font-semibold">{card.priceAvg.toFixed(1)}</div>
          <div className="text-[8px] sm:text-[10px] text-muted-foreground">{t("centsPerKwh")}</div>
        </div>
      )}
    </Card>
  )
}

function BlockCard({ card, sunLabel }: { card: ReturnType<typeof groupByBlock>[0]; sunLabel?: string }) {
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
        {sunLabel && (
          <div className="text-[10px] text-muted-foreground mt-0.5">{sunLabel}</div>
        )}
      </div>
      <PriceStats min={card.priceMin} max={card.priceMax} avg={card.priceAvg} />
    </Card>
  )
}

export function WeatherCards({ prices, temperatures, sunTimes = {}, view, loading }: WeatherCardsProps) {
  const locale = useLocale()

  if (loading) {
    const skeletonCount = view === "24h" ? 4 : 7
    return (
      <div className={`grid ${view === "24h" ? "gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "gap-2 sm:gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-7"}`}>
        {Array.from({ length: skeletonCount }, (_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (view === "24h") {
    const blocks = groupByBlock(prices, temperatures)
    // Find today's sunrise/sunset for block cards
    const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Helsinki" })
    const todaySun = sunTimes[todayKey]
    const sunriseTime = todaySun ? formatSunTime(todaySun.sunrise) : undefined
    const sunsetTime = todaySun ? formatSunTime(todaySun.sunset) : undefined

    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {blocks.map((block) => {
          // Show sunrise on Morning block, sunset on Evening block
          let sunLabel: string | undefined
          if (block.label === "chart.morning" && sunriseTime) sunLabel = `☀↑ ${sunriseTime}`
          if (block.label === "chart.evening" && sunsetTime) sunLabel = `☀↓ ${sunsetTime}`
          return <BlockCard key={block.label} card={block} sunLabel={sunLabel} />
        })}
      </div>
    )
  }

  // 7d / 30d — daily cards in calendar layout (weeks start on Monday)
  const days = groupByDay(prices, temperatures)
  const todayKey = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Helsinki" })

  // Calculate empty cells to align first day to its weekday (Mon=0, Sun=6)
  let startPadding = 0
  if (days.length > 0) {
    const [y, m, d] = days[0].dateKey.split("-").map(Number)
    const firstDayOfWeek = new Date(y, m - 1, d).getDay() // 0=Sun, 1=Mon, ...
    startPadding = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1 // convert to Mon=0
  }

  return (
    <>
      {/* Mobile: horizontal scroll strip */}
      <div className="flex gap-2 overflow-x-auto p-1 pb-2 snap-x snap-mandatory md:hidden">
        {days.map((day) => (
          <div key={day.dateKey} className="snap-start shrink-0 w-[100px]">
            <DailyCard card={day} locale={locale} isToday={day.dateKey === todayKey} sunrise={sunTimes[day.dateKey]?.sunrise} sunset={sunTimes[day.dateKey]?.sunset} />
          </div>
        ))}
      </div>
      {/* Desktop: calendar grid with Monday start */}
      <div className="hidden md:grid gap-2 sm:gap-3 grid-cols-7">
        {Array.from({ length: startPadding }, (_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => (
          <DailyCard key={day.dateKey} card={day} locale={locale} isToday={day.dateKey === todayKey} sunrise={sunTimes[day.dateKey]?.sunrise} sunset={sunTimes[day.dateKey]?.sunset} />
        ))}
      </div>
    </>
  )
}
