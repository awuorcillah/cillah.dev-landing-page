import fs from "fs"
import path from "path"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ArrowRight, Sparkles } from "lucide-react"

interface UseCaseData {
  title: string
  slug: string
  teaser: string
  featuredImage?: string
  publishedAt?: string
  featured?: boolean
  content: string
}

function getUseCases(): UseCaseData[] {
  const dir = path.join(process.cwd(), "content/use-cases")
  if (!fs.existsSync(dir)) return []
  const files = fs.readdirSync(dir)
  
  return files
    .filter(file => file.endsWith(".md"))
    .map(file => {
      const fullPath = path.join(dir, file)
      const rawContent = fs.readFileSync(fullPath, "utf-8")
      
      const parts = rawContent.split("---")
      let data: any = { content: "" }
      
      if (parts.length >= 3) {
        const frontmatter = parts[1]
        data.content = parts.slice(2).join("---").trim()
        
        const lines = frontmatter.split("\n")
        lines.forEach(line => {
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
      
      return data as UseCaseData
    })
    .sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
      const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
      return dateB - dateA
    })
}

export default function UseCasesPage() {
  const useCases = getUseCases()

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#F4E7E7] text-[#1C1C1C] font-sans font-light pt-32 md:pt-40 pb-24">
        
        {/* HEADER SECTION */}
        <section className="container mx-auto max-w-7xl px-6 md:px-12 text-center mb-20">
          <div className="max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1C1C1C]/5 border border-[#1C1C1C]/10 mb-6">
              <Sparkles className="h-4 w-4 text-[#C9A66B]" />
              <span className="text-[12px] font-medium tracking-[0.2em] uppercase text-[#1C1C1C]/80">
                Editorial Feed
              </span>
            </div>
            <h1 className="font-heading font-light text-[36px] md:text-[52px] leading-tight text-[#1C1C1C] mb-6">
              Real stories from agencies scaling with automation
            </h1>
            <p className="text-[16px] md:text-[18px] leading-relaxed text-[#1C1C1C]/75 max-w-2xl mx-auto font-light">
              Explore how real estate agencies are solving operational bottlenecks, improving response times, and converting more inquiries into booked viewings.
            </p>
          </div>
        </section>

        {/* VERTICAL EDITORIAL FEED */}
        <section className="container mx-auto max-w-4xl px-6">
          <div className="space-y-10">
            {useCases.map((item) => (
              <div 
                key={item.slug}
                className="p-8 rounded-[16px] bg-[#1C1C1C] border border-[#F4E7E7]/10 flex flex-col justify-between hover:shadow-[0_4px_30px_rgba(28,28,28,0.05)] transition-all duration-300"
              >
                <div>
                  {/* Badge */}
                  <div className="flex items-center gap-2 mb-6">
                    <span className="text-[10px] font-heading font-medium uppercase tracking-wider text-[#C9A66B] bg-[#C9A66B]/5 border border-[#C9A66B]/20 px-2.5 py-1 rounded-md">
                      {item.featured ? "Featured Case Study" : "Case Study"}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-heading font-medium text-[22px] md:text-[24px] leading-snug text-[#F9F7F6] mb-4">
                    {item.title}
                  </h3>

                  {/* 2-line teaser description */}
                  <p 
                    className="text-[16px] leading-relaxed text-[#F9F7F6]/70 font-sans font-light mb-8"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: '2',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {item.teaser}
                  </p>
                </div>

                {/* Read More button */}
                <div className="pt-6 border-t border-[#F4E7E7]/5 flex items-center justify-start">
                  <Link 
                    href={`/use-cases/${item.slug}`}
                    className="inline-flex items-center justify-center bg-transparent text-[#C9A66B] hover:text-[#1C1C1C] border border-[#C9A66B]/30 hover:bg-[#C9A66B] hover:border-[#C9A66B] font-heading font-medium rounded-[16px] px-6 py-3 text-[14px] tracking-wide transition-all duration-300"
                  >
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
                  </Link>
                </div>
              </div>
            ))}

            {useCases.length === 0 && (
              <p className="text-center text-[#1C1C1C]/40 py-12">
                No use cases published yet. Publish via TinaCMS to see them here.
              </p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
