const SAHKOTIN_BASE_URL = "https://sahkotin.fi/prices"
const FETCH_TIMEOUT_MS = 8000
const MAX_RETRIES = 2
const RETRY_DELAY_MS = 1000

export interface PriceEntry {
  date: string
  value: number
}

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

export async function fetchPricesFromSahkotin(
  start: string,
  end: string
): Promise<{ prices: PriceEntry[] }> {
  const url = `${SAHKOTIN_BASE_URL}?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}&fix&vat`
  return await fetchWithRetry(url)
}
