"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Check, ArrowRight, Info, Crown, Calendar as CalendarIcon, Clock, Sparkles, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

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
  const supabase = createClient()
  const [isRetainerClient, setIsRetainerClient] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [bookingDate, setBookingDate] = useState("")
  const [bookingTime, setBookingTime] = useState("10:00 AM")
  const [bookingSubmitted, setBookingSubmitted] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        if (profile) {
          setUserProfile(profile)
          if (profile.client_type === "retainer" || profile.role === "client") {
            setIsRetainerClient(true)
          }
        }
      }
    }
    checkAuth()
  }, [])

  const handleBookSession = (sess: any) => {
    setSelectedSession(sess)
    setBookingSubmitted(false)
  }

  const handleConfirmRetainerSlot = async () => {
    if (!bookingDate) {
      toast.error("Please select a date for your meeting")
      return
    }
    toast.success("Meeting booked successfully! Payment waived for Retainer Client.")
    setBookingSubmitted(true)
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-[#FBECE8] to-[#FFF9F6] text-[#1E1E1E] overflow-x-hidden font-sans font-light pt-32 md:pt-40 pb-24">
        <section className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-12">
          {/* Retainer Banner if client is tagged as retainer */}
          {isRetainerClient && (
            <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#1E1E1E] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-heading font-semibold text-sm text-amber-900">
                    👑 Monthly Retainer Active — VIP Session Access
                  </h3>
                  <p className="text-xs text-amber-800/80">
                    As an active monthly retainer client, all consultation payment fees are waived. Select any session below to pick your slot immediately.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-600 text-white font-semibold text-xs rounded-full shrink-0">
                Payment Waived
              </span>
            </div>
          )}

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
                      {isRetainerClient
                        ? "FREE (Retainer)"
                        : sess.priceKES === 0
                        ? "FREE"
                        : `KES ${sess.priceKES.toLocaleString()}`}
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
                  {sess.note && !isRetainerClient && (
                    <div className="mt-4 p-3 rounded-xl bg-[#C9A66B]/10 border border-[#C9A66B]/20 text-[11px] text-[#1E1E1E]/80 leading-relaxed font-light flex items-start gap-2 mb-6">
                      <Info className="h-4 w-4 text-[#C9A66B] shrink-0 mt-0.5" />
                      <span>{sess.note}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => handleBookSession(sess)}
                  className="w-full mt-4 py-3.5 px-4 rounded-[14px] font-heading font-semibold text-xs tracking-wide bg-[#C9A66B] text-white hover:bg-[#b59357] shadow-[0_4px_15px_rgba(201,166,107,0.25)] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isRetainerClient ? "Pick Time Slot (Retainer)" : sess.buttonText}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Retainer Direct Calendar Slot Picker Modal ── */}
        {selectedSession && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#FFFDFB] border border-[#C9A66B]/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
              <button
                onClick={() => setSelectedSession(null)}
                className="absolute top-4 right-4 text-gray-500 hover:text-black text-sm"
              >
                ✕
              </button>

              {!bookingSubmitted ? (
                <>
                  <div className="flex items-center gap-3 border-b pb-3">
                    <div className="w-10 h-10 rounded-full bg-[#C9A66B]/10 border border-[#C9A66B]/30 flex items-center justify-center text-[#C9A66B]">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-base text-[#1E1E1E]">
                        Select Meeting Time Slot
                      </h3>
                      <p className="text-xs text-[#1E1E1E]/60">{selectedSession.title}</p>
                    </div>
                  </div>

                  {isRetainerClient && (
                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2 font-medium">
                      <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Monthly Retainer Client — No payment prompt required!</span>
                    </div>
                  )}

                  <div className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Preferred Date</label>
                      <input
                        type="date"
                        value={bookingDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C9A66B]"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-700 font-medium mb-1">Preferred Time Slot</label>
                      <select
                        value={bookingTime}
                        onChange={(e) => setBookingTime(e.target.value)}
                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#C9A66B]"
                      >
                        <option value="09:00 AM">09:00 AM - 10:00 AM</option>
                        <option value="10:00 AM">10:00 AM - 11:00 AM</option>
                        <option value="11:30 AM">11:30 AM - 12:30 PM</option>
                        <option value="02:00 PM">02:00 PM - 03:00 PM</option>
                        <option value="04:00 PM">04:00 PM - 05:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmRetainerSlot}
                    className="w-full py-3 bg-[#C9A66B] text-white font-semibold text-xs rounded-xl hover:bg-[#b59357] shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    Confirm Booking & Lock Slot
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
                  <h3 className="font-heading font-bold text-lg text-emerald-900">
                    Meeting Confirmed!
                  </h3>
                  <p className="text-xs text-slate-600">
                    Your session for <strong className="text-slate-900">{bookingDate} @ {bookingTime}</strong> has been scheduled and added to the admin calendar.
                  </p>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}

