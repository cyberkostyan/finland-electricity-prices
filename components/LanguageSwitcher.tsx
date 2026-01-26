"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"

const LOCALE_COOKIE = "NEXT_LOCALE"

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const toggleLocale = () => {
    const newLocale = locale === "fi" ? "en" : "fi"

    // Save preference in cookie (1 year expiry)
    document.cookie = `${LOCALE_COOKIE}=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`

    router.replace(pathname, { locale: newLocale })
  }

  return (
    <Button variant="outline" size="sm" onClick={toggleLocale}>
      {locale === "fi" ? "EN" : "FI"}
    </Button>
  )
}
