import fs from "fs"
import path from "path"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react"

interface UseCaseData {
  title: string
  slug: string
  teaser: string
  featuredImage?: string
  publishedAt?: string
  featured?: boolean
  content: string
}

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), "content/use-cases")
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir)
  const params: { slug: string }[] = []
  for (const file of files.filter(f => f.endsWith(".md"))) {
    const fullPath = path.join(dir, file)
    const raw = fs.readFileSync(fullPath, "utf-8")
    const slug = extractSlugFromFrontmatter(raw, file)
    if (slug) params.push({ slug })
  }
  return params
}

/**
 * Extract the value of the `slug` field from raw Markdown frontmatter.
 * Falls back to the filename (without .md) if no slug field is present.
 */
function extractSlugFromFrontmatter(raw: string, filename: string): string {
  const parts = raw.split("---")
  if (parts.length >= 3) {
    for (const line of parts[1].split("\n")) {
      const index = line.indexOf(":")
      if (index > -1) {
        const key = line.slice(0, index).trim()
        if (key === "slug") {
          let value = line.slice(index + 1).trim()
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
          }
          if (value) return value
        }
      }
    }
  }
  // fallback: use filename without extension
  return filename.replace(/\.md$/, "")
}

/**
 * Parse frontmatter key/value pairs from raw Markdown content.
 */
function parseFrontmatter(raw: string, fallbackSlug: string): UseCaseData {
  const parts = raw.split("---")
  const data: any = { content: "", slug: fallbackSlug }

  if (parts.length >= 3) {
    data.content = parts.slice(2).join("---").trim()
    for (const line of parts[1].split("\n")) {
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
    }
  } else {
    data.content = raw.trim()
  }

  return data as UseCaseData
}

/**
 * Find and return the use case whose frontmatter `slug` matches the requested slug.
 * Scans all .md files — the public URL is fully decoupled from the filename.
 */
function getUseCase(slug: string): UseCaseData | null {
  const dir = path.join(process.cwd(), "content/use-cases")
  if (!fs.existsSync(dir)) return null

  for (const file of fs.readdirSync(dir).filter(f => f.endsWith(".md"))) {
    const fullPath = path.join(dir, file)
    const raw = fs.readFileSync(fullPath, "utf-8")
    const fileSlug = extractSlugFromFrontmatter(raw, file)
    if (fileSlug === slug) {
      return parseFrontmatter(raw, slug)
    }
  }

  return null
}

