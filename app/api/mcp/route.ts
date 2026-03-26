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
