"use client"

import Link from "next/link"
import { PriceAlerts } from "@/components/PriceAlerts"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Zap, ArrowLeft } from "lucide-react"

export default function SettingsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="p-2 bg-primary rounded-lg">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground text-sm">
                Configure alerts and preferences
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Price Alerts */}
        <PriceAlerts />

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>
            Notifications require browser permission.
          </p>
        </footer>
      </div>
    </main>
  )
}
