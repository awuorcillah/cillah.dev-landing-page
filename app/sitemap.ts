import fs from "fs"
import path from "path"
import type { MetadataRoute } from "next"
import { SITE_URL, absoluteUrl } from "@/lib/site-config"

const FALLBACK_CONTENT_DATE = "2026-09-29"

const STATIC_PAGE_DATES = {
  home: "2026-11-22",
  ourServices: "2026-11-22",
  bookConsultation: "2026-11-22",
  articles: "2026-10-18",
  useCases: "2026-11-22",
  pricing: "2026-11-22",
  clientPortal: "2026-11-22",
  privacyPolicy: "2026-10-01",
  terms: "2026-10-01",
} as const

function extractFrontmatter(raw: string, filename: string): { slug: string; date?: string } {
  let slug = filename.replace(/\.md$/, "")
  let date: string | undefined

  const parts = raw.split("---")
  if (parts.length >= 3) {
    for (const line of parts[1].split("\n")) {
      const index = line.indexOf(":")
      if (index > -1) {
        const key = line.slice(0, index).trim()
        let value = line.slice(index + 1).trim()
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        }
        if (key === "slug" && value) slug = value
        if ((key === "updatedAt" || key === "date" || key === "publishedAt") && value) {
          date = value
        }
      }
    }
  }

  return { slug, date }
}

function toValidDate(value: string | undefined, fallback: string): Date {
  if (value) {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }
  return new Date(fallback)
}

export default function sitemap(): MetadataRoute.Sitemap {
  // 1. Dynamic Articles (/articles/[slug]) — real dates from TinaCMS / frontmatter
  const articlesDir = path.join(process.cwd(), "content/articles")
  const articleRoutes: MetadataRoute.Sitemap = []
  if (fs.existsSync(articlesDir)) {
    const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith(".md"))
    for (const file of files) {
      const raw = fs.readFileSync(path.join(articlesDir, file), "utf-8")
      const { slug, date } = extractFrontmatter(raw, file)
      if (slug) {
        articleRoutes.push({
          url: absoluteUrl(`/articles/${slug}`),
          lastModified: toValidDate(date, STATIC_PAGE_DATES.articles),
        })
      }
    }
  }

  // 2. Dynamic Use Cases (/use-cases/[slug]) — real dates from TinaCMS / frontmatter
  const useCasesDir = path.join(process.cwd(), "content/use-cases")
  const useCaseRoutes: MetadataRoute.Sitemap = []
  if (fs.existsSync(useCasesDir)) {
    const files = fs.readdirSync(useCasesDir).filter((f) => f.endsWith(".md"))
    for (const file of files) {
      const raw = fs.readFileSync(path.join(useCasesDir, file), "utf-8")
      const { slug, date } = extractFrontmatter(raw, file)
      if (slug) {
        useCaseRoutes.push({
          url: absoluteUrl(`/use-cases/${slug}`),
          lastModified: toValidDate(date, FALLBACK_CONTENT_DATE),
        })
      }
    }
  }

  // 3. Static Indexable Core Pages in priority order (/login and /signup excluded)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(STATIC_PAGE_DATES.home),
    },
    {
      url: absoluteUrl("/book-consultation"),
      lastModified: new Date(STATIC_PAGE_DATES.bookConsultation),
    },
    {
      url: absoluteUrl("/our-services"),
      lastModified: new Date(STATIC_PAGE_DATES.ourServices),
    },
    {
      url: absoluteUrl("/pricing"),
      lastModified: new Date(STATIC_PAGE_DATES.pricing),
    },
    {
      url: absoluteUrl("/use-cases"),
      lastModified: new Date(STATIC_PAGE_DATES.useCases),
    },
    {
      url: absoluteUrl("/articles"),
      lastModified: new Date(STATIC_PAGE_DATES.articles),
    },
    {
      url: absoluteUrl("/client-portal"),
      lastModified: new Date(STATIC_PAGE_DATES.clientPortal),
    },
    {
      url: absoluteUrl("/privacy-policy"),
      lastModified: new Date(STATIC_PAGE_DATES.privacyPolicy),
    },
    {
      url: absoluteUrl("/terms"),
      lastModified: new Date(STATIC_PAGE_DATES.terms),
    },
  ]

  return [...staticRoutes, ...articleRoutes, ...useCaseRoutes]
}
