"use client"

import { useState, useEffect, useCallback } from "react"

const STORAGE_KEY = "userLocation"
const DEFAULT_LAT = 60.17
const DEFAULT_LON = 24.94

interface LocationData {
  lat: number
  lon: number
}

interface UseGeolocationResult {
  lat: number
  lon: number
  isDefault: boolean
  loading: boolean
  error: string | null
  requestLocation: () => void
}

function getSavedLocation(): LocationData | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (typeof parsed.lat === "number" && typeof parsed.lon === "number") {
        return { lat: parsed.lat, lon: parsed.lon }
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

export function useGeolocation(): UseGeolocationResult {
  const [lat, setLat] = useState(DEFAULT_LAT)
  const [lon, setLon] = useState(DEFAULT_LON)
  const [isDefault, setIsDefault] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check localStorage on mount
  useEffect(() => {
    const saved = getSavedLocation()
    if (saved) {
      setLat(saved.lat)
      setLon(saved.lon)
      setIsDefault(false)
    }
  }, [])

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported")
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: Math.round(position.coords.latitude * 100) / 100,
          lon: Math.round(position.coords.longitude * 100) / 100,
        }
        setLat(coords.lat)
        setLon(coords.lon)
        setIsDefault(false)
        setLoading(false)

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(coords))
        } catch {
          // Ignore storage errors
        }
      },
      (err) => {
        setError(err.message)
        setLoading(false)
        // Keep Helsinki defaults
      },
      { timeout: 10000, maximumAge: 600000 }
    )
  }, [])

  return { lat, lon, isDefault, loading, error, requestLocation }
}
