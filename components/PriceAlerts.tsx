"use client"

import { useState, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { usePushNotifications } from "@/lib/usePushNotifications"

interface AlertSettings {
  enabled: boolean
  lowPriceThreshold: number
  highPriceThreshold: number
}

const DEFAULT_SETTINGS: AlertSettings = {
  enabled: false,
  lowPriceThreshold: 3,
  highPriceThreshold: 15,
}

const STORAGE_KEY = "priceAlertSettings"

function loadSettings(): AlertSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.error("Failed to load settings:", e)
  }
  return DEFAULT_SETTINGS
}

export function PriceAlerts() {
  const t = useTranslations()
  const [settings, setSettings] = useState<AlertSettings>(DEFAULT_SETTINGS)
  const [isLoaded, setIsLoaded] = useState(false)

  const {
    isSupported,
    isSubscribed,
    isLoading: isPushLoading,
    permissionStatus,
    subscribe,
    unsubscribe,
    updateSettings: updatePushSettings,
  } = usePushNotifications()

  // Load settings on mount
  useEffect(() => {
    const saved = loadSettings()
    setSettings(saved)
    setIsLoaded(true)
  }, [])

  // Sync enabled state with subscription status
  useEffect(() => {
    if (isLoaded && !isPushLoading) {
      setSettings((s) => ({ ...s, enabled: isSubscribed }))
    }
  }, [isSubscribed, isLoaded, isPushLoading])

  // Save settings to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    }
  }, [settings, isLoaded])

  // Sync threshold changes to server (debounced in hook)
  const handleThresholdChange = useCallback(
    (key: "lowPriceThreshold" | "highPriceThreshold", value: number) => {
      setSettings((s) => ({ ...s, [key]: value }))
      if (isSubscribed) {
        updatePushSettings({ [key]: value })
      }
    },
    [isSubscribed, updatePushSettings]
  )

  const toggleAlerts = async (enabled: boolean) => {
    if (enabled) {
      const success = await subscribe({
        lowPriceThreshold: settings.lowPriceThreshold,
        highPriceThreshold: settings.highPriceThreshold,
      })
      if (success) {
        setSettings((s) => ({ ...s, enabled: true }))
      }
    } else {
      await unsubscribe()
      setSettings((s) => ({ ...s, enabled: false }))
    }
  }

  const sendTestNotification = async () => {
    if (!isSupported) {
      alert(t("alerts.notificationsRequirePermission"))
      return
    }

    if (permissionStatus === "denied") {
      alert(t("alerts.notificationsBlocked"))
      return
    }

    if (!isSubscribed) {
      const success = await subscribe({
        lowPriceThreshold: settings.lowPriceThreshold,
        highPriceThreshold: settings.highPriceThreshold,
      })
      if (!success) {
        alert(t("alerts.notificationsRequirePermission"))
        return
      }
    }

    // Use browser Notification API for immediate test
    try {
      const registration = await navigator.serviceWorker.ready
      await registration.showNotification(t("common.appName"), {
        body: `${t("alerts.lowPriceAlert")}: < ${settings.lowPriceThreshold} ${t("price.centsPerKwh")}\n${t("alerts.highPriceAlert")}: > ${settings.highPriceThreshold} ${t("price.centsPerKwh")}`,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "test-notification",
      })
    } catch (err) {
      console.error("Failed to send test notification:", err)
      // Fallback to browser Notification API
      try {
        new Notification(t("common.appName"), {
          body: `${t("alerts.lowPriceAlert")}: < ${settings.lowPriceThreshold} ${t("price.centsPerKwh")}\n${t("alerts.highPriceAlert")}: > ${settings.highPriceThreshold} ${t("price.centsPerKwh")}`,
          tag: "test-notification",
        })
      } catch (fallbackErr) {
        console.error("Fallback notification failed:", fallbackErr)
      }
    }
  }

  const showUnsupportedMessage = !isSupported && isLoaded && !isPushLoading

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {settings.enabled ? (
            <Bell className="h-5 w-5 text-primary" />
          ) : (
            <BellOff className="h-5 w-5 text-muted-foreground" />
          )}
          <CardTitle className="text-lg font-medium">{t("alerts.title")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="alerts-toggle" className="flex flex-col">
            <span>{t("alerts.enableNotifications")}</span>
            <span className="text-sm text-muted-foreground font-normal">
              {t("alerts.enableDescription")}
            </span>
          </Label>
          <div className="flex items-center gap-2">
            {isPushLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Switch
              id="alerts-toggle"
              checked={settings.enabled}
              onCheckedChange={toggleAlerts}
              disabled={isPushLoading || showUnsupportedMessage}
            />
          </div>
        </div>

        {showUnsupportedMessage && (
          <div className="p-3 bg-muted text-muted-foreground rounded-lg text-sm">
            {t("alerts.notificationsRequirePermission")}
          </div>
        )}

        {permissionStatus === "denied" && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
            {t("alerts.notificationsBlocked")}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>{t("alerts.lowPriceAlert")}</span>
              <span className="text-green-600 font-medium">
                {"<"} {settings.lowPriceThreshold} {t("price.centsPerKwh")}
              </span>
            </Label>
            <Slider
              value={[settings.lowPriceThreshold]}
              onValueChange={([value]) =>
                handleThresholdChange("lowPriceThreshold", value)
              }
              min={0}
              max={10}
              step={0.5}
              disabled={!settings.enabled}
            />
            <p className="text-xs text-muted-foreground">
              {t("alerts.lowPriceDescription")}
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>{t("alerts.highPriceAlert")}</span>
              <span className="text-red-600 font-medium">
                {">"} {settings.highPriceThreshold} {t("price.centsPerKwh")}
              </span>
            </Label>
            <Slider
              value={[settings.highPriceThreshold]}
              onValueChange={([value]) =>
                handleThresholdChange("highPriceThreshold", value)
              }
              min={5}
              max={50}
              step={1}
              disabled={!settings.enabled}
            />
            <p className="text-xs text-muted-foreground">
              {t("alerts.highPriceDescription")}
            </p>
          </div>
        </div>

        {settings.enabled && (
          <Button
            variant="outline"
            className="w-full"
            onClick={sendTestNotification}
            disabled={isPushLoading}
          >
            {isPushLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {t("alerts.sendTestNotification")}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
