"use client"

import { useState, useEffect, useCallback, useRef } from "react"

interface PushSettings {
  lowPriceThreshold: number
  highPriceThreshold: number
  alertsEnabled: boolean
}

interface UsePushNotificationsReturn {
  isSupported: boolean
  isSubscribed: boolean
  isLoading: boolean
  permissionStatus: NotificationPermission | null
  subscribe: (settings?: Partial<PushSettings>) => Promise<boolean>
  unsubscribe: () => Promise<boolean>
  updateSettings: (settings: Partial<PushSettings>) => Promise<boolean>
  getSubscription: () => Promise<PushSubscription | null>
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length) as Uint8Array<ArrayBuffer>
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null)
  const subscriptionRef = useRef<PushSubscription | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check support and existing subscription on mount
  useEffect(() => {
    const init = async () => {
      // Check browser support
      const supported =
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window &&
        !!VAPID_PUBLIC_KEY

      setIsSupported(supported)

      if (!supported) {
        setIsLoading(false)
        return
      }

      // Check permission
      setPermissionStatus(Notification.permission)

      try {
        // Register service worker
        const registration = await navigator.serviceWorker.register("/sw.js")
        await navigator.serviceWorker.ready

        // Check existing subscription
        const subscription = await registration.pushManager.getSubscription()
        subscriptionRef.current = subscription
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error("Error initializing push notifications:", error)
      }

      setIsLoading(false)
    }

    init()
  }, [])

  const getSubscription = useCallback(async (): Promise<PushSubscription | null> => {
    if (!isSupported) return null
    try {
      const registration = await navigator.serviceWorker.ready
      return await registration.pushManager.getSubscription()
    } catch {
      return null
    }
  }, [isSupported])

  const subscribe = useCallback(
    async (settings?: Partial<PushSettings>): Promise<boolean> => {
      if (!isSupported || !VAPID_PUBLIC_KEY) return false

      setIsLoading(true)

      try {
        // Request notification permission
        const permission = await Notification.requestPermission()
        setPermissionStatus(permission)

        if (permission !== "granted") {
          setIsLoading(false)
          return false
        }

        // Get service worker registration
        const registration = await navigator.serviceWorker.ready

        // Subscribe to push
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        })

        subscriptionRef.current = subscription

        // Send subscription to server
        const response = await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            settings,
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to save subscription on server")
        }

        setIsSubscribed(true)
        setIsLoading(false)
        return true
      } catch (error) {
        console.error("Error subscribing to push:", error)
        setIsLoading(false)
        return false
      }
    },
    [isSupported]
  )

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    setIsLoading(true)

    try {
      const subscription = await getSubscription()

      if (subscription) {
        // Unsubscribe from push manager
        await subscription.unsubscribe()

        // Remove from server
        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }

      subscriptionRef.current = null
      setIsSubscribed(false)
      setIsLoading(false)
      return true
    } catch (error) {
      console.error("Error unsubscribing from push:", error)
      setIsLoading(false)
      return false
    }
  }, [isSupported, getSubscription])

  const updateSettings = useCallback(
    async (settings: Partial<PushSettings>): Promise<boolean> => {
      const subscription = subscriptionRef.current

      if (!subscription) return false

      // Debounce settings updates
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      return new Promise((resolve) => {
        debounceRef.current = setTimeout(async () => {
          try {
            const response = await fetch("/api/notifications/settings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                endpoint: subscription.endpoint,
                settings,
              }),
            })

            resolve(response.ok)
          } catch (error) {
            console.error("Error updating settings:", error)
            resolve(false)
          }
        }, 500)
      })
    },
    []
  )

  return {
    isSupported,
    isSubscribed,
    isLoading,
    permissionStatus,
    subscribe,
    unsubscribe,
    updateSettings,
    getSubscription,
  }
}
