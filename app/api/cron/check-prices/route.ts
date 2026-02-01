import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"
import webpush from "web-push"

// Configure web-push with VAPID details
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@spothinta.app"

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

// Anti-spam: Minimum hours between same-type alerts
const MIN_ALERT_INTERVAL_HOURS = 1
// Price change threshold for re-alerting (c/kWh)
const PRICE_CHANGE_THRESHOLD = 0.5

interface PriceData {
  prices: Array<{
    date: string
    value: number
  }>
}

async function getCurrentPrice(): Promise<number | null> {
  try {
    const now = new Date()
    const start = new Date(now)
    start.setMinutes(0, 0, 0)
    const end = new Date(start)
    end.setHours(end.getHours() + 1)

    const response = await fetch(
      `https://sahkotin.fi/prices?start=${start.toISOString()}&end=${end.toISOString()}&fix&vat`,
      { cache: "no-store" }
    )

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`)
    }

    const data: PriceData = await response.json()

    if (data.prices && data.prices.length > 0) {
      return data.prices[0].value
    }

    return null
  } catch (error) {
    console.error("Error fetching current price:", error)
    return null
  }
}

function shouldSendAlert(
  type: "low" | "high",
  subscription: {
    lastLowAlertAt: Date | null
    lastHighAlertAt: Date | null
    lastAlertPrice: number | null
  },
  currentPrice: number
): boolean {
  const lastAlertAt = type === "low"
    ? subscription.lastLowAlertAt
    : subscription.lastHighAlertAt

  // Check time-based throttling
  if (lastAlertAt) {
    const hoursSinceLastAlert =
      (Date.now() - lastAlertAt.getTime()) / (1000 * 60 * 60)
    if (hoursSinceLastAlert < MIN_ALERT_INTERVAL_HOURS) {
      return false
    }
  }

  // Check price change threshold
  if (subscription.lastAlertPrice !== null) {
    const priceChange = Math.abs(currentPrice - subscription.lastAlertPrice)
    if (priceChange < PRICE_CHANGE_THRESHOLD) {
      return false
    }
  }

  return true
}

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return NextResponse.json(
      { error: "VAPID keys not configured" },
      { status: 500 }
    )
  }

  const prisma = getPrisma()
  if (!prisma) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 500 }
    )
  }

  const currentPrice = await getCurrentPrice()

  if (currentPrice === null) {
    return NextResponse.json(
      { error: "Could not fetch current price" },
      { status: 500 }
    )
  }

  // Get all enabled subscriptions
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { alertsEnabled: true },
  })

  const results = {
    currentPrice,
    totalSubscriptions: subscriptions.length,
    lowAlertsSent: 0,
    highAlertsSent: 0,
    errors: 0,
  }

  for (const sub of subscriptions) {
    // Check for low price alert
    if (currentPrice < sub.lowPriceThreshold) {
      if (shouldSendAlert("low", sub, currentPrice)) {
        let success = false
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dhKey,
                auth: sub.authKey,
              },
            },
            JSON.stringify({
              title: "⚡ Low Price Alert!",
              body: `Electricity price is now ${currentPrice.toFixed(2)} c/kWh - below your ${sub.lowPriceThreshold} c/kWh threshold!`,
              tag: "low-price-alert",
              type: "low",
              price: currentPrice,
              url: "/",
            })
          )
          success = true
        } catch (error: unknown) {
          const webPushError = error as { statusCode?: number }
          if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
            console.log(`Removing invalid subscription: ${sub.id}`)
            await prisma.pushSubscription.delete({
              where: { id: sub.id },
            }).catch(() => {})
          } else {
            console.error(`Error sending push to ${sub.id}:`, error)
          }
        }

        if (success) {
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: {
              lastLowAlertAt: new Date(),
              lastAlertPrice: currentPrice,
            },
          })
          results.lowAlertsSent++
        } else {
          results.errors++
        }
      }
    }

    // Check for high price alert
    if (currentPrice > sub.highPriceThreshold) {
      if (shouldSendAlert("high", sub, currentPrice)) {
        let success = false
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dhKey,
                auth: sub.authKey,
              },
            },
            JSON.stringify({
              title: "⚠️ High Price Alert!",
              body: `Electricity price is now ${currentPrice.toFixed(2)} c/kWh - above your ${sub.highPriceThreshold} c/kWh threshold!`,
              tag: "high-price-alert",
              type: "high",
              price: currentPrice,
              url: "/",
            })
          )
          success = true
        } catch (error: unknown) {
          const webPushError = error as { statusCode?: number }
          if (webPushError.statusCode === 410 || webPushError.statusCode === 404) {
            console.log(`Removing invalid subscription: ${sub.id}`)
            await prisma.pushSubscription.delete({
              where: { id: sub.id },
            }).catch(() => {})
          } else {
            console.error(`Error sending push to ${sub.id}:`, error)
          }
        }

        if (success) {
          await prisma.pushSubscription.update({
            where: { id: sub.id },
            data: {
              lastHighAlertAt: new Date(),
              lastAlertPrice: currentPrice,
            },
          })
          results.highAlertsSent++
        } else {
          results.errors++
        }
      }
    }
  }

  console.log("Cron check-prices completed:", results)

  return NextResponse.json(results)
}
