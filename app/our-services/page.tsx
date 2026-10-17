"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { 
  Check, 
  Sparkles, 
  Globe, 
  Bot, 
  Workflow, 
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Smartphone,
  CreditCard,
  BellRing
} from "lucide-react"

export default function ServicesPage() {
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
        <section className="relative pt-36 pb-16 md:pt-44 md:pb-20 border-b border-white/5">
          <div className="container mx-auto max-w-5xl px-6 md:px-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="max-w-3xl mx-auto space-y-4"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-[#C9A66B]/30 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-[#C9A66B]" />
                <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#C9A66B]">
                  Built for Real Business Outcomes
                </span>
              </div>

              <h1 className="font-heading font-light text-[32px] sm:text-[44px] md:text-[52px] leading-[1.15] text-[#F9F7F6] text-balance">
                Everything your business needs to <br className="hidden sm:inline" />
                <span className="text-[#C9A66B] font-normal italic">attract clients, close sales</span>, and run automatically.
              </h1>

              <p className="text-[15px] sm:text-[17px] leading-relaxed text-[#F9F7F6]/70 max-w-2xl mx-auto font-light pt-2">
                We build the central digital headquarters and 24/7 AI systems that turn customer inquiries into revenue while saving your team hundreds of manual hours.
              </p>
            </motion.div>
          </div>
        </section>

        {/* THE 3 CORE PILLARS */}
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

        {/* BOTTOM EXECUTIVE CTA */}
        <section className="py-16 md:py-24 border-t border-white/5">
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
                <span>Book a 1-on-1 Strategy Call (KES 5,000 / $40 USD)</span>
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
