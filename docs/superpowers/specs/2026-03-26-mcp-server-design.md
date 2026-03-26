# MCP Server for Spothinta — Design Spec

## Overview

Add a public MCP (Model Context Protocol) server to the Spothinta application, enabling AI agents (Claude Desktop, Cursor, etc.) and developers to query real-time and historical Finnish electricity prices programmatically via the MCP protocol.

## Architecture

Single API route `/api/mcp` in the existing Next.js application, using:
- `mcp-handler` (Vercel) for Next.js integration
- `@modelcontextprotocol/sdk` for MCP protocol
- Streamable HTTP transport in stateless mode (no sessions)

```
Claude Desktop / AI Agent
        |
        v
  POST /api/mcp  (Streamable HTTP)
        |
        v
   MCP Server (mcp-handler)
        |
        v
   Sahkotin API (prices)
```

The server reuses existing price-fetching logic from `lib/api.ts`.

## MCP Tools

### `get_current_price`
- **Description:** Get the current electricity price in Finland
- **Parameters:** none
- **Returns:** `{ time: string (ISO), price: number (c/kWh incl. 25.5% VAT) }`

### `get_today_prices`
- **Description:** Get hourly electricity prices for today
- **Parameters:** none
- **Returns:** `{ prices: Array<{ time: string (ISO), price: number }> }`

### `get_tomorrow_prices`
- **Description:** Get hourly electricity prices for tomorrow (available after ~14:00 EET)
- **Parameters:** none
- **Returns:** `{ prices: Array<{ time: string (ISO), price: number }> }` or message explaining prices are not yet available

### `get_price_history`
- **Description:** Get historical electricity prices for a date range
- **Parameters:**
  - `start: string` — ISO date (e.g. "2026-03-01")
  - `end: string` — ISO date (e.g. "2026-03-15")
- **Returns:** `{ prices: Array<{ time: string (ISO), price: number }> }`
- **Validation:** Zod schema, max 30-day range

All prices are in **c/kWh including 25.5% VAT**, consistent with the website display.

## API Route Implementation

File: `app/api/mcp/route.ts`

- Uses `createMcpHandler` from `mcp-handler`
- Exports `GET`, `POST`, `DELETE` handlers
- `basePath: "/api"` to match route structure
- Stateless mode (`sessionIdGenerator: undefined`)
- Tools registered via `server.tool()` with Zod validation

## Onboarding Page

New page: `app/[locale]/connect/page.tsx` (i18n: fi/en)

### Content:
1. **Title** — "Connect AI to Spothinta" / "Yhdista tekoaly Spothintaan"
2. **MCP URL** — `https://spothinta.app/api/mcp` with copy button
3. **Step-by-step instructions** for Claude Desktop:
   - Open Settings > Connectors
   - Click "Add Custom Integration"
   - Paste the URL
4. **Example queries** — "What's the current electricity price?", "Show me today's prices", "What are the cheapest hours today?"
5. **Footer link** — "Connect AI" link added to site footer pointing to this page

### Design:
- Consistent with existing site styling (shadcn/ui + Tailwind)
- Supports dark/light theme
- Responsive layout
- Localized (fi/en)

## Error Handling

- **Sahkotin API unavailable:** Return MCP error with message "Price data temporarily unavailable"
- **Tomorrow's prices not ready:** Return informational message "Tomorrow's prices are not yet available, they are typically published after 14:00 EET"
- **Invalid date range:** Zod validation error with descriptive message
- **Period too long:** Reject requests exceeding 30-day range

## Rate Limiting

No custom rate limiting. Relies on:
- Vercel serverless function limits
- Sahkotin API's own rate limits

## Dependencies

New packages to install:
- `mcp-handler` — Vercel's MCP handler for Next.js
- `@modelcontextprotocol/sdk` — Official MCP TypeScript SDK
- `zod` — Already in project (used by existing components)

## i18n

New translation keys in `messages/en.json` and `messages/fi.json` for the connect page:
- Page title, description, instructions, example queries

## Out of Scope

- Authentication / OAuth
- ML predictions data
- Weather data
- Custom rate limiting
- Session management
- Deep links (not supported by Claude Desktop)
