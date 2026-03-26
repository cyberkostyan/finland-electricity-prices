# MCP Server for Spothinta — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public MCP server to Spothinta so AI agents can query Finnish electricity prices via Streamable HTTP.

**Architecture:** Single Next.js API route (`/api/mcp`) using `mcp-handler` + `@modelcontextprotocol/sdk`. Server-side price fetching logic extracted into a shared module reused by both existing API routes and MCP tools. New `/connect` page with onboarding instructions.

**Tech Stack:** Next.js 14, TypeScript, mcp-handler, @modelcontextprotocol/sdk, zod, shadcn/ui, next-intl

---

## File Structure

| Action | File | Responsibility |
|--------|------|---------------|
| Create | `lib/prices.ts` | Server-side price fetching (extracted from `app/api/prices/route.ts`) |
| Create | `app/api/mcp/route.ts` | MCP server endpoint with 4 tools |
| Create | `app/[locale]/connect/page.tsx` | Onboarding page with instructions |
| Modify | `app/api/prices/route.ts` | Refactor to use shared `lib/prices.ts` |
| Modify | `app/[locale]/page.tsx` | Add "Connect AI" link to footer |
| Modify | `messages/en.json` | Add connect page + footer translations |
| Modify | `messages/fi.json` | Add connect page + footer translations |

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install mcp-handler and MCP SDK**

```bash
pnpm add mcp-handler @modelcontextprotocol/sdk zod
```

Note: `zod` may already be installed as a transitive dependency, but we need it as a direct dependency for MCP tool schemas.

- [ ] **Step 2: Verify installation**

```bash
pnpm list mcp-handler @modelcontextprotocol/sdk zod
```

Expected: All three packages listed with versions.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "Add MCP server dependencies"
```

---

### Task 2: Extract server-side price fetching into shared module

The existing `app/api/prices/route.ts` has price fetching logic (fetchWithTimeout, fetchWithRetry, Sahkotin API call). We extract this so both the API route and MCP tools can use it.

**Files:**
- Create: `lib/prices.ts`
- Modify: `app/api/prices/route.ts`

- [ ] **Step 1: Create `lib/prices.ts`**

```typescript
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
```

- [ ] **Step 2: Refactor `app/api/prices/route.ts` to use shared module**

Replace the entire file content with:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { fetchPricesFromSahkotin } from "@/lib/prices"

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
    const data = await fetchPricesFromSahkotin(start, end)
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching prices:", error)
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 3: Verify existing functionality still works**

```bash
pnpm build
```

Expected: Build succeeds without errors.

- [ ] **Step 4: Commit**

```bash
git add lib/prices.ts app/api/prices/route.ts
git commit -m "Extract server-side price fetching into shared lib/prices.ts"
```

---

### Task 3: Create MCP server route

**Files:**
- Create: `app/api/mcp/route.ts`

- [ ] **Step 1: Create the MCP route**

```typescript
import { createMcpHandler } from "mcp-handler"
import { z } from "zod"
import { fetchPricesFromSahkotin } from "@/lib/prices"

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "get_current_price",
      "Get the current electricity price in Finland (c/kWh incl. 25.5% VAT)",
      {},
      async () => {
        try {
          const now = new Date()
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())
          const end = new Date(start.getTime() + 60 * 60 * 1000)

          const data = await fetchPricesFromSahkotin(start.toISOString(), end.toISOString())
          const prices = data.prices || []

          if (prices.length === 0) {
            return {
              content: [{ type: "text", text: "Price data temporarily unavailable" }],
            }
          }

          const current = prices[0]
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ time: current.date, price: current.value }),
              },
            ],
          }
        } catch {
          return {
            content: [{ type: "text", text: "Price data temporarily unavailable" }],
            isError: true,
          }
        }
      }
    )

    server.tool(
      "get_today_prices",
      "Get hourly electricity prices for today in Finland (c/kWh incl. 25.5% VAT)",
      {},
      async () => {
        try {
          const now = new Date()
          const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)

          const data = await fetchPricesFromSahkotin(start.toISOString(), end.toISOString())
          const prices = (data.prices || []).map((p: { date: string; value: number }) => ({
            time: p.date,
            price: p.value,
          }))

          return {
            content: [{ type: "text", text: JSON.stringify({ prices }) }],
          }
        } catch {
          return {
            content: [{ type: "text", text: "Price data temporarily unavailable" }],
            isError: true,
          }
        }
      }
    )

    server.tool(
      "get_tomorrow_prices",
      "Get hourly electricity prices for tomorrow in Finland (c/kWh incl. 25.5% VAT). Prices are typically available after 14:00 EET.",
      {},
      async () => {
        try {
          const now = new Date()
          const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          const tomorrowEnd = new Date(tomorrowStart.getTime() + 24 * 60 * 60 * 1000)

          const data = await fetchPricesFromSahkotin(
            tomorrowStart.toISOString(),
            tomorrowEnd.toISOString()
          )
          const prices = (data.prices || []).map((p: { date: string; value: number }) => ({
            time: p.date,
            price: p.value,
          }))

          if (prices.length === 0) {
            return {
              content: [
                {
                  type: "text",
                  text: "Tomorrow's prices are not yet available, they are typically published after 14:00 EET",
                },
              ],
            }
          }

          return {
            content: [{ type: "text", text: JSON.stringify({ prices }) }],
          }
        } catch {
          return {
            content: [{ type: "text", text: "Price data temporarily unavailable" }],
            isError: true,
          }
        }
      }
    )

    server.tool(
      "get_price_history",
      "Get historical electricity prices for a date range in Finland (c/kWh incl. 25.5% VAT). Maximum 30-day range.",
      {
        start: z.string().describe("Start date in ISO format (e.g. 2026-03-01)"),
        end: z.string().describe("End date in ISO format (e.g. 2026-03-15)"),
      },
      async ({ start, end }) => {
        try {
          const startDate = new Date(start)
          const endDate = new Date(end)

          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return {
              content: [{ type: "text", text: "Invalid date format. Use ISO format (e.g. 2026-03-01)" }],
              isError: true,
            }
          }

          const diffDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          if (diffDays > 30) {
            return {
              content: [{ type: "text", text: "Date range cannot exceed 30 days" }],
              isError: true,
            }
          }

          if (diffDays < 0) {
            return {
              content: [{ type: "text", text: "End date must be after start date" }],
              isError: true,
            }
          }

          const data = await fetchPricesFromSahkotin(startDate.toISOString(), endDate.toISOString())
          const prices = (data.prices || []).map((p: { date: string; value: number }) => ({
            time: p.date,
            price: p.value,
          }))

          return {
            content: [{ type: "text", text: JSON.stringify({ prices }) }],
          }
        } catch {
          return {
            content: [{ type: "text", text: "Price data temporarily unavailable" }],
            isError: true,
          }
        }
      }
    )
  },
  {
    capabilities: {},
  },
  {
    basePath: "/api",
  }
)

