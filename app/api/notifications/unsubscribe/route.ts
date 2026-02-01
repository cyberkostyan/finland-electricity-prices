import { NextRequest, NextResponse } from "next/server"
import { getPrisma } from "@/lib/prisma"

interface UnsubscribeBody {
  endpoint: string
}

export async function POST(request: NextRequest) {
  try {
    const body: UnsubscribeBody = await request.json()
    const { endpoint } = body

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

    await prisma.pushSubscription.delete({
      where: { endpoint },
    }).catch(() => {
      // Ignore if not found
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error removing subscription:", error)
    return NextResponse.json(
      { error: "Failed to remove subscription" },
      { status: 500 }
    )
  }
}
