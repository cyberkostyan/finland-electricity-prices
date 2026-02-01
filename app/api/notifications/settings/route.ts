import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"

interface SettingsBody {
  endpoint: string
  settings: {
    lowPriceThreshold?: number
    highPriceThreshold?: number
    alertsEnabled?: boolean
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SettingsBody = await request.json()
    const { endpoint, settings } = body

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing endpoint" },
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

    const subscription = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      )
    }

    const updated = await prisma.pushSubscription.update({
      where: { endpoint },
      data: {
        ...(settings.lowPriceThreshold !== undefined && {
          lowPriceThreshold: settings.lowPriceThreshold,
        }),
        ...(settings.highPriceThreshold !== undefined && {
          highPriceThreshold: settings.highPriceThreshold,
        }),
        ...(settings.alertsEnabled !== undefined && {
          alertsEnabled: settings.alertsEnabled,
        }),
      },
    })

    return NextResponse.json({
      success: true,
      settings: {
        lowPriceThreshold: updated.lowPriceThreshold,
        highPriceThreshold: updated.highPriceThreshold,
        alertsEnabled: updated.alertsEnabled,
      },
    })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const endpoint = request.nextUrl.searchParams.get("endpoint")

    if (!endpoint) {
      return NextResponse.json(
        { error: "Missing endpoint" },
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

    const subscription = await prisma.pushSubscription.findUnique({
      where: { endpoint },
      select: {
        lowPriceThreshold: true,
        highPriceThreshold: true,
        alertsEnabled: true,
      },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ settings: subscription })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}
