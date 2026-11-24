"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { CONSULTATION_PRICE_DISPLAY } from "@/lib/consultation-price"
import { 
  Check, 
  Sparkles, 
  Globe, 
  Bot, 
  Workflow, 
  ArrowRight,
  Send,
  HelpCircle,
  ChevronDown,
  Layers
} from "lucide-react"
import { FAQS_BY_SERVICE } from "@/lib/faqs-data"

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [openFaq, setOpenFaq] = useState<string | null>("web-1")
  const [heroSceneIdx, setHeroSceneIdx] = useState<number>(0)
  const [extraScenesReady, setExtraScenesReady] = useState<boolean>(false)

  useEffect(() => {
    const t = window.setTimeout(() => setExtraScenesReady(true), 350)
    return () => window.clearTimeout(t)
  }, [])

  const heroScenes = [
    {
      src: "/images/services-nairobi-1.jpg",
      alt: "Kenyan software architect designing business systems in a modern Nairobi studio",
      objectPosition: "object-[72%_25%]",
      durationMs: 4500,
      fromScale: 1.0,
      toScale: 1.07,
    },
    {
      src: "/images/services-nairobi-2.jpg",
      alt: "Modern Nairobi sales and marketing team collaborating around a unified live dashboard",
      objectPosition: "object-[52%_25%]",
      durationMs: 4500,
      fromScale: 1.06,
      toScale: 1.0,
    },
    {
      src: "/images/services-nairobi-3.jpg",
      alt: "Business founder overlooking Nairobi skyline at dusk while automated systems work after hours",
      objectPosition: "object-[70%_20%]",
      durationMs: 5500,
      fromScale: 1.0,
      toScale: 1.06,
    },
  ]

  useEffect(() => {
    const timer = setTimeout(() => {
      setHeroSceneIdx((prev) => (prev + 1) % heroScenes.length)
    }, heroScenes[heroSceneIdx].durationMs)
    return () => clearTimeout(timer)
  }, [heroSceneIdx])

  const countByCategory = (cat: string) =>
    FAQS_BY_SERVICE.filter((item) => item.category === cat).length

  const categories = [
    { id: "all", label: `All Questions (${FAQS_BY_SERVICE.length})` },
    { id: "web-apps", label: `Web & Backend (${countByCategory("web-apps")})` },
    { id: "ai-agents", label: `AI Inbox Automation (${countByCategory("ai-agents")})` },
    { id: "automation", label: `AI Workflow Automation (${countByCategory("automation")})` },
    { id: "outreach", label: `B2B Cold Email Outreach (${countByCategory("outreach")})` },
  ]

  const filteredFaqs = activeCategory === "all" 
    ? FAQS_BY_SERVICE 
    : FAQS_BY_SERVICE.filter(item => item.category === activeCategory)

  const pillars = [
    {
      badge: "Your Digital Headquarters",
      title: "Custom Websites & Web Applications",
      tagline: "One single source of truth: A luxury front-end that builds trust with your customers, and a private back-end where your team runs operations without chaos.",
      description: "Most business websites are just static brochures that sit idle. We build custom web applications that act as your company's central command center. Your clients get an ultra-fast, modern experience to explore properties, services, and inventory on their phones. Meanwhile, you and your staff get a secure private back-end to manage listings, track leads, and see business happen in real time.",
      icon: <Globe className="h-6 w-6 text-[#C9A66B]" />,
      benefits: [
        {
          title: "Builds Instant Credibility",
          desc: "A sleek, lightning-fast design that sets you miles apart from competitors using outdated templates."
        },
        {
          title: "Private Team Back-End",
          desc: "Your staff logs into a secure dashboard to manage property listings, customer records, and orders without messy spreadsheets."
        },
        {
          title: "Direct Client Payments",
          desc: "Customers pay deposits or consultation fees directly on your site via M-Pesa, credit card, or crypto."
        },
        {
          title: "Built Mobile-First",
          desc: "Over 80% of your buyers browse from their phones. Every page loads instantly with zero lag or clutter."
        }
      ]
    },
    {
      badge: "Your 24/7 Sales & Support Team",
      title: "Autonomous AI Agents in Your Inboxes",
      tagline: "Trained AI agents that live inside your WhatsApp, Instagram, Facebook, and website inboxes to talk to customers, answer questions, and close sales around the clock.",
      description: "When an interested buyer messages your business at night or over the weekend, they shouldn't have to wait hours for a reply while they look at competitors. We train AI agents specifically on your business, inventory, and pricing. The AI chats naturally with customers, checks what is currently available in your system, qualifies serious buyers, collects payments, and alerts you the second a sale or booking happens.",
      icon: <Bot className="h-6 w-6 text-[#C9A66B]" />,
      benefits: [
        {
          title: "Answers in Under 30 Seconds",
          desc: "Instant, friendly responses on WhatsApp, Instagram DMs, Facebook Messenger, and website live chat."
        },
        {
          title: "Sells From Live Inventory",
          desc: "The AI checks your real-time database, recommends matching properties or items, and shares photos and prices."
        },
        {
          title: "Filters Serious Buyers",
          desc: "Automatically asks about budget, location, and timeline so your team only spends time closing high-value leads."
        },
        {
          title: "Closes Deals & Notifies You",
          desc: "Sends payment prompts and immediately pings your personal phone with a summary of the new client."
        }
      ]
    },
    {
      badge: "The Connective Engine",
      title: "Marketing-to-Operations Automation",
      tagline: "Every marketing channel feeding automatically into your back-end without manual copy-pasting, forgotten follow-ups, or lost leads.",
      description: "Growing a business shouldn't mean manually copying phone numbers from Instagram into an Excel sheet or wondering who is following up with yesterday's inquiries. We connect all your marketing channels directly into your central business engine. When a customer interacts with an ad, a DM, or a form, they are instantly organized, assigned to the right team member, and scheduled on your calendar.",
      icon: <Workflow className="h-6 w-6 text-[#C9A66B]" />,
      benefits: [
        {
          title: "Hands-Free Lead Capture",
          desc: "Leads from Instagram Ads, Facebook Forms, TikTok, and your website stream straight into your database."
        },
        {
          title: "Smart Sales Routing",
          desc: "Automatically sends qualified buyers to the right sales agent based on availability, territory, or specialty."
        },
        {
          title: "Automated Calendar & Reminders",
          desc: "Locks appointments on Google Calendar and sends WhatsApp and email reminders so clients never miss a meeting."
        },
        {
          title: "Wakes Up Old Leads",
          desc: "Automatically sends personalized updates to past inquiries whenever you release new listings or special offers."
        }
      ]
    },
    {
      badge: "Predictable B2B Client Acquisition",
      title: "Direct-to-Decision-Maker Cold Email Outreach",
      tagline: "Fill your pipeline with pre-qualified meetings with CEOs, founders, and department heads ready to buy — without your team spending a single hour prospecting.",
      description: "If your highest-value clients are on LinkedIn and corporate networks, waiting for them to stumble upon your website is costing you revenue. We identify verified decision-makers (CEOs, COOs, Heads of Marketing, and Operations) who match your exact target profile, reach their direct corporate inboxes with tailored value propositions, and book qualified conversations straight onto your calendar. Your sales team only focuses on one thing: closing deals.",
      icon: <Send className="h-6 w-6 text-[#C9A66B]" />,
      benefits: [
        {
          title: "Guaranteed C-Suite Access",
          desc: "Bypass gatekeepers and land straight in the private inboxes of verified CEOs, Managing Directors, and budget holders who have the authority to make purchasing decisions."
        },
        {
          title: "Predictable Calendar Pipeline",
          desc: "Transform irregular referrals and unpredictable word-of-mouth into a reliable, measurable monthly volume of sales conversations."
        },
        {
          title: "100% Domain & Reputation Protection",
          desc: "We configure isolated outreach infrastructure with enterprise authentication (SPF, DKIM, DMARC) so your primary company domain is never exposed to spam filters or delivery risks."
        },
        {
          title: "Zero Manual Prospecting for Your Team",
          desc: "Eliminate the 20+ hours your staff wastes each week manually browsing LinkedIn and copying data into spreadsheets. Your reps only show up to pre-warmed, scheduled meetings."
        }
      ]
    }
  ]

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#07070B] text-[#F9F7F6] overflow-x-hidden font-sans font-light relative pb-20 selection:bg-[#C9A66B]/30">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full bg-[#C9A66B]/5 blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] rounded-full bg-[#C9A66B]/3 blur-[160px] pointer-events-none -z-10" />

        {/* HERO HEADER */}
        <section className="relative min-h-[72vh] md:min-h-[80vh] pt-36 pb-20 md:pt-44 md:pb-24 flex flex-col items-center justify-center border-b border-white/5 overflow-hidden">
          {/* 3-Scene Cinematic Nairobi Systems Background Reel */}
          <div className="absolute inset-0 z-0 pointer-events-none select-none overflow-hidden" aria-hidden="true">
            {heroScenes.map((scene, idx) => {
              if (idx > 0 && !extraScenesReady) return null
              const isActive = idx === heroSceneIdx
              return (
                <motion.div
                  key={scene.src}
                  initial={false}
                  animate={{
                    opacity: isActive ? 1 : 0,
                    scale: isActive ? scene.toScale : scene.fromScale,
                  }}
                  transition={{
                    opacity: { duration: 1.1, ease: "easeInOut" },
                    scale: { duration: scene.durationMs / 1000 + 1.1, ease: "easeOut" },
                  }}
                  className="absolute inset-0 will-change-transform"
                >
                  <Image
                    src={scene.src}
                    alt={scene.alt}
                    fill
                    priority={idx === 0}
                    fetchPriority={idx === 0 ? "high" : "low"}
                    quality={75}
                    sizes="100vw"
                    className={`object-cover ${scene.objectPosition}`}
                  />
                </motion.div>
              )
            })}

            {/* Luxury Dark Editorial Overlays for Crisp Readability */}
            <div className="absolute inset-0 bg-[#07070B]/52" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#07070B]/80 via-[#07070B]/35 to-[#07070B]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(7,7,11,0.60)_0%,rgba(7,7,11,0.22)_65%,rgba(7,7,11,0.75)_100%)]" />
          </div>

          <div className="container mx-auto max-w-5xl px-6 md:px-12 relative z-10 text-center flex flex-col items-center">
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#07070B]/60 border border-[#C9A66B]/40 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-[#C9A66B]" />
                <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A66B]">
                  Building Software Systems for Business
                </span>
              </div>

              <h1 className="font-heading font-light text-[32px] sm:text-[44px] md:text-[52px] leading-[1.15] text-[#F9F7F6] text-balance drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
                Everything your business needs to <br className="hidden sm:inline" />
                <span className="text-[#C9A66B] font-normal italic">capture leads, qualify buyers, close deals,</span> and run automatically.
              </h1>

              <p className="text-[15px] sm:text-[17px] leading-relaxed text-[#F9F7F6]/88 max-w-2xl mx-auto font-light pt-2 drop-shadow-[0_2px_14px_rgba(0,0,0,0.85)]">
                We build the central digital headquarters, 24/7 AI systems, and outbound client acquisition engines that turn customer interest into revenue while saving your team hundreds of manual hours.
              </p>
            </div>

            {/* Subtle Story Scene Indicators */}
            <div className="mt-10 flex items-center gap-2.5" aria-label="Services hero scenes">
              {heroScenes.map((scene, idx) => (
                <button
                  key={scene.src}
                  type="button"
                  onClick={() => setHeroSceneIdx(idx)}
                  aria-label={`View scene ${idx + 1}`}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    idx === heroSceneIdx
                      ? "w-10 bg-[#C9A66B]"
                      : "w-4 bg-white/30 hover:bg-white/55"
                  }`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* THE 4 CORE PILLARS */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto max-w-6xl px-6 md:px-12 space-y-20">
            {pillars.map((pillar, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="rounded-[28px] bg-[#0D0F18]/80 border border-white/10 backdrop-blur-xl p-8 sm:p-12 shadow-2xl relative overflow-hidden group hover:border-[#C9A66B]/40 transition-all duration-500"
              >
                {/* Subtle top indicator line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9A66B]/40 to-transparent" />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                  
                  {/* Left Column: Pillar Summary */}
                  <div className="lg:col-span-5 space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-white/[0.04] border border-[#C9A66B]/30 shadow-inner">
                        {pillar.icon}
                      </div>
                      <span className="text-[11px] font-heading font-semibold uppercase tracking-widest text-[#C9A66B]">
                        {pillar.badge}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-heading font-normal text-white leading-tight">
                      {pillar.title}
                    </h2>

                    <p className="text-sm sm:text-[15px] text-[#C9A66B] font-medium leading-relaxed">
                      {pillar.tagline}
                    </p>

                    <p className="text-xs sm:text-sm text-white/65 leading-relaxed font-light">
                      {pillar.description}
                    </p>

                    <div className="pt-2">
                      <a
                        href="/book-consultation"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-[#C9A66B]/40 text-[#C9A66B] hover:bg-[#C9A66B] hover:text-[#07070B] text-xs font-semibold tracking-wide transition-all duration-300"
                      >
                        <span>Discuss This for Your Business</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* Right Column: 4 Plain-English Outcomes */}
                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {pillar.benefits.map((b, i) => (
                      <div
                        key={i}
                        className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all duration-300 flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3" />
                            </div>
                            <h3 className="text-sm font-heading font-medium text-white">
                              {b.title}
                            </h3>
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed font-light pt-1">
                            {b.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 20 DETAILED FAQS TAGGED BY SERVICE (AEO & LLM CITED) */}
        <section id="services-faq" className="py-24 border-t border-b border-white/5 bg-[#090A10] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#C9A66B]/5 blur-[160px] pointer-events-none rounded-full" />

          <div className="container mx-auto max-w-5xl px-6 md:px-12 relative z-10">
            {/* Header */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-xs font-heading font-medium tracking-widest uppercase text-[#C9A66B] mb-4">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Service Knowledge Base &bull; 20 Direct Answers</span>
              </div>
              <h2 className="font-heading font-light text-[30px] sm:text-[38px] md:text-[44px] text-[#F9F7F6] leading-tight mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-[15px] sm:text-[17px] text-[#F9F7F6]/60 font-light max-w-2xl mx-auto">
                Detailed, transparent answers for decision-makers evaluating our 4 core services. Tagged by service for instant clarity.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-medium tracking-wide transition-all cursor-pointer ${
                    activeCategory === cat.id
                      ? "bg-[#C9A66B] text-[#07070B] font-semibold shadow-[0_0_15px_rgba(201,166,107,0.3)]"
                      : "bg-white/5 text-[#F9F7F6]/70 hover:bg-white/10 hover:text-[#F9F7F6] border border-white/5"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Accordion List */}
            <div className="space-y-4">
              {filteredFaqs.map((faq) => {
                const isOpen = openFaq === faq.id
                return (
                  <div
                    key={faq.id}
                    className={`rounded-[20px] border transition-all duration-300 overflow-hidden ${
                      isOpen
                        ? "bg-white/[0.04] border-[#C9A66B]/40 shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
                        : "bg-white/[0.015] border-white/10 hover:border-white/20 hover:bg-white/[0.03]"
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : faq.id)}
                      className="w-full p-6 text-left flex items-start justify-between gap-4 cursor-pointer focus:outline-none"
                      aria-expanded={isOpen}
                    >
                      <div className="space-y-2 pr-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C9A66B]/10 border border-[#C9A66B]/25 text-[10px] font-mono tracking-wider uppercase text-[#C9A66B]">
                          <span>{faq.serviceTag}</span>
                        </div>
                        <h3 className="font-heading font-medium text-[16px] sm:text-[18px] text-[#F9F7F6] leading-snug">
                          {faq.question}
                        </h3>
                      </div>
                      <div
                        className={`h-8 w-8 rounded-full border border-white/10 flex items-center justify-center shrink-0 mt-1 transition-transform duration-300 ${
                          isOpen ? "rotate-180 bg-[#C9A66B]/15 border-[#C9A66B]/50" : "bg-white/5"
                        }`}
                      >
                        <ChevronDown className={`w-4 h-4 ${isOpen ? "text-[#C9A66B]" : "text-[#F9F7F6]/60"}`} />
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: "easeInOut" }}
                        >
                          <div className="px-6 pb-6 pt-2 text-[14px] sm:text-[15px] leading-relaxed text-[#F9F7F6]/75 font-light border-t border-white/5 space-y-3">
                            <p className="text-[#F9F7F6]/90 font-normal">
                              {faq.shortAnswer}
                            </p>
                            <p className="text-[13px] sm:text-[14px] text-[#C9A66B]/90 font-light pl-3 border-l-2 border-[#C9A66B]/40">
                              <span className="font-medium text-[#C9A66B]">The Value to Your Business: </span>
                              {faq.valueAnswer}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>

            {/* Schema.org FAQPage for Answer Engine Optimization (AEO) */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": FAQS_BY_SERVICE.map((faq) => ({
                    "@type": "Question",
                    "name": faq.question,
                    "acceptedAnswer": {
                      "@type": "Answer",
                      "text": `${faq.shortAnswer} The Value to Your Business: ${faq.valueAnswer}`
                    }
                  }))
                })
              }}
            />
          </div>
        </section>

        {/* BOTTOM EXECUTIVE CTA */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto max-w-4xl px-6 text-center space-y-6">
            <h2 className="text-2xl sm:text-4xl font-heading font-light text-white leading-tight">
              Ready to give your business an <br className="hidden sm:inline" />
              <span className="text-[#C9A66B] font-normal italic">unfair advantage</span>?
            </h2>

            <p className="text-sm sm:text-base text-white/65 max-w-xl mx-auto font-light leading-relaxed">
              Book a private 1-on-1 Strategy & Architecture Call. We will analyze your current lead flow, map out your automated digital headquarters, and show you exactly how to scale without adding manual workload.
            </p>

            <div className="pt-2">
              <a
                href="/book-consultation"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-[#C9A66B] text-[#07070B] font-heading font-semibold text-sm tracking-wide hover:bg-[#b59357] transition-all shadow-[0_0_25px_rgba(201,166,107,0.3)] hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Book a 1-on-1 Strategy Call ({CONSULTATION_PRICE_DISPLAY})</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

