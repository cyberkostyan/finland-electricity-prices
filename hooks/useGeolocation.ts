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
  permissionDenied: boolean
  cityName: string | null
  requestLocation: () => void
}

interface SavedLocation extends LocationData {
  cityName?: string
}

function getSavedLocation(): SavedLocation | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (typeof parsed.lat === "number" && typeof parsed.lon === "number") {
        return { lat: parsed.lat, lon: parsed.lon, cityName: parsed.cityName }
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
      { headers: { "Accept-Language": "en" } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.address?.city || data.address?.town || data.address?.municipality || null
  } catch {
    return null
  }
}

export function useGeolocation(): UseGeolocationResult {
  const [lat, setLat] = useState(DEFAULT_LAT)
  const [lon, setLon] = useState(DEFAULT_LON)
  const [isDefault, setIsDefault] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cityName, setCityName] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  // Check localStorage on mount
  useEffect(() => {
    const saved = getSavedLocation()
    if (saved) {
      setLat(saved.lat)
      setLon(saved.lon)
      setIsDefault(false)
      if (saved.cityName) {
        setCityName(saved.cityName)
      }
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
      async (position) => {
        const coords = {
          lat: Math.round(position.coords.latitude * 100) / 100,
          lon: Math.round(position.coords.longitude * 100) / 100,
        }
        setLat(coords.lat)
        setLon(coords.lon)
        setIsDefault(false)
        setLoading(false)

        const city = await reverseGeocode(coords.lat, coords.lon)
        if (city) setCityName(city)

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...coords, cityName: city }))
        } catch {
          // Ignore storage errors
        }
      },
      (err) => {
        setError(err.message)
        setPermissionDenied(err.code === GeolocationPositionError.PERMISSION_DENIED)
        setLoading(false)
        // Keep Helsinki defaults
      },
      { timeout: 10000, maximumAge: 600000 }
    )
  }, [])

  return { lat, lon, isDefault, loading, error, permissionDenied, cityName, requestLocation }
}
