"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { MapPin, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "spothinta_location_banner_dismissed"

interface LocationBannerProps {
  permissionDenied: boolean
  onRequestLocation: () => void
}

export function LocationBanner({ permissionDenied, onRequestLocation }: LocationBannerProps) {
  const t = useTranslations("locationBanner")
  const [isVisible, setIsVisible] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (permissionDenied) {
      const dismissed = localStorage.getItem(STORAGE_KEY)
      if (!dismissed) {
        setIsVisible(true)
      }
    }
  }, [permissionDenied])

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true")
    setIsVisible(false)
  }

  const handleShareLocation = () => {
    onRequestLocation()
    handleDismiss()
  }

  if (!isMounted || !isVisible) {
    return null
  }

  return (
    <div className="mb-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-blue-900 dark:text-blue-100">{t("message")}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShareLocation}
            className="text-xs text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100"
          >
            {t("shareLocation")}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-6 w-6 text-blue-600 dark:text-blue-400"
            aria-label={t("dismiss")}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
