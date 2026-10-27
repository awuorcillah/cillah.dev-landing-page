import fs from "fs"
import path from "path"
import type { MetadataRoute } from "next"

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
        if (key === "date" && value) date = value
        if (key === "publishedAt" && value) date = value
      }
    }
  }

  return { slug, date }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://cillah.dev"
  const now = new Date()

  // 1. Static Core Pages (Priority-weighted)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/our-services`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/book-consultation`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/articles`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/use-cases`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy-policy`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]

  // 2. Dynamic Articles (/articles/[slug])
  const articlesDir = path.join(process.cwd(), "content/articles")
  const articleRoutes: MetadataRoute.Sitemap = []
  if (fs.existsSync(articlesDir)) {
    const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith(".md"))
    for (const file of files) {
      const raw = fs.readFileSync(path.join(articlesDir, file), "utf-8")
      const { slug, date } = extractFrontmatter(raw, file)
      if (slug) {
        articleRoutes.push({
          url: `${baseUrl}/articles/${slug}`,
          lastModified: date ? new Date(date) : now,
          changeFrequency: "monthly",
          priority: 0.8,
        })
      }
    }
  }

  // 3. Dynamic Use Cases (/use-cases/[slug])
  const useCasesDir = path.join(process.cwd(), "content/use-cases")
  const useCaseRoutes: MetadataRoute.Sitemap = []
  if (fs.existsSync(useCasesDir)) {
    const files = fs.readdirSync(useCasesDir).filter((f) => f.endsWith(".md"))
    for (const file of files) {
      const raw = fs.readFileSync(path.join(useCasesDir, file), "utf-8")
      const { slug, date } = extractFrontmatter(raw, file)
      if (slug) {
        useCaseRoutes.push({
          url: `${baseUrl}/use-cases/${slug}`,
          lastModified: date ? new Date(date) : now,
          changeFrequency: "monthly",
          priority: 0.7,
        })
      }
    }
  }

  return [...staticRoutes, ...articleRoutes, ...useCaseRoutes]
}
