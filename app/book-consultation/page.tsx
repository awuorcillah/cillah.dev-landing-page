"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Check, ArrowRight, Info, Crown, Calendar as CalendarIcon, Clock, Sparkles, CheckCircle2, ShieldCheck, Loader2, Phone, Mail, User, Building, Globe, HelpCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface SessionType {
  id: string
  title: string
  description: string
  session_format: string
  price_kes: number
  duration_minutes: number
  is_active: boolean
}

const DEFAULT_SESSIONS = [
  {
    id: "free-audit",
    title: "Free Automation Audit",
    category: "Consultations",
    badge: "Free 1:1 Call",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    priceKES: 0,
    duration: "30 mins",
    description: "Complimentary 30-min discovery call to audit your current operations, identify manual bottlenecks, and explore AI automation opportunities.",
    features: [
      "30-min discovery audit call",
      "Current sales pipeline & lead delay review",
      "Lead leakage identification report",
      "No-obligation automation recommendations"
    ],
    note: "Book a free audit by filling in your request details. Our team will review your application and confirm your available time slot.",
    buttonText: "Book Free Audit",
    isPaid: false
  },
  {
    id: "strategy-call",
    title: "1-on-1 AI Strategy & Architecture Call",
    category: "Consultations",
    badge: "Paid 1:1 Call",
    badgeColor: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    priceKES: 5000,
    duration: "60 mins",
    description: "Deep-dive 60-minute consultation into your business operations to design custom AI agents, CRM routing, and automated workflows tailored to your agency.",
    features: [
      "60-min private 1-on-1 video call",
      "Custom AI workflow & architecture blueprint",
      "CRM & Meta/WhatsApp API mapping",
      "Post-session implementation action checklist"
    ],
    buttonText: "Book 1-on-1 Strategy Call",
    isPaid: true
  }
]