function parseInlineBold(text: string) {
  const parts = text.split("**")
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-[#F9F7F6]">{part}</strong> : part)
}

function parseMarkdown(text: string) {
  const lines = text.split("\n")
  return lines.map((line, idx) => {
    const trimmed = line.trim()
    if (trimmed.startsWith("##")) {
      return (
        <h2 key={idx} className="font-heading font-normal text-[24px] md:text-[28px] text-[#F9F7F6] mt-12 mb-6 pb-2 border-b border-[#F4E7E7]/10">
          {trimmed.slice(2).trim()}
        </h2>
      )
    }
    if (trimmed.startsWith("#")) {
      return (
        <h1 key={idx} className="font-heading font-light text-[32px] text-[#F9F7F6] mt-12 mb-6">
          {trimmed.slice(1).trim()}
        </h1>
      )
    }
    if (trimmed.startsWith("-")) {
      const contentText = trimmed.slice(1).trim()
      return (
        <li key={idx} className="flex items-start gap-3 my-3 text-[#F9F7F6]/75 font-sans font-light text-[17px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C9A66B] shrink-0 mt-2.5" />
          <span>{parseInlineBold(contentText)}</span>
        </li>
      )
    }
    if (trimmed.startsWith("\u201c") || trimmed.startsWith("\"") || trimmed.startsWith("`")) {
      const cleanQuote = trimmed.replace(/[\u201c\u201d"`]/g, "")
      return (
        <blockquote key={idx} className="border-l-2 border-[#C9A66B] pl-4 italic text-[#F9F7F6] my-8 font-sans text-[18px]">
          &ldquo;{cleanQuote}&rdquo;
        </blockquote>
      )
    }
    if (trimmed === "") return null
    return (
      <p key={idx} className="my-5 text-[#F9F7F6]/75 font-sans font-light text-[17px] leading-relaxed">
        {parseInlineBold(trimmed)}
      </p>
    )
  }).filter(el => el !== null)
}

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function UseCasePage({ params }: PageProps) {
  const { slug } = await params
  const useCase = getUseCase(slug)
  
  if (!useCase) {
    notFound()
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#1C1C1C] text-[#F9F7F6] overflow-x-hidden font-sans font-light">
        
        {/* BACK NAVIGATION */}
        <div className="pt-32 pb-4 container mx-auto max-w-4xl px-6">
          <Link 
            href="/use-cases" 
            className="inline-flex items-center gap-2 text-sm text-[#F9F7F6]/55 hover:text-[#C9A66B] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>
        </div>

        {/* HERO TITLE HEADER */}
        <section className="pb-16 bg-[#1C1C1C] border-b border-[#F4E7E7]/5">
          <div className="container mx-auto max-w-4xl px-6">
            <span className="text-[12px] font-heading font-medium uppercase tracking-[0.2em] text-[#C9A66B] mb-4 block">
              {useCase.featured ? "Featured Case Study" : "Case Study Detail"}
            </span>
            <h1 className="font-heading font-light text-[32px] md:text-[46px] leading-tight text-[#F9F7F6] mb-8 text-balance">
              {useCase.title}
            </h1>
            <p className="text-[17px] leading-relaxed text-[#F9F7F6]/75 italic max-w-3xl font-light">
              {useCase.teaser}
            </p>
          </div>
        </section>

        {/* FEATURED IMAGE */}
        {useCase.featuredImage && (
          <section className="pt-12 pb-0 bg-[#1C1C1C]">
            <div className="container mx-auto max-w-4xl px-6">
              <img
                src={useCase.featuredImage}
                alt={useCase.title}
                className="w-full h-auto rounded-[16px] border border-[#F4E7E7]/10 object-contain"
              />
            </div>
          </section>
        )}

        {/* DYNAMIC MARKDOWN PARSED STORY */}
        <section className="py-20 bg-[#1C1C1C]">
          <div className="container mx-auto max-w-3xl px-6">
            <div className="prose prose-invert max-w-none space-y-6">
              {parseMarkdown(useCase.content)}
            </div>
          </div>
        </section>

        {/* PREMIUM CTA SECTION */}
        <section className="py-24 bg-[#1C1C1C] border-t border-[#F4E7E7]/5">
          <div className="container mx-auto max-w-5xl px-6">
            <div className="rounded-[16px] bg-gradient-to-b from-[#F4E7E7]/5 to-transparent border border-[#F4E7E7]/10 p-8 md:p-20 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[#C9A66B]/5 opacity-10 pointer-events-none" />
              
              <h2 className="font-heading font-light text-[28px] md:text-[32px] text-[#F9F7F6] mb-6">
                Ready to Automate Your Inquiry-to-Viewing Pipeline?
              </h2>
              <p className="text-[16px] md:text-[17px] text-[#F9F7F6]/75 leading-relaxed mb-10 max-w-xl mx-auto font-light">
                Discover how Cillah.ai customizes private automation maps to resolve bottlenecks and secure qualified leads.
              </p>
              
              <a
                href="/book-consultation"
                className="inline-flex items-center justify-center bg-[#C9A66B] text-[#1C1C1C] hover:bg-[#C9A66B]/90 font-heading font-medium rounded-[16px] px-8 py-4 text-[15px] tracking-wide transition-all duration-300 hover:shadow-[0_4px_20px_rgba(201,166,107,0.2)]"
              >
                Book Consultation
                <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
              </a>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}
