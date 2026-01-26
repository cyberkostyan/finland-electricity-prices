import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { ThemeProvider } from "@/components/ThemeProvider"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"
import "../globals.css"

const inter = Inter({ subsets: ["latin"] })

const BASE_URL = "https://spothinta.app"

type Props = {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale })

  const title = locale === "fi"
    ? "Spothinta - Suomen sähkön spot-hinnat reaaliajassa"
    : "Spothinta - Finland Electricity Spot Prices in Real-Time"

  const description = locale === "fi"
    ? "Seuraa Suomen sähkön spot-hintoja reaaliajassa. Näe nykyinen hinta, ennusteet ja parhaat tunnit sähkönkäyttöön. Hinnat sisältävät ALV 25,5%."
    : "Track Finland electricity spot prices in real-time. See current price, ML predictions and best hours for energy consumption. Prices include 25.5% VAT."

  const keywords = locale === "fi"
    ? [
        "sähkön hinta",
        "spot-hinta",
        "sähkö hinta nyt",
        "pörssisähkö",
        "sähkön hinta tänään",
        "sähkön hinta huomenna",
        "halvimmat tunnit",
        "sähköhinta",
        "nordpool",
        "sähkön spot-hinta",
        "suomen sähkö",
        "sähkön hintaennuste",
        "spothinta",
      ]
    : [
        "electricity price",
        "spot price",
        "finland electricity",
        "nordpool",
        "energy prices",
        "cheapest hours",
        "power price",
        "electricity forecast",
        "spothinta",
      ]

  return {
    title,
    description,
    keywords,
    authors: [{ name: "Spothinta" }],
    creator: "Spothinta",
    publisher: "Spothinta",
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: locale === "fi" ? BASE_URL : `${BASE_URL}/en`,
      languages: {
        "fi": BASE_URL,
        "en": `${BASE_URL}/en`,
        "x-default": BASE_URL,
      },
    },
    openGraph: {
      title,
      description,
      url: locale === "fi" ? BASE_URL : `${BASE_URL}/en`,
      siteName: "Spothinta",
      locale: locale === "fi" ? "fi_FI" : "en_US",
      alternateLocale: locale === "fi" ? "en_US" : "fi_FI",
      type: "website",
      images: [
        {
          url: `${BASE_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: locale === "fi" ? "Spothinta - Suomen sähkön spot-hinnat" : "Spothinta - Finland Electricity Prices",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${BASE_URL}/og-image.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      // Add verification codes when available
      // google: "your-google-verification-code",
    },
    category: "technology",
    other: {
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "apple-mobile-web-app-title": "Spothinta",
      "mobile-web-app-capable": "yes",
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as "en" | "fi")) {
    notFound()
  }

  // Providing all messages to the client
  const messages = await getMessages()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Spothinta",
    description: locale === "fi"
      ? "Suomen sähkön spot-hinnat reaaliajassa"
      : "Finland electricity spot prices in real-time",
    url: BASE_URL,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
    },
    inLanguage: locale === "fi" ? "fi-FI" : "en-US",
    isAccessibleForFree: true,
    creator: {
      "@type": "Organization",
      name: "Spothinta",
    },
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
