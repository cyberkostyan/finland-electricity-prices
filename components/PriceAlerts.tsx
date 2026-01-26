"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Bell, BellOff } from "lucide-react"

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
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>("default")
  const [isLoaded, setIsLoaded] = useState(false)

  // Load settings on mount
  useEffect(() => {
    const saved = loadSettings()
    setSettings(saved)
    setIsLoaded(true)

    // Check notification permission
    if ("Notification" in window) {
      setPermissionStatus(Notification.permission)
    }
  }, [])

  // Save settings to localStorage (only after initial load)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    }
  }, [settings, isLoaded])

  const requestPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      setPermissionStatus(permission)
      if (permission === "granted") {
        setSettings((s) => ({ ...s, enabled: true }))
        // Show test notification
        new Notification(t("common.appName"), {
          body: t("alerts.enableDescription"),
          icon: "/favicon.ico",
        })
      }
    }
  }

  const toggleAlerts = (enabled: boolean) => {
    if (enabled && permissionStatus !== "granted") {
      requestPermission()
    } else {
      setSettings((s) => ({ ...s, enabled }))
    }
  }

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
          <Switch
            id="alerts-toggle"
            checked={settings.enabled}
            onCheckedChange={toggleAlerts}
          />
        </div>

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
                setSettings((s) => ({ ...s, lowPriceThreshold: value }))
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
                setSettings((s) => ({ ...s, highPriceThreshold: value }))
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
            onClick={async () => {
              if (!("Notification" in window)) {
                alert("This browser does not support notifications")
                return
              }

              const currentPermission = Notification.permission

              if (currentPermission === "granted") {
                try {
                  const notification = new Notification(t("common.appName"), {
                    body: `${t("alerts.lowPriceAlert")}: < ${settings.lowPriceThreshold} ${t("price.centsPerKwh")}\n${t("alerts.highPriceAlert")}: > ${settings.highPriceThreshold} ${t("price.centsPerKwh")}`,
                    tag: "test-notification",
                  })
                  notification.onclick = () => {
                    window.focus()
                    notification.close()
                  }
                } catch (err: unknown) {
                  console.error("Failed to create notification:", err)
                  const errorMessage = err instanceof Error ? err.message : String(err)
                  alert(`Failed to send notification: ${errorMessage}`)
                }
              } else if (currentPermission === "denied") {
                alert(t("alerts.notificationsBlocked"))
              } else {
                try {
                  const permission = await Notification.requestPermission()
                  setPermissionStatus(permission)
                  if (permission === "granted") {
                    new Notification(t("common.appName"), {
                      body: t("alerts.enableDescription"),
                      tag: "test-notification",
                    })
                  }
                } catch (err: unknown) {
                  console.error("Permission request failed:", err)
                  const errorMessage = err instanceof Error ? err.message : String(err)
                  alert(`Failed to request permission: ${errorMessage}`)
                }
              }
            }}
          >
            {t("alerts.sendTestNotification")}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
