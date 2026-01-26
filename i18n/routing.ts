import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["fi", "en"],

  // Used when no locale matches
  defaultLocale: "fi",

  // Don't show locale prefix for default locale
  localePrefix: "as-needed",

  // Detect locale from cookie
  localeDetection: true,
})
