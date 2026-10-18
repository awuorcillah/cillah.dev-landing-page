import fs from "fs"
import path from "path"
import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowLeft, ArrowRight, Clock, Calendar, Sparkles, Share2 } from "lucide-react"

interface ArticleData {
  title: string
  slug: string
  teaser: string
  date: string
  author: string
  category: string
  readTime: string
  featured?: boolean
  content: string
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

function parseFrontmatter(raw: string, fallbackSlug: string): ArticleData {
  const parts = raw.split("---")
  const data: any = { content: "", slug: fallbackSlug }

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

  return data as ArticleData
}

function getArticle(slug: string): ArticleData | null {
  const dir = path.join(process.cwd(), "content/articles")
  if (!fs.existsSync(dir)) return null

  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
    const fullPath = path.join(dir, file)
    const raw = fs.readFileSync(fullPath, "utf-8")
    const fileSlug = extractSlugFromFrontmatter(raw, file)
    if (fileSlug === slug) {
      return parseFrontmatter(raw, slug)
    }
  }

  return null
}

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), "content/articles")
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir)
  const params: { slug: string }[] = []

  for (const file of files.filter((f) => f.endsWith(".md"))) {
    const fullPath = path.join(dir, file)
    const raw = fs.readFileSync(fullPath, "utf-8")
    const slug = extractSlugFromFrontmatter(raw, file)
    if (slug) params.push({ slug })
  }
  return params
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const article = getArticle(slug)

  if (!article) {
    return {
      title: "Article Not Found | Cillah.dev",
    }
  }

  const canonicalUrl = `https://cillah.dev/articles/${slug}`

  return {
    title: `${article.title} | Cillah.dev`,
    description: article.teaser,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${article.title} | Cillah.dev`,
      description: article.teaser,
      url: canonicalUrl,
      type: "article",
      publishedTime: article.date,
      authors: [article.author || "Cillah AI Automation"],
      images: ["/images/cillah-emblem.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${article.title} | Cillah.dev`,
      description: article.teaser,
      images: ["/images/cillah-emblem.png"],
    },
  }
}

