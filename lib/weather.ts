// WMO Weather interpretation codes (WMO 4677)
// https://open-meteo.com/en/docs

interface WeatherInfo {
  icon: string
  nightIcon?: string
  labelKey: string
}

const WMO_CODES: Record<number, WeatherInfo> = {
  0: { icon: "☀️", nightIcon: "🌙", labelKey: "weather.clear" },
  1: { icon: "⛅", nightIcon: "☁️", labelKey: "weather.partlyCloudy" },
  2: { icon: "⛅", nightIcon: "☁️", labelKey: "weather.partlyCloudy" },
  3: { icon: "☁️", labelKey: "weather.cloudy" },
  45: { icon: "🌫️", labelKey: "weather.fog" },
  48: { icon: "🌫️", labelKey: "weather.fog" },
  51: { icon: "🌦️", labelKey: "weather.drizzle" },
  53: { icon: "🌦️", labelKey: "weather.drizzle" },
  55: { icon: "🌦️", labelKey: "weather.drizzle" },
  56: { icon: "🌦️", labelKey: "weather.drizzle" },
  57: { icon: "🌦️", labelKey: "weather.drizzle" },
  61: { icon: "🌧️", labelKey: "weather.rain" },
  63: { icon: "🌧️", labelKey: "weather.rain" },
  65: { icon: "🌧️", labelKey: "weather.rain" },
  66: { icon: "🌧️", labelKey: "weather.rain" },
  67: { icon: "🌧️", labelKey: "weather.rain" },
  71: { icon: "🌨️", labelKey: "weather.snow" },
  73: { icon: "🌨️", labelKey: "weather.snow" },
  75: { icon: "🌨️", labelKey: "weather.snow" },
  77: { icon: "🌨️", labelKey: "weather.snow" },
  80: { icon: "🌧️", labelKey: "weather.rain" },
  81: { icon: "🌧️", labelKey: "weather.rain" },
  82: { icon: "🌧️", labelKey: "weather.rain" },
  85: { icon: "🌨️", labelKey: "weather.snow" },
  86: { icon: "🌨️", labelKey: "weather.snow" },
  95: { icon: "⛈️", labelKey: "weather.thunderstorm" },
  96: { icon: "⛈️", labelKey: "weather.thunderstorm" },
  99: { icon: "⛈️", labelKey: "weather.thunderstorm" },
}

const DEFAULT_WEATHER: WeatherInfo = { icon: "☁️", labelKey: "weather.cloudy" }

export function getWeatherIcon(code: number, isDay: boolean): string {
  const info = WMO_CODES[code] ?? DEFAULT_WEATHER
  if (!isDay && info.nightIcon) {
    return info.nightIcon
  }
  return info.icon
}

export function getWeatherLabelKey(code: number): string {
  return (WMO_CODES[code] ?? DEFAULT_WEATHER).labelKey
}