export { handler as GET, handler as POST, handler as DELETE }
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 3: Smoke test locally**

```bash
pnpm dev &
sleep 3
curl -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'
```

Expected: JSON response with server info and capabilities.

- [ ] **Step 4: Commit**

```bash
git add app/api/mcp/route.ts
git commit -m "Add MCP server endpoint with price tools"
```

---

### Task 4: Add i18n translations for connect page

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/fi.json`

- [ ] **Step 1: Add English translations**

Add the following key to `messages/en.json` (after the `"footer"` section):

```json
"connect": {
  "title": "Connect AI to Spothinta",
  "description": "Query real-time Finnish electricity prices from your AI assistant",
  "mcpUrl": "MCP Server URL",
  "copyUrl": "Copy URL",
  "copied": "Copied!",
  "instructions": {
    "title": "How to connect",
    "step1": "Open Claude Desktop settings",
    "step2": "Go to Connectors",
    "step3": "Click \"Add Custom Integration\"",
    "step4": "Paste the URL above and save"
  },
  "examples": {
    "title": "Example queries",
    "example1": "What's the current electricity price in Finland?",
    "example2": "Show me today's hourly prices",
    "example3": "Compare prices from last week"
  }
}
```

Also add to the `"footer"` section:

```json
"connectAI": "Connect AI"
```

- [ ] **Step 2: Add Finnish translations**

Add the following key to `messages/fi.json` (after the `"footer"` section):

```json
"connect": {
  "title": "Yhdistä tekoäly Spothintaan",
  "description": "Kysy reaaliaikaisia sähkön hintoja tekoälyavustajaltasi",
  "mcpUrl": "MCP-palvelimen URL",
  "copyUrl": "Kopioi URL",
  "copied": "Kopioitu!",
  "instructions": {
    "title": "Näin yhdistät",
    "step1": "Avaa Claude Desktop -asetukset",
    "step2": "Siirry kohtaan Connectors",
    "step3": "Napsauta \"Add Custom Integration\"",
    "step4": "Liitä yllä oleva URL ja tallenna"
  },
  "examples": {
    "title": "Esimerkkikyselyt",
    "example1": "Mikä on sähkön hinta nyt Suomessa?",
    "example2": "Näytä tämän päivän tuntihinnat",
    "example3": "Vertaa viime viikon hintoja"
  }
}
```

Also add to the `"footer"` section:

```json
"connectAI": "Yhdistä tekoäly"
```

- [ ] **Step 3: Commit**

```bash
git add messages/en.json messages/fi.json
git commit -m "Add i18n translations for connect page"
```

---

### Task 5: Create the connect/onboarding page

**Files:**
- Create: `app/[locale]/connect/page.tsx`

- [ ] **Step 1: Create the connect page**

```tsx
"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, ArrowLeft, Copy, Check, Bot, MessageSquare } from "lucide-react"