function parseInlineBold(text: string) {
  const parts = text.split("**")
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-[#F9F7F6]">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

function parseMarkdown(text: string) {
  const lines = text.split("\n")
  return lines
    .map((line, idx) => {
      const trimmed = line.trim()

      if (trimmed.startsWith("###")) {
        return (
          <h3
            key={idx}
            className="font-heading font-medium text-[20px] md:text-[22px] text-[#F9F7F6] mt-8 mb-3"
          >
            {trimmed.slice(3).trim()}
          </h3>
        )
      }
      if (trimmed.startsWith("##")) {
        return (
          <h2
            key={idx}
            className="font-heading font-light text-[26px] md:text-[30px] text-[#F9F7F6] mt-12 mb-5 pb-3 border-b border-white/10"
          >
            {trimmed.slice(2).trim()}
          </h2>
        )
      }
      if (trimmed.startsWith("#")) {
        return (
          <h1
            key={idx}
            className="font-heading font-light text-[32px] md:text-[38px] text-[#F9F7F6] mt-12 mb-6"
          >
            {trimmed.slice(1).trim()}
          </h1>
        )
      }
      if (trimmed.startsWith("-")) {
        const contentText = trimmed.slice(1).trim()
        return (
          <li
            key={idx}
            className="flex items-start gap-3 my-3 text-[#F9F7F6]/80 font-sans font-light text-[16px] sm:text-[17px] leading-relaxed"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#C9A66B] shrink-0 mt-2.5" />
            <span>{parseInlineBold(contentText)}</span>
          </li>
        )
      }
      if (trimmed.startsWith("\u201c") || trimmed.startsWith('"') || trimmed.startsWith("`")) {
        const cleanQuote = trimmed.replace(/[\u201c\u201d"`]/g, "")
        return (
          <blockquote
            key={idx}
            className="border-l-2 border-[#C9A66B] pl-5 italic text-[#F9F7F6]/90 my-8 font-sans text-[17px] sm:text-[18px] bg-white/[0.02] py-4 pr-4 rounded-r-lg"
          >
            &ldquo;{cleanQuote}&rdquo;
          </blockquote>
        )
      }
      if (trimmed === "") return null
      return (
        <p
          key={idx}
          className="my-5 text-[#F9F7F6]/75 font-sans font-light text-[16px] sm:text-[17px] leading-relaxed"
        >
          {parseInlineBold(trimmed)}
        </p>
      )
    })
    .filter((el) => el !== null)
}

export default async function ArticleDetailPage({ params }: PageProps) {
  const { slug } = await params
  const article = getArticle(slug)

  if (!article) {
    notFound()
  }

  const canonicalUrl = `https://cillah.dev/articles/${slug}`

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#07070B] text-[#F9F7F6] font-sans font-light pt-32 pb-24 relative overflow-hidden">
        {/* Subtle Ambient Background Glows */}
        <div className="absolute top-10 left-1/4 w-[600px] h-[400px] rounded-full bg-[#C9A66B]/5 blur-[160px] pointer-events-none -z-10" />

        {/* TOP BREADCRUMB */}
        <div className="container mx-auto max-w-3xl px-6 mb-8 relative z-10">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-xs font-heading tracking-wider uppercase text-[#F9F7F6]/50 hover:text-[#C9A66B] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Articles
          </Link>
        </div>

        {/* ARTICLE HEADER */}
        <header className="container mx-auto max-w-3xl px-6 mb-12 relative z-10">
          <div className="flex flex-wrap items-center gap-3 text-xs mb-6">
            <span className="font-heading font-medium uppercase tracking-wider text-[#C9A66B] bg-[#C9A66B]/10 border border-[#C9A66B]/25 px-3 py-1 rounded-full">
              {article.category || "Strategy"}
            </span>
            {article.readTime && (
              <span className="inline-flex items-center gap-1.5 text-[#F9F7F6]/50">
                <Clock className="w-3.5 h-3.5" />
                {article.readTime}
              </span>
            )}
            {article.date && (
              <span className="inline-flex items-center gap-1.5 text-[#F9F7F6]/50">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(article.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>

          <h1 className="font-heading font-light text-[32px] sm:text-[42px] md:text-[48px] leading-[1.18] text-[#F9F7F6] mb-6 text-balance">
            {article.title}
          </h1>

          <p className="text-[17px] sm:text-[19px] leading-relaxed text-[#F9F7F6]/70 italic border-l-2 border-[#C9A66B]/50 pl-4 my-6 font-light">
            {article.teaser}
          </p>

          <div className="pt-6 border-t border-white/10 flex items-center justify-between text-xs text-[#F9F7F6]/50">
            <div>
              Author: <span className="text-[#F9F7F6]/80 font-medium">{article.author || "Cillah AI Automation"}</span>
            </div>
            <div>
              Headquarters: <span className="text-[#F9F7F6]/80">Nairobi, Kenya</span>
            </div>
          </div>
        </header>

        {/* ARTICLE CONTENT */}
        <article className="container mx-auto max-w-3xl px-6 relative z-10">
          <div className="prose prose-invert max-w-none">
            {parseMarkdown(article.content)}
          </div>
        </article>

        {/* BOTTOM CALL TO ACTION */}
        <section className="container mx-auto max-w-4xl px-6 mt-20 relative z-10">
          <div className="rounded-[22px] bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 p-8 sm:p-14 text-center relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-heading font-medium tracking-widest uppercase text-[#C9A66B] mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Next Step</span>
            </div>

            <h2 className="font-heading font-light text-[26px] sm:text-[32px] text-[#F9F7F6] mb-4">
              Ready to Upgrade to a Digital Operating System?
            </h2>
            <p className="text-[15px] sm:text-[16px] text-[#F9F7F6]/70 leading-relaxed mb-8 max-w-xl mx-auto font-light">
              Book a one-on-one consultation with Cillah.dev to map out custom web applications, autonomous inbox agents, and revenue pipelines for your business.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/book-consultation"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-[#C9A66B] text-[#07070B] hover:bg-[#C9A66B]/90 font-heading font-semibold rounded-[16px] px-8 py-3.5 text-[14px] tracking-wide transition-all duration-300 hover:shadow-[0_0_20px_rgba(201,166,107,0.35)]"
              >
                <span>Book Consultation</span>
                <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
              </a>
              <Link
                href="/articles"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-white/5 text-[#F9F7F6] border border-white/10 hover:border-[#C9A66B]/40 font-heading font-medium rounded-[16px] px-6 py-3.5 text-[14px] tracking-wide transition-colors"
              >
                Explore More Articles
              </Link>
            </div>
          </div>
        </section>

        {/* Schema.org Article JSON-LD for Generative Engine Optimization (GEO) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: article.title,
              description: article.teaser,
              datePublished: article.date,
              dateModified: article.date,
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": canonicalUrl,
              },
              author: {
                "@type": "Organization",
                name: article.author || "Cillah AI Automation",
                url: "https://cillah.dev",
              },
              publisher: {
                "@type": "Organization",
                name: "Cillah.dev",
                legalName: "Cillah AI Automation",
                url: "https://cillah.dev",
                logo: {
                  "@type": "ImageObject",
                  url: "https://cillah.dev/images/cillah-emblem.png",
                },
              },
            }),
          }}
        />
      </main>

      <Footer />
    </>
  )
}
