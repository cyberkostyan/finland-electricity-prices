import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"

interface PushSubscriptionJSON {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface SubscribeBody {
  subscription: PushSubscriptionJSON
  settings?: {
    lowPriceThreshold?: number
    highPriceThreshold?: number
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SubscribeBody = await request.json()
    const { subscription, settings } = body

    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      )
    }

    const prisma = getPrisma()
    if (!prisma) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 500 }
      )
    }

    const pushSubscription = await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth,
        alertsEnabled: true,
        lowPriceThreshold: settings?.lowPriceThreshold ?? 3.0,
        highPriceThreshold: settings?.highPriceThreshold ?? 15.0,
        updatedAt: new Date(),
      },
      create: {
        endpoint: subscription.endpoint,
        p256dhKey: subscription.keys.p256dh,
        authKey: subscription.keys.auth,
        alertsEnabled: true,
        lowPriceThreshold: settings?.lowPriceThreshold ?? 3.0,
        highPriceThreshold: settings?.highPriceThreshold ?? 15.0,
      },
    })

    return NextResponse.json({
      success: true,
      id: pushSubscription.id,
    })
  } catch (error) {
    console.error("Error saving subscription:", error)
    return NextResponse.json(
      { error: "Failed to save subscription" },
      { status: 500 }
    )
  }
}
