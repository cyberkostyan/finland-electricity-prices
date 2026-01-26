"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { PriceAlerts } from "@/components/PriceAlerts"
import { PrivacySettings } from "@/components/PrivacySettings"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { Zap, ArrowLeft } from "lucide-react"

export default function SettingsPage() {
  const t = useTranslations()

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
              <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
              <p className="text-muted-foreground text-sm">
                {t("settings.description")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        {/* Price Alerts */}
        <PriceAlerts />

        {/* Privacy & Data */}
        <PrivacySettings />

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
          <p>{t("alerts.notificationsRequirePermission")}</p>
        </footer>
      </div>
    </main>
  )
}
