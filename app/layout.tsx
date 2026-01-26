import type { ReactNode } from "react"

// Root layout required for Next.js but most logic is in [locale]/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return children
}
