# Weather View Mode — Design Spec

## Overview

Add a "Weather" tab to the existing view selector (24h / 7d / 30d) in PriceChart. When active, the chart area is replaced with a grid of weather cards showing weather conditions alongside electricity price statistics.

## View Switching

- A new **"Weather"** button (Cloud icon from lucide-react) appears as a separate toggle button next to the existing `Tabs` component, not inside it — since it doesn't represent a view value
- Selecting it sets `weatherView: true` and replaces the chart (and its legend/stats) with weather cards
- The 24h / 7d / 30d tabs remain functional and control the time period for the cards
- Weather view persists across time period changes — switching 24h → 7d stays in weather view
- Clicking the Weather button again switches back to chart view (toggle behavior)
- If `temperatures` array is empty or undefined, the Weather button is hidden
- State is local to the component, not persisted

## Card Structure

All date/time grouping uses Finnish timezone (Europe/Helsinki), consistent with the rest of the app.

### 7d / 30d Mode — Daily Cards

Each card represents one calendar day:

```
┌─────────────────────────────────┐
│         Thursday, Mar 20        │
│                                 │
│  Morning   Day    Evening Night │
│   🌤️       ☀️      ⛅     🌙   │
│   +4°      +8°     +5°    +2°  │
│                                 │
│ ─────────────────────────────── │
│  Min      Avg      Max         │
│  2.1      6.4      12.3  c/kWh │
│ (green)          (red)         │
└─────────────────────────────────┘
```

- **Header:** Localized date (day of week + date)
- **Weather grid:** 4 columns — Morning (06-12), Day (12-18), Evening (18-00), Night (00-06)
- Each column: weather emoji icon (via `getWeatherIcon()`) + temperature in °C
- **Price stats:** Min (green), Avg (default), Max (red) in c/kWh, using existing color convention
- Representative hours for weather: Morning=09:00, Day=14:00, Evening=20:00, Night=02:00
- `isDay` for icons: derive from hour (06-18 = day, 18-06 = night), consistent with existing `isDay ?? true` fallback

### 24h Mode — 6-Hour Block Cards

4 cards representing time blocks of the current day:

```
┌──────────────────┐
│   Night 00–06    │
│                  │
│      🌙          │
│     +2°C         │
│     Clear        │
│                  │
│ ──────────────── │
│ Min  Avg   Max   │
│ 1.2  2.1   3.4   │
└──────────────────┘
```

- **Header:** Period name + time range
- **Weather:** Single large icon (via `getWeatherIcon()`) + average temperature for the block + weather label (via `getWeatherLabelKey()` + i18n)
- **Price stats:** Same min/avg/max layout
- Representative hours for weather icon: Night=03:00, Morning=09:00, Day=15:00, Evening=21:00

### Loading State

When `loading` is true, show skeleton cards (same grid layout, pulsing placeholder rectangles) matching the expected card count for the current view.

## Responsive Layout

- **Desktop (lg+):** `grid-cols-4` — 4 cards per row
- **Tablet (md):** `grid-cols-3` in 7d/30d, `grid-cols-2` in 24h
- **Mobile:** `grid-cols-1` — vertical stack, one card per row
- Gap: `gap-4`
- 30d mode on mobile: natural scroll, no pagination needed (30 compact cards are manageable)

## Data Flow

### Inputs (same as PriceChart)
- `prices: PriceData[]` — hourly prices with `date` and `value`
- `temperatures: TemperatureData[]` — hourly temps with `date`, `temperature`, `weatherCode?`, `isDay?`
- `view: "24h" | "7d" | "30d"` — current time period
- `loading: boolean` — for skeleton state

### Grouping Logic

**Daily (7d/30d):** Group prices and temperatures by calendar date (Europe/Helsinki). For each day:
- Calculate min/avg/max from all hourly prices of that day
- Pick representative weather for 4 periods using closest available hour

**6-hour blocks (24h):** Group by 6-hour windows (00-06, 06-12, 12-18, 18-24):
- Calculate min/avg/max from hourly prices in the block
- Average temperature across the block
- Pick weather code from the representative hour

### Edge Cases
- Missing weather data for a period: show "—" for temperature, no icon
- Missing price data: show "—" for all stats
- Partial day (today): show available data, no empty periods at end
- Future days without prices: show weather only, price section shows "—"
- Empty temperatures array: Weather button hidden entirely

## Component Architecture

### New Component: `WeatherCards`

```typescript
interface WeatherCardsProps {
  prices: PriceData[]
  temperatures: TemperatureData[]
  view: "24h" | "7d" | "30d"
  loading: boolean
}
```

Located at `components/WeatherCards.tsx`.

### Integration in PriceChart

- Add `weatherView` boolean state to PriceChart
- Add Weather toggle button (Cloud icon) positioned next to the Tabs component, outside `TabsList`
- Conditionally render `WeatherCards` instead of the Recharts chart + legend + stats
- Pass `loading` prop through to WeatherCards

## Styling

- Cards use existing shadcn `Card` component
- Price colors follow existing convention: green for cheap (< 5c), red for expensive (> 10c)
- Weather icons use existing `getWeatherIcon()` from `lib/weather.ts`
- Weather labels use existing `getWeatherLabelKey()` from `lib/weather.ts` + i18n keys from `weather.*`
- Dark mode support via existing Tailwind dark: variants
- No transition animation between chart and cards — simple conditional render

## Translations

New keys needed in `en.json` / `fi.json`:

```json
{
  "chart": {
    "weatherView": "Weather",
    "morning": "Morning",
    "day": "Day",
    "evening": "Evening",
    "night": "Night"
  }
}
```

Finnish translations:
```json
{
  "chart": {
    "weatherView": "Sää",
    "morning": "Aamu",
    "day": "Päivä",
    "evening": "Ilta",
    "night": "Yö"
  }
}
```

Note: "Min", "Max", "Avg" keys already exist in `price.*`.