export default function BookConsultationPage() {
  const supabase = createClient()
  const [isRetainerClient, setIsRetainerClient] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  const [sessions, setSessions] = useState<any[]>(DEFAULT_SESSIONS)
  const [loadingSessions, setLoadingSessions] = useState(true)

  // Booking Modal State
  const [selectedSession, setSelectedSession] = useState<any>(null)
  const [bookingSubmitted, setBookingSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Form Fields
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [reason, setReason] = useState("")
  const [hasBusiness, setHasBusiness] = useState<"yes" | "no">("yes")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [bookingDate, setBookingDate] = useState("")
  const [bookingTime, setBookingTime] = useState("10:00 AM")

  // Fetch auth & dynamic session types from Supabase
  useEffect(() => {
    async function init() {
      // 1. Auth check
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        if (profile) {
          setUserProfile(profile)
          setFullName(profile.full_name || "")
          setEmail(profile.email || "")
          setPhone(profile.phone || "")
          if (profile.client_type === "retainer" || profile.role === "client") {
            setIsRetainerClient(true)
          }
        }
      }

      // 2. Fetch live session types from DB
      try {
        const { data: dbSessions } = await supabase
          .from("session_types")
          .select("*")
          .eq("is_active", true)

        if (dbSessions && dbSessions.length > 0) {
          const formatted = dbSessions.map((s: SessionType) => {
            const isPaid = s.session_format === "consultation_paid" || s.price_kes > 0
            const isFree = s.session_format === "consultation_free" || s.price_kes === 0

            return {
              id: s.id,
              title: s.title,
              category: s.session_format === "webinar" ? "Webinars" : "Consultations",
              badge: isFree ? "Free 1:1 Call" : s.session_format === "webinar" ? "Group Webinar" : "Paid 1:1 Call",
              badgeColor: isFree ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : s.session_format === "webinar" ? "bg-purple-500/10 text-purple-600 border-purple-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20",
              priceKES: isPaid ? (s.price_kes || Number(process.env.NEXT_PUBLIC_CONSULTATION_AMOUNT) || 5000) : 0,
              duration: `${s.duration_minutes || 60} mins`,
              description: s.description,
              features: isFree ? [
                "Discovery audit call",
                "Current sales pipeline review",
                "Lead leakage & delay report",
                "No-obligation recommendations"
              ] : [
                "60-min private 1-on-1 video call",
                "Custom AI workflow blueprint",
                "CRM & Meta/WhatsApp API mapping",
                "Post-session implementation checklist"
              ],
              buttonText: isFree ? "Book Free Audit" : "Book 1-on-1 Strategy Call",
              isPaid
            }
          })
          setSessions(formatted)
        }
      } catch (err) {
        console.error("Error fetching session types:", err)
      } finally {
        setLoadingSessions(false)
      }
    }

    init()
  }, [])

  const handleOpenBooking = (sess: any) => {
    setSelectedSession(sess)
    setBookingSubmitted(false)
    if (!bookingDate) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      setBookingDate(tomorrow.toISOString().split("T")[0])
    }
  }

  const handleBusinessToggle = (val: "yes" | "no") => {
    setHasBusiness(val)
    if (val === "no") {
      setWebsiteUrl("N/A")
    } else if (websiteUrl === "N/A") {
      setWebsiteUrl("")
    }
  }

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!fullName.trim()) { toast.error("Please enter your full name"); return }
    if (!email.trim()) { toast.error("Please enter your email address"); return }
    if (!phone.trim()) { toast.error("Please enter your phone number"); return }
    if (!reason.trim()) { toast.error("Please describe your reason for this consultation"); return }
    if (hasBusiness === "yes" && !websiteUrl.trim()) {
      toast.error("Please provide your business website link (or select No)")
      return
    }

    setSubmitting(true)

    try {
      // Create scheduledAt timestamp
      const datePart = bookingDate || new Date().toISOString().split("T")[0]
      const scheduledAt = new Date(`${datePart}T10:00:00`).toISOString()

      const isPaid = selectedSession.isPaid && !isRetainerClient

      // 1. Submit booking & promote to client if paid!
      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          sessionTypeId: selectedSession.id,
          sessionTitle: selectedSession.title,
          reason,
          hasBusiness,
          websiteUrl: hasBusiness === "yes" ? websiteUrl : "N/A",
          scheduledAt,
          isPaid,
          amount: selectedSession.priceKES
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to submit booking")

      // 2. If Paid and M-Pesa phone provided, trigger STK Push
      if (isPaid && phone) {
        toast.info("Sending M-Pesa STK Push prompt to your phone...")
        try {
          await fetch("/api/consultation/payment-stkpush", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              recordId: data.booking?.id || "direct-booking",
              email,
              phone
            })
          })
        } catch (stkErr) {
          console.warn("STK push warning:", stkErr)
        }
      }

      setBookingSubmitted(true)
      toast.success(
        isPaid
          ? "Booking confirmed & client account activated!"
          : "Free Audit request submitted successfully!"
      )
    } catch (err: any) {
      console.error("Booking submit error:", err)
      toast.error(err.message || "Something went wrong creating your booking")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-[#FBECE8] to-[#FFF9F6] text-[#1E1E1E] overflow-x-hidden font-sans font-light pt-32 md:pt-40 pb-24">
        <section className="container mx-auto max-w-5xl px-4 sm:px-6 md:px-12">

          {/* Retainer Banner */}
          {isRetainerClient && (
            <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#1E1E1E] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-heading font-semibold text-sm text-amber-900">
                    👑 Monthly Retainer Active — VIP Session Access
                  </h3>
                  <p className="text-xs text-amber-800/80">
                    As an active monthly retainer client, all consultation fees are waived. Select any session to pick your preferred slot instantly.
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
              Select your consultation category below. Free Audits require answering a brief questionnaire, while 1-on-1 Paid Strategy Calls unlock instant time slot reservation and priority onboarding.
            </p>
          </div>

          {/* Session Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
            {sessions.map((sess) => (
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
                    {sess.features.map((feat: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[#1E1E1E]/80 font-light">
                        <Check className="h-3.5 w-3.5 text-[#C9A66B] shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Note for Free Audit */}
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
                  onClick={() => handleOpenBooking(sess)}
                  className="w-full mt-4 py-3.5 px-4 rounded-[14px] font-heading font-semibold text-xs tracking-wide bg-[#C9A66B] text-white hover:bg-[#b59357] shadow-[0_4px_15px_rgba(201,166,107,0.25)] transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {isRetainerClient ? "Pick Time Slot (Retainer)" : sess.buttonText}
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ── Interactive Consultation Booking Modal ── */}
        {selectedSession && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#FFFDFB] border border-[#C9A66B]/30 rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative my-8">
              <button
                onClick={() => setSelectedSession(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold transition-colors"
              >
                ✕
              </button>

              {!bookingSubmitted ? (
                <form onSubmit={handleSubmitBooking} className="space-y-5">
                  <div className="flex items-center gap-3 border-b border-black/10 pb-4">
                    <div className="w-10 h-10 rounded-full bg-[#C9A66B]/15 border border-[#C9A66B]/30 flex items-center justify-center text-[#C9A66B] shrink-0">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-base text-[#1E1E1E]">
                        {selectedSession.isPaid ? "1-on-1 Strategy Call Booking" : "Free Automation Audit Request"}
                      </h3>
                      <p className="text-xs text-[#1E1E1E]/60">{selectedSession.title}</p>
                    </div>
                  </div>

                  {/* Pricing banner for paid call */}
                  {selectedSession.isPaid && !isRetainerClient && (
                    <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-amber-900 font-semibold block">Consultation Amount</span>
                        <span className="text-amber-800 text-[11px]">Dynamic rate configured in admin</span>
                      </div>
                      <span className="font-heading font-bold text-base text-amber-900 font-mono">
                        KES {selectedSession.priceKES.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Form fields */}
                  <div className="space-y-4 text-xs">
                    {/* Full Name */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#C9A66B]" /> Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Cheryl Atulah"
                        className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A66B] transition-colors"
                      />
                    </div>

                    {/* Email & Phone in row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#C9A66B]" /> Gmail / Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="client@gmail.com"
                          className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A66B] transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-medium mb-1 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-[#C9A66B]" /> M-Pesa Phone *
                        </label>
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="0712345678"
                          className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A66B] transition-colors"
                        />
                      </div>
                    </div>

                    {/* Reason for consultation */}
                    <div>
                      <label className="block text-slate-700 font-medium mb-1 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-[#C9A66B]" /> Reason for this Consultation *
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Describe your current business bottlenecks, lead handling delays, or what you hope to achieve with AI automations..."
                        className="w-full bg-white border border-gray-300 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C9A66B] transition-colors resize-none"
                      />
                    </div>

                    {/* Do you have a business? */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <label className="block text-slate-700 font-medium flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#C9A66B]" /> Do you currently have a business? *
                      </label>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                          <input
                            type="radio"
                            name="hasBusiness"
                            value="yes"
                            checked={hasBusiness === "yes"}
                            onChange={() => handleBusinessToggle("yes")}
                            className="accent-[#C9A66B]"
                          />
                          Yes
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                          <input
                            type="radio"
                            name="hasBusiness"
                            value="no"
                            checked={hasBusiness === "no"}
                            onChange={() => handleBusinessToggle("no")}
                            className="accent-[#C9A66B]"
                          />
                          No (Sets website to N/A)
                        </label>
                      </div>

                      {hasBusiness === "yes" && (
                        <div className="pt-2">
                          <label className="block text-slate-600 text-[11px] mb-1 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-[#C9A66B]" /> Business Website Link *
                          </label>
                          <input
                            type="url"
                            required={hasBusiness === "yes"}
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="https://mybusiness.com"
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#C9A66B]"
                          />
                        </div>
                      )}
                    </div>

                    {/* Preferred Date & Time Slot */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">Preferred Date</label>
                        <input
                          type="date"
                          value={bookingDate}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C9A66B]"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 font-medium mb-1">Time Slot</label>
                        <select
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C9A66B]"
                        >
                          <option value="09:00 AM">09:00 AM - 10:00 AM EAT</option>
                          <option value="10:00 AM">10:00 AM - 11:00 AM EAT</option>
                          <option value="11:30 AM">11:30 AM - 12:30 PM EAT</option>
                          <option value="02:00 PM">02:00 PM - 03:00 PM EAT</option>
                          <option value="04:00 PM">04:00 PM - 05:00 PM EAT</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-[#C9A66B] text-white font-semibold text-xs rounded-xl hover:bg-[#b59357] shadow-lg transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing Request...
                      </>
                    ) : selectedSession.isPaid && !isRetainerClient ? (
                      <>
                        Pay KES {selectedSession.priceKES.toLocaleString()} via M-Pesa & Lock Slot
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        Submit Free Audit Request
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="py-6 text-center space-y-4">
                  <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto animate-bounce" />
                  <h3 className="font-heading font-bold text-xl text-emerald-900">
                    {selectedSession.isPaid ? "1-on-1 Strategy Booking Submitted!" : "Free Audit Application Submitted!"}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                    {selectedSession.isPaid
                      ? "Your consultation booking and M-Pesa payment prompt have been initiated. Your user account has been upgraded to Client status!"
                      : "Thank you for submitting your details! Our strategy team will review your application and confirm your meeting slot shortly."}
                  </p>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 text-left font-mono">
                    <p>• Name: {fullName}</p>
                    <p>• Email: {email}</p>
                    <p>• Date: {bookingDate} @ {bookingTime}</p>
                    <p>• Business Website: {hasBusiness === "yes" ? (websiteUrl || "N/A") : "N/A"}</p>
                  </div>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors"
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
