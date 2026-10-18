import fs from "fs"
import path from "path"
import Link from "next/link"
import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowRight, Sparkles, BookOpen, Clock, Calendar, ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Articles & Knowledge Hub | Cillah.dev",
  description:
    "Insights on custom web applications, autonomous AI agents in messaging inboxes, and marketing-to-operations CRM automation for high-performing businesses.",
  alternates: {
    canonical: "https://cillah.dev/articles",
  },
  openGraph: {
    title: "Articles & Knowledge Hub | Cillah.dev",
    description:
      "Insights on custom web applications, autonomous AI agents in messaging inboxes, and marketing-to-operations CRM automation for high-performing businesses.",
    url: "https://cillah.dev/articles",
    type: "website",
    images: ["/images/cillah-emblem.png"],
  },
}

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

function getArticles(): ArticleData[] {
  const dir = path.join(process.cwd(), "content/articles")
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir)

  return files
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const fullPath = path.join(dir, file)
      const rawContent = fs.readFileSync(fullPath, "utf-8")

      const parts = rawContent.split("---")
      let data: any = { content: "" }

      if (parts.length >= 3) {
        const frontmatter = parts[1]
        data.content = parts.slice(2).join("---").trim()

        const lines = frontmatter.split("\n")
        lines.forEach((line) => {
          const index = line.indexOf(":")
          if (index > -1) {
            const key = line.slice(0, index).trim()
            let value: any = line.slice(index + 1).trim()

            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1)
            } else if (value.startsWith("'") && value.endsWith("'")) {
              value = value.slice(1, -1)
            } else if (value === "true") {
              value = true
            } else if (value === "false") {
              value = false
            }
            data[key] = value
          }
        })
      } else {
        data.content = rawContent.trim()
      }

      if (!data.slug) {
        data.slug = file.replace(/\.md$/, "")
      }

      return data as ArticleData
    })
    .sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateB - dateA
    })
}

export default function ArticlesPage() {
  const articles = getArticles()

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#07070B] text-[#F9F7F6] font-sans font-light pt-32 md:pt-40 pb-24 relative overflow-hidden">
        {/* Subtle Ambient Background Glows */}
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-[#C9A66B]/5 blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] rounded-full bg-[#F2B6C1]/3 blur-[160px] pointer-events-none -z-10" />

        {/* HEADER SECTION */}
        <section className="container mx-auto max-w-5xl px-6 md:px-12 text-center mb-20 relative z-10">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/10 mb-6 shadow-sm">
              <Sparkles className="h-4 w-4 text-[#C9A66B]" />
              <span className="text-[11px] font-heading font-medium tracking-[0.2em] uppercase text-[#C9A66B]">
                Knowledge &amp; Engineering Hub
              </span>
            </div>

            <h1 className="font-heading font-light text-[34px] sm:text-[44px] md:text-[54px] leading-tight text-[#F9F7F6] mb-6 text-balance">
              Strategic Insights for Business Automation
            </h1>

            <p className="text-[16px] sm:text-[18px] leading-relaxed text-[#F9F7F6]/70 max-w-2xl mx-auto font-light">
              In-depth analysis on modern web operating systems, autonomous AI agents in messaging inboxes, and connective workflow pipelines.
            </p>
          </div>
        </section>

        {/* ARTICLES FEED */}
        <section className="container mx-auto max-w-4xl px-6 relative z-10">
          <div className="space-y-8">
            {articles.map((item) => (
              <article
                key={item.slug}
                className="p-8 md:p-10 rounded-[20px] bg-white/[0.02] border border-white/10 hover:border-[#C9A66B]/40 hover:bg-white/[0.035] transition-all duration-300 flex flex-col justify-between group shadow-sm"
              >
                <div>
                  {/* Category & Read Time Meta */}
                  <div className="flex flex-wrap items-center gap-3 text-xs mb-5">
                    <span className="font-heading font-medium uppercase tracking-wider text-[#C9A66B] bg-[#C9A66B]/10 border border-[#C9A66B]/25 px-3 py-1 rounded-full">
                      {item.category || "Strategy"}
                    </span>
                    {item.readTime && (
                      <span className="inline-flex items-center gap-1.5 text-[#F9F7F6]/50">
                        <Clock className="w-3.5 h-3.5" />
                        {item.readTime}
                      </span>
                    )}
                    {item.date && (
                      <span className="inline-flex items-center gap-1.5 text-[#F9F7F6]/50">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="font-heading font-medium text-[22px] sm:text-[26px] leading-snug text-[#F9F7F6] mb-4 group-hover:text-[#C9A66B] transition-colors duration-300">
                    <Link href={`/articles/${item.slug}`}>{item.title}</Link>
                  </h2>

                  {/* Teaser Description */}
                  <p className="text-[15px] sm:text-[16px] leading-relaxed text-[#F9F7F6]/70 font-light mb-8">
                    {item.teaser}
                  </p>
                </div>

                {/* Footer Bar with Author & Read More */}
                <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs text-[#F9F7F6]/45">
                    Published by <span className="text-[#F9F7F6]/80 font-medium">{item.author || "Cillah AI Automation"}</span>
                  </div>

                  <Link
                    href={`/articles/${item.slug}`}
                    className="inline-flex items-center text-[#C9A66B] hover:text-[#F9F7F6] font-heading font-medium text-[14px] tracking-wide transition-colors group-hover:translate-x-1 duration-300"
                  >
                    <span>Read Article</span>
                    <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
                  </Link>
                </div>
              </article>
            ))}

            {articles.length === 0 && (
              <p className="text-center text-[#F9F7F6]/40 py-16">
                No articles published yet.
              </p>
            )}
          </div>
        </section>

        {/* Schema.org CollectionPage / Blog Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              name: "Articles & Knowledge Hub | Cillah.dev",
              description:
                "Insights on custom web applications, autonomous AI agents in messaging inboxes, and marketing-to-operations CRM automation.",
              url: "https://cillah.dev/articles",
              publisher: {
                "@type": "Organization",
                name: "Cillah.dev",
                legalName: "Cillah AI Automation",
                url: "https://cillah.dev",
                logo: "https://cillah.dev/images/cillah-emblem.png",
              },
            }),
          }}
        />
      </main>

      <Footer />
    </>
  )
}
