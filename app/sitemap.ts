import { MetadataRoute } from "next"

const BASE_URL = "https://spothinta.app"

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["fi", "en"]
  const routes = ["", "/history", "/settings"]

  const sitemap: MetadataRoute.Sitemap = []

  // Add routes for each locale
  for (const route of routes) {
    // Finnish (default) - no prefix
    sitemap.push({
      url: `${BASE_URL}${route}`,
      lastModified: new Date(),
      changeFrequency: route === "" ? "hourly" : "weekly",
      priority: route === "" ? 1 : 0.8,
      alternates: {
        languages: {
          fi: `${BASE_URL}${route}`,
          en: `${BASE_URL}/en${route}`,
        },
      },
    })

    // English - with /en prefix
    sitemap.push({
      url: `${BASE_URL}/en${route}`,
      lastModified: new Date(),
      changeFrequency: route === "" ? "hourly" : "weekly",
      priority: route === "" ? 0.9 : 0.7,
      alternates: {
        languages: {
          fi: `${BASE_URL}${route}`,
          en: `${BASE_URL}/en${route}`,
        },
      },
    })
  }

  return sitemap
}
