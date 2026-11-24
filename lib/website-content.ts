import fs from "fs"
import path from "path"
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js"
import type { MarketingMediaFile } from "@/lib/marketing-config"

export interface ArticleData {
  title: string
  slug: string
  teaser: string
  date: string
  author: string
  category: string
  readTime: string
  featured?: boolean
  featuredImage?: string
  content: string
  source?: "markdown" | "marketing_hub"
}

export interface UseCaseData {
  title: string
  slug: string
  teaser: string
  featuredImage?: string
  publishedAt?: string
  featured?: boolean
  content: string
  source?: "markdown" | "marketing_hub"
}

function getPublicSupabaseClient() {
  const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "")
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  if (!rawUrl || !anonKey) return null
  return createSupabaseJsClient(rawUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function extractSlugFromFrontmatter(raw: string, filename: string): string {
  const parts = raw.split("---")
  if (parts.length >= 3) {
    for (const line of parts[1].split("\n")) {
      const index = line.indexOf(":")
      if (index > -1) {
        const key = line.slice(0, index).trim()
        if (key === "slug") {
          let value = line.slice(index + 1).trim()
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1)
          }
          if (value) return value
        }
      }
    }
  }
  return filename.replace(/\.md$/, "")
}

function parseFrontmatter<T>(raw: string, fallbackSlug: string): T {
  const parts = raw.split("---")
  const data: Record<string, any> = { content: "", slug: fallbackSlug }

  if (parts.length >= 3) {
    data.content = parts.slice(2).join("---").trim()
    for (const line of parts[1].split("\n")) {
      const index = line.indexOf(":")
      if (index > -1) {
        const key = line.slice(0, index).trim()
        let value: any = line.slice(index + 1).trim()
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1)
        } else if (value === "true") {
          value = true
        } else if (value === "false") {
          value = false
        }
        data[key] = value
      }
    }
  } else {
    data.content = raw.trim()
  }

  return data as T
}

function readLocalMarkdownFiles<T extends { slug: string }>(
  subdir: "articles" | "use-cases"
): T[] {
  const dir = path.join(process.cwd(), "content", subdir)
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const fullPath = path.join(dir, file)
      const raw = fs.readFileSync(fullPath, "utf-8")
      const slug = extractSlugFromFrontmatter(raw, file)
      const parsed = parseFrontmatter<T>(raw, slug)
      return { ...parsed, slug, source: "markdown" }
    })
}

function extractFirstImageUrl(mediaFiles?: MarketingMediaFile[] | null): string | undefined {
  if (!Array.isArray(mediaFiles)) return undefined
  const img = mediaFiles.find((m) => m.kind === "image" && m.url)
  return img?.url
}

async function fetchPublishedMarketingPosts(
  channel: "website_articles" | "website_use_cases"
): Promise<any[]> {
  try {
    const supabase = getPublicSupabaseClient()
    if (!supabase) return []

    const { data, error } = await supabase
      .from("marketing_posts")
      .select(
        "id, title, caption, website_slug, website_teaser, website_category, website_read_time, website_featured, author_name, published_at, created_at, media_files"
      )
      .eq("status", "published")
      .contains("channels", [channel])
      .order("published_at", { ascending: false })

    if (error || !data) return []
    return data
  } catch {
    return []
  }
}

export async function getAllArticles(): Promise<ArticleData[]> {
  const localArticles = readLocalMarkdownFiles<ArticleData>("articles")
  const dbRows = await fetchPublishedMarketingPosts("website_articles")

  const dbArticles: ArticleData[] = dbRows
    .filter((row) => Boolean(row.website_slug))
    .map((row) => ({
      title: row.title,
      slug: row.website_slug,
      teaser:
        row.website_teaser ||
        (row.caption || "").slice(0, 180) + ((row.caption || "").length > 180 ? "..." : ""),
      date: row.published_at || row.created_at,
      author: row.author_name || "Cillah AI Automation",
      category: row.website_category || "Marketing & Automation",
      readTime: row.website_read_time || "4 min read",
      featured: Boolean(row.website_featured),
      featuredImage: extractFirstImageUrl(row.media_files),
      content: row.caption || "",
      source: "marketing_hub",
    }))

  const bySlug = new Map<string, ArticleData>()
  for (const item of localArticles) bySlug.set(item.slug, item)
  for (const item of dbArticles) bySlug.set(item.slug, item)

  return Array.from(bySlug.values()).sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0
    const dateB = b.date ? new Date(b.date).getTime() : 0
    return dateB - dateA
  })
}

export async function getArticleBySlug(slug: string): Promise<ArticleData | null> {
  const all = await getAllArticles()
  return all.find((a) => a.slug === slug) || null
}

export async function getAllUseCases(): Promise<UseCaseData[]> {
  const localUseCases = readLocalMarkdownFiles<UseCaseData>("use-cases")
  const dbRows = await fetchPublishedMarketingPosts("website_use_cases")

  const dbUseCases: UseCaseData[] = dbRows
    .filter((row) => Boolean(row.website_slug))
    .map((row) => ({
      title: row.title,
      slug: row.website_slug,
      teaser:
        row.website_teaser ||
        (row.caption || "").slice(0, 180) + ((row.caption || "").length > 180 ? "..." : ""),
      featuredImage: extractFirstImageUrl(row.media_files),
      publishedAt: row.published_at || row.created_at,
      featured: Boolean(row.website_featured),
      content: row.caption || "",
      source: "marketing_hub",
    }))

  const bySlug = new Map<string, UseCaseData>()
  for (const item of localUseCases) bySlug.set(item.slug, item)
  for (const item of dbUseCases) bySlug.set(item.slug, item)

  return Array.from(bySlug.values()).sort((a, b) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
    return dateB - dateA
  })
}

export async function getUseCaseBySlug(slug: string): Promise<UseCaseData | null> {
  const all = await getAllUseCases()
  return all.find((u) => u.slug === slug) || null
}
