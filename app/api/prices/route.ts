import { NextRequest, NextResponse } from "next/server"

const FETCH_TIMEOUT_MS = 8000
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      next: { revalidate: 300 },
    })
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchWithRetry(url: string) {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(url, FETCH_TIMEOUT_MS)
      if (!response.ok) {
        throw new Error(`API responded with status ${response.status}`)
      }
      return await response.json()
    } catch (error) {
      lastError = error as Error
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      }
    }
  }

  throw lastError
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  if (!start || !end) {
    return NextResponse.json(
      { error: "Missing start or end parameter" },
      { status: 400 }
    )
  }

  try {
    const url = `https://sahkotin.fi/prices?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&fix&vat`
    const data = await fetchWithRetry(url)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching prices:", error)
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    )
  }
}
