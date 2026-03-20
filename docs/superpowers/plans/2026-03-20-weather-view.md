# Weather View Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Weather tab that replaces the price chart with weather cards showing daily weather conditions alongside price statistics.

**Architecture:** New `WeatherCards` component receives existing price/temperature data and groups it by day (7d/30d) or 6-hour blocks (24h). A toggle button in `PriceChart` header switches between chart and cards view. Data grouping logic lives in a separate `lib/weather-grouping.ts` utility.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui Card, next-intl, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-20-weather-view-design.md`

---

### Task 1: Add i18n translations

**Files:**
- Modify: `messages/en.json` — add keys under `chart.*`
- Modify: `messages/fi.json` — add Finnish translations

- [ ] **Step 1: Add English translations**

In `messages/en.json`, add these keys inside the existing `"chart"` object, after the `"highAlert"` entry:

```json
"weatherView": "Weather",
"morning": "Morning",
"day": "Day",
"evening": "Evening",
"night": "Night"
```

- [ ] **Step 2: Add Finnish translations**

In `messages/fi.json`, add these keys inside the existing `"chart"` object, after the `"highAlert"` entry:

```json
"weatherView": "Sää",
"morning": "Aamu",
"day": "Päivä",
"evening": "Ilta",
"night": "Yö"
```

- [ ] **Step 3: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add messages/en.json messages/fi.json
git commit -m "Add weather view i18n translations"
```

---

### Task 2: Create weather data grouping utility

**Files:**
- Create: `lib/weather-grouping.ts`

This utility groups hourly price and temperature data into daily or 6-hour block summaries. It is pure logic with no React dependencies.

- [ ] **Step 1: Create `lib/weather-grouping.ts`**

```typescript
import { PriceData, TemperatureData } from "./api"

export interface WeatherPeriod {
  label: string // i18n key: "chart.morning" etc.
  temperature: number | null
  weatherCode: number | null
  isDay: boolean
}

export interface DailyWeatherCard {
  dateKey: string // YYYY-MM-DD in Finnish timezone
  periods: WeatherPeriod[]
  priceMin: number | null
  priceMax: number | null
  priceAvg: number | null
}

export interface BlockWeatherCard {
  label: string // i18n key: "chart.morning" etc.
  timeRange: string // "00–06", "06–12", etc.
  temperature: number | null
  weatherCode: number | null
  isDay: boolean
  priceMin: number | null
  priceMax: number | null
  priceAvg: number | null
}

const PERIOD_CONFIG = [
  { key: "chart.night", startHour: 0, endHour: 6, repHour: 2, isDay: false },
  { key: "chart.morning", startHour: 6, endHour: 12, repHour: 9, isDay: true },
  { key: "chart.day", startHour: 12, endHour: 18, repHour: 14, isDay: true },
  { key: "chart.evening", startHour: 18, endHour: 24, repHour: 20, isDay: false },
]

const BLOCK_CONFIG = [
  { key: "chart.night", range: "00–06", startHour: 0, endHour: 6, repHour: 3, isDay: false },
  { key: "chart.morning", range: "06–12", startHour: 6, endHour: 12, repHour: 9, isDay: true },
  { key: "chart.day", range: "12–18", startHour: 12, endHour: 18, repHour: 15, isDay: true },
  { key: "chart.evening", range: "18–00", startHour: 18, endHour: 24, repHour: 21, isDay: false },
]

function getFinnishDateKey(dateStr: string): string {
  const d = new Date(dateStr)
  // Format as YYYY-MM-DD in Finnish timezone
  return d.toLocaleDateString("en-CA", { timeZone: "Europe/Helsinki" })
}

function getFinnishHour(dateStr: string): number {
  const d = new Date(dateStr)
  return parseInt(d.toLocaleString("en-US", { timeZone: "Europe/Helsinki", hour: "numeric", hour12: false }))
}

function calcStats(prices: PriceData[]): { min: number | null; max: number | null; avg: number | null } {
  if (prices.length === 0) return { min: null, max: null, avg: null }
  const values = prices.map((p) => p.value)
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
  }
}

export function groupByDay(
  prices: PriceData[],
  temperatures: TemperatureData[]
): DailyWeatherCard[] {
  // Group by Finnish calendar date
  const dateMap = new Map<string, { prices: PriceData[]; temps: TemperatureData[] }>()

  for (const p of prices) {
    const key = getFinnishDateKey(p.date)
    if (!dateMap.has(key)) dateMap.set(key, { prices: [], temps: [] })
    dateMap.get(key)!.prices.push(p)
  }

  for (const t of temperatures) {
    const key = getFinnishDateKey(t.date)
    if (!dateMap.has(key)) dateMap.set(key, { prices: [], temps: [] })
    dateMap.get(key)!.temps.push(t)
  }

  const result: DailyWeatherCard[] = []

  for (const [dateKey, data] of dateMap) {
    const periods: WeatherPeriod[] = PERIOD_CONFIG.map((cfg) => {
      // Find the temperature entry closest to the representative hour
      const rep = data.temps.find((t) => getFinnishHour(t.date) === cfg.repHour)
      return {
        label: cfg.key,
        temperature: rep ? Math.round(rep.temperature) : null,
        weatherCode: rep?.weatherCode ?? null,
        isDay: rep?.isDay ?? cfg.isDay,
      }
    })

    const stats = calcStats(data.prices)

    result.push({
      dateKey,
      periods,
      priceMin: stats.min,
      priceMax: stats.max,
      priceAvg: stats.avg,
    })
  }

  // Sort by date ascending
  result.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  return result
}

export function groupByBlock(
  prices: PriceData[],
  temperatures: TemperatureData[]
): BlockWeatherCard[] {
  return BLOCK_CONFIG.map((cfg) => {
    const blockPrices = prices.filter((p) => {
      const h = getFinnishHour(p.date)
      return h >= cfg.startHour && h < cfg.endHour
    })

    const blockTemps = temperatures.filter((t) => {
      const h = getFinnishHour(t.date)
      return h >= cfg.startHour && h < cfg.endHour
    })

    // Average temperature
    const avgTemp =
      blockTemps.length > 0
        ? Math.round(blockTemps.reduce((sum, t) => sum + t.temperature, 0) / blockTemps.length)
        : null

    // Representative hour for weather icon
    const rep = blockTemps.find((t) => getFinnishHour(t.date) === cfg.repHour) || blockTemps[0]

    const stats = calcStats(blockPrices)

    return {
      label: cfg.key,
      timeRange: cfg.range,
      temperature: avgTemp,
      weatherCode: rep?.weatherCode ?? null,
      isDay: rep?.isDay ?? cfg.isDay,
      priceMin: stats.min,
      priceMax: stats.max,
      priceAvg: stats.avg,
    }
  })
}
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add lib/weather-grouping.ts
git commit -m "Add weather data grouping utility for daily and 6-hour blocks"
```

