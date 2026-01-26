import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["fi", "en"],

  // Used when no locale matches
  defaultLocale: "fi",

  // Don't show locale prefix for default locale
  localePrefix: "as-needed",

  // Disable auto-detection from Accept-Language header
  // Users will always get Finnish by default, unless they have a cookie
  localeDetection: false,
})
