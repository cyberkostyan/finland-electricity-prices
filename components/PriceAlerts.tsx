"use client"

import { useState, useEffect, useRef } from "react"
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
        new Notification("Price Alerts Enabled", {
          body: "You will be notified when electricity prices change significantly.",
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
          <CardTitle className="text-lg font-medium">Price Alerts</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="alerts-toggle" className="flex flex-col">
            <span>Enable Notifications</span>
            <span className="text-sm text-muted-foreground font-normal">
              Get notified when prices are low or high
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
            Notifications are blocked. Please enable them in your browser settings.
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>Low price alert</span>
              <span className="text-green-600 font-medium">
                {"<"} {settings.lowPriceThreshold} c/kWh
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
              Notify when price drops below this level
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center justify-between">
              <span>High price alert</span>
              <span className="text-red-600 font-medium">
                {">"} {settings.highPriceThreshold} c/kWh
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
              Warn when price exceeds this level
            </p>
          </div>
        </div>

        {settings.enabled && (
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              console.log("Test notification clicked")
              console.log("Notification in window:", "Notification" in window)

              if (!("Notification" in window)) {
                alert("This browser does not support notifications")
                return
              }

              console.log("Current permission:", Notification.permission)
              const currentPermission = Notification.permission

              if (currentPermission === "granted") {
                try {
                  console.log("Creating notification...")
                  const notification = new Notification("Finland Electricity Prices", {
                    body: `Low alert: < ${settings.lowPriceThreshold} c/kWh\nHigh alert: > ${settings.highPriceThreshold} c/kWh`,
                    tag: "test-notification",
                  })
                  console.log("Notification created:", notification)
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
                alert("Notifications are blocked. Please enable them in browser settings.")
              } else {
                console.log("Requesting permission...")
                try {
                  const permission = await Notification.requestPermission()
                  console.log("Permission result:", permission)
                  setPermissionStatus(permission)
                  if (permission === "granted") {
                    new Notification("Finland Electricity Prices", {
                      body: "Notifications enabled successfully!",
                      tag: "test-notification",
                    })
                  } else {
                    alert(`Permission ${permission}. Cannot send notifications.`)
                  }
                } catch (err: unknown) {
                  console.error("Permission request failed:", err)
                  const errorMessage = err instanceof Error ? err.message : String(err)
                  alert(`Failed to request permission: ${errorMessage}`)
                }
              }
            }}
          >
            Send Test Notification
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
