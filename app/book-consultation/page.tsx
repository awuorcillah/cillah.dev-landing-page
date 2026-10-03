"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Check, ArrowRight, Info } from "lucide-react"

const ADMIN_SESSIONS = [
  {
    id: "strategy-call",
    title: "1-on-1 AI Strategy & Architecture Call",
    category: "Consultations",
    badge: "Paid 1:1 Call",
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    priceKES: 5000,
    duration: "60 mins",
    description:
      "Deep-dive into your business and its operations to identify gaps that can be filled by AI automations to design a clear blueprint for your business so that whenever you are ready for this transformation you have us at the back of your mind.",
    features: [
      "60-min private 1-on-1 video call",
      "Custom AI workflow blueprint",
      "CRM & Meta/WhatsApp API mapping",
      "Post-session implementation checklist"
    ],
    buttonText: "Book 1-on-1 Strategy Call",
    isPaid: true
  },
  {
    id: "free-audit",
    title: "Free Automation Audit",
    category: "Consultations",
    badge: "Free 1:1 Call",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    priceKES: 0,
    duration: "15 mins",
    description:
      "Complimentary 15-min discovery call to audit lead handling & identify instant automation opportunities.",
    features: [
      "15-min discovery audit call",
      "Current sales pipeline review",
      "Lead leakage & delay report",
      "No-obligation recommendations"
    ],
    note: "Book a free audit where you will answer a few questions to submit your request for review, and our team will get back to you with an available time slot. If you value full control over your time, select the paid 1:1 call to choose your preferred time instantly.",
    buttonText: "Book Free Audit",
    isPaid: false
  },
  {
    id: "ai-webinar",
    title: "Upcoming AI Automation Webinar",
    category: "Webinars",
    badge: "Group Webinar",
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    priceKES: 2500,
    duration: "90 mins",
    description:
      "Interactive 90-min group webinar covering AI tools, live CRM routing, and real-world case studies.",
    features: [
      "90-min live webinar & Q&A",
      "Live AI agent demonstration",
      "Access to recording & templates",
      "Exclusive attendee resource kit"
    ],
    buttonText: "Register for Webinar",
    isPaid: true
  }
]

export default function BookConsultationPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-[#FBECE8] to-[#FFF9F6] text-[#1E1E1E] overflow-x-hidden font-sans font-light pt-32 md:pt-40 pb-24">
        <section className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h1 className="font-heading font-light text-[32px] sm:text-[42px] text-[#1E1E1E] leading-tight mb-3">
              Book a Consultation
            </h1>
            <p className="text-sm sm:text-base text-[#1E1E1E]/65 font-light">
              Choose from the available sessions below.
            </p>
          </div>

          {/* Session Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
            {ADMIN_SESSIONS.map((sess) => (
              <div
                key={sess.id}
                className="rounded-[22px] p-6 bg-[#FFFDFB] border border-[#C9A66B]/20 hover:border-[#C9A66B]/50 shadow-[0_4px_20px_rgba(201,166,107,0.06)] hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  {/* Header Badge & Price */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full border ${sess.badgeColor}`}>
                      {sess.badge}
                    </span>
                    <span className="font-heading font-bold text-base text-[#1E1E1E]">
                      {sess.priceKES === 0 ? "FREE" : `KES ${sess.priceKES.toLocaleString()}`}
                    </span>
                  </div>

                  <h3 className="font-heading font-medium text-[18px] text-[#1E1E1E] mb-2 leading-snug">
                    {sess.title}
                  </h3>

                  <p className="text-xs text-[#1E1E1E]/70 mb-5 leading-relaxed font-light">
                    {sess.description}
                  </p>

                  {/* Features list */}
                  <ul className="space-y-2 mb-4 pt-4 border-t border-black/5">
                    {sess.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#1E1E1E]/80 font-light">
                        <Check className="h-3.5 w-3.5 text-[#C9A66B] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Note for Free Audit if present */}
                  {sess.note && (
                    <div className="mt-4 p-3 rounded-xl bg-[#C9A66B]/10 border border-[#C9A66B]/20 text-[11px] text-[#1E1E1E]/80 leading-relaxed font-light flex items-start gap-2 mb-6">
                      <Info className="h-4 w-4 text-[#C9A66B] shrink-0 mt-0.5" />
                      <span>{sess.note}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  className="w-full mt-4 py-3.5 px-4 rounded-[14px] font-heading font-semibold text-xs tracking-wide bg-[#C9A66B] text-white hover:bg-[#b59357] shadow-[0_4px_15px_rgba(201,166,107,0.25)] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {sess.buttonText}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