---

### Task 3: Create WeatherCards component

**Files:**
- Create: `components/WeatherCards.tsx`

**Dependencies:** Task 1 (translations), Task 2 (grouping utility)

- [ ] **Step 1: Create `components/WeatherCards.tsx`**

```tsx
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
  const t = useTranslations()
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
```

- [ ] **Step 2: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/WeatherCards.tsx
git commit -m "Add WeatherCards component with daily and block card layouts"
```

---

### Task 4: Integrate Weather toggle into PriceChart

**Files:**
- Modify: `components/PriceChart.tsx`

**Dependencies:** Task 3 (WeatherCards component)

- [ ] **Step 1: Add imports**

At the top of `components/PriceChart.tsx`, add these imports:

```typescript
import { Cloud } from "lucide-react"
import { WeatherCards } from "@/components/WeatherCards"
```

- [ ] **Step 2: Add weatherView state**

Inside the `PriceChart` function, after existing state declarations (after the last `useState` call, around line 75), add:

```typescript
const [weatherView, setWeatherView] = useState(false)
```

- [ ] **Step 3: Add Weather toggle button in the header**

In the CardHeader section (around line 276-285), modify the flex container that holds the title and tabs. Add a Weather toggle button **after** the `</Tabs>` closing tag but still inside the flex container:

Replace the existing header div:
```tsx
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
```

With:
```tsx
<div className="flex items-center justify-between">
  <CardTitle className="text-lg font-medium">{t("price.priceHistory")}</CardTitle>
  <div className="flex items-center gap-2">
    <Tabs value={view} onValueChange={(v) => onViewChange(v as any)}>
      <TabsList className="grid grid-cols-3 w-auto">
        <TabsTrigger value="24h" className="text-xs px-3">{t("chart.24h")}</TabsTrigger>
        <TabsTrigger value="7d" className="text-xs px-3">{t("chart.7days")}</TabsTrigger>
        <TabsTrigger value="30d" className="text-xs px-3">{t("chart.30days")}</TabsTrigger>
      </TabsList>
    </Tabs>
    {hasTemperature && (
      <button
        onClick={() => setWeatherView(!weatherView)}
        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
          weatherView
            ? "bg-primary text-primary-foreground"
            : "bg-muted hover:bg-muted/80 text-muted-foreground"
        }`}
        title={t("chart.weatherView")}
      >
        <Cloud className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">{t("chart.weatherView")}</span>
      </button>
    )}
  </div>
</div>
```

Note: `hasTemperature` already exists in PriceChart (check for `temperatures && temperatures.length > 0`). Find where it's defined and use the same variable name.

- [ ] **Step 4: Conditionally render WeatherCards or chart**

In the `CardContent` section, wrap the chart rendering in a condition. The current structure is:

```tsx
<CardContent className="px-2 sm:px-4 py-0">
  {loading ? (
    <div className="h-[280px] ...">spinner</div>
  ) : (
    <>
      <div className="h-[280px]">chart...</div>
      {/* weather icon strip */}
      {/* legend */}
      {/* stats */}
    </>
  )}
</CardContent>
```

Add `weatherView` condition. When `weatherView` is true, render `WeatherCards` instead of the entire chart + legend + stats block:

```tsx
<CardContent className="px-2 sm:px-4 py-0">
  {weatherView ? (
    <div className="py-4">
      <WeatherCards
        prices={prices}
        temperatures={temperatures || []}
        view={view}
        loading={loading || false}
      />
    </div>
  ) : loading ? (
    <div className="h-[280px] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  ) : (
    <>
      {/* existing chart, legend, stats — unchanged */}
    </>
  )}
</CardContent>
```

- [ ] **Step 5: Verify TypeScript**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Visual verification**

Run: `pnpm dev`

Verify:
1. Cloud button appears next to 24h/7d/30d tabs (only when temperature data exists)
2. Clicking it toggles weather card view
3. 24h mode shows 4 block cards (Night, Morning, Day, Evening)
4. 7d mode shows ~7 daily cards with 4 weather periods each
5. Switching between 24h/7d/30d while in weather view updates the cards
6. Clicking Cloud again returns to chart
7. Dark mode works correctly
8. Mobile layout stacks cards vertically

- [ ] **Step 7: Commit**

```bash
git add components/PriceChart.tsx
git commit -m "Integrate Weather toggle into PriceChart header"
```
