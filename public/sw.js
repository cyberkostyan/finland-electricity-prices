// Service Worker for Web Push Notifications
const CACHE_NAME = "spothinta-v1"

// Handle push events
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("Push event without data")
    return
  }

  const data = event.data.json()
  const { title, body, icon, tag, url, price, type } = data

  const options = {
    body,
    icon: icon || "/icon-192.png",
    badge: "/icon-192.png",
    tag: tag || "price-alert",
    renotify: true,
    requireInteraction: false,
    data: { url: url || "/", price, type },
    vibrate: [100, 50, 100],
    actions: [
      {
        action: "open",
        title: "Open App",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "dismiss") {
    return
  }

  const urlToOpen = event.notification.data?.url || "/"

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.focus()
            if (client.navigate) {
              client.navigate(urlToOpen)
            }
            return
          }
        }
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
  )
})

// Handle subscription change
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    fetch("/api/notifications/resubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldEndpoint: event.oldSubscription?.endpoint,
        newSubscription: event.newSubscription?.toJSON(),
      }),
    })
  )
})

// Install event
self.addEventListener("install", (event) => {
  self.skipWaiting()
})

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim())
})