const MCP_URL = "https://spothinta.app/api/mcp"

export default function ConnectPage() {
  const t = useTranslations()
  const [copied, setCopied] = useState(false)

  const copyUrl = async () => {
    await navigator.clipboard.writeText(MCP_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="p-2 bg-primary rounded-lg">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t("connect.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("connect.description")}</p>
          </div>
        </div>

        {/* MCP URL */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bot className="h-5 w-5" />
              {t("connect.mcpUrl")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-3 py-2 bg-muted rounded-md text-sm font-mono break-all">
                {MCP_URL}
              </code>
              <Button variant="outline" size="sm" onClick={copyUrl}>
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    {t("connect.copied")}
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    {t("connect.copyUrl")}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">{t("connect.instructions.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-sm">
              <li>{t("connect.instructions.step1")}</li>
              <li>{t("connect.instructions.step2")}</li>
              <li>{t("connect.instructions.step3")}</li>
              <li>{t("connect.instructions.step4")}</li>
            </ol>
          </CardContent>
        </Card>

        {/* Example queries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageSquare className="h-5 w-5" />
              {t("connect.examples.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="px-3 py-2 bg-muted rounded-md italic">
                &ldquo;{t("connect.examples.example1")}&rdquo;
              </li>
              <li className="px-3 py-2 bg-muted rounded-md italic">
                &ldquo;{t("connect.examples.example2")}&rdquo;
              </li>
              <li className="px-3 py-2 bg-muted rounded-md italic">
                &ldquo;{t("connect.examples.example3")}&rdquo;
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds, new page accessible at `/en/connect` and `/fi/connect`.

- [ ] **Step 3: Commit**

```bash
git add app/\[locale\]/connect/page.tsx
git commit -m "Add connect/onboarding page for MCP server"
```

---

### Task 6: Add "Connect AI" link to footer

**Files:**
- Modify: `app/[locale]/page.tsx` (around line 245-251)

- [ ] **Step 1: Add the link to the footer**

In `app/[locale]/page.tsx`, find this block (around line 245):

```tsx
          <p className="mt-2">
            {t("footer.vatNote")}
            {" • "}
            <Link href="/privacy" className="underline hover:text-foreground">
              {t("footer.privacy")}
            </Link>
          </p>
```

Replace with:

```tsx
          <p className="mt-2">
            {t("footer.vatNote")}
            {" • "}
            <Link href="/privacy" className="underline hover:text-foreground">
              {t("footer.privacy")}
            </Link>
            {" • "}
            <Link href="/connect" className="underline hover:text-foreground">
              {t("footer.connectAI")}
            </Link>
          </p>
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

Expected: Build succeeds, footer shows new "Connect AI" link.

- [ ] **Step 3: Commit**

```bash
git add app/\[locale\]/page.tsx
git commit -m "Add Connect AI link to footer"
```

---

### Task 7: Final verification

- [ ] **Step 1: Full build check**

```bash
pnpm build
```

Expected: Build succeeds with no errors or warnings.

- [ ] **Step 2: Run lint**

```bash
pnpm lint
```

Expected: No lint errors.

- [ ] **Step 3: Test MCP endpoint locally**

```bash
pnpm dev &
sleep 3

# Test initialize
curl -s -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}'

# Test tools/list
curl -s -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}'

# Test get_current_price
curl -s -X POST http://localhost:3000/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_current_price","arguments":{}}}'
```

Expected:
- Initialize returns server info with MCP capabilities
- tools/list returns 4 tools: get_current_price, get_today_prices, get_tomorrow_prices, get_price_history
- get_current_price returns current price data

- [ ] **Step 4: Verify connect page renders**

Open `http://localhost:3000/en/connect` and `http://localhost:3000/fi/connect` in a browser. Both should render correctly with proper translations.

- [ ] **Step 5: Verify footer link**

Open `http://localhost:3000/en` — footer should show "Connect AI" link that navigates to `/en/connect`.
