"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { toast } from "sonner"
import {
  CONSULTATION_PRICE_DISPLAY,
  CONSULTATION_PRICE_KES_FORMATTED,
} from "@/lib/consultation-price"

interface DaySlot {
  time: string
  available: boolean
  reason?: string
}

interface CalendarDay {
  value: string
  label: string
  slots: DaySlot[]
  hasAvailableSlots: boolean
}

type MpesaPhase = "idle" | "sending" | "waiting" | "failed" | "timeout"

export default function BookConsultationPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Step 1: Calendar & Slot Selection
  const [days, setDays] = useState<CalendarDay[]>([])
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")

  // Step 2: Intake Form
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [countryCode, setCountryCode] = useState("+254")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [agencyName, setAgencyName] = useState("")
  const [websiteUrl, setWebsiteUrl] = useState("")
  const [hasNoWebsite, setHasNoWebsite] = useState(false)
  const [bottlenecks, setBottlenecks] = useState("")

  // Step 3: Verified M-Pesa Payment State
  const [mpesaPhone, setMpesaPhone] = useState("")
  const [mpesaPhase, setMpesaPhase] = useState<MpesaPhase>("idle")
  const [mpesaError, setMpesaError] = useState("")
  const [pendingBookingId, setPendingBookingId] = useState<string | null>(null)
  const [checkingManual, setCheckingManual] = useState(false)
  const pollIntervalRef = useRef<number | null>(null)
  const pollAttemptsRef = useRef<number>(0)

  // Step 4: Final Confirmed Booking (ONLY unlocked after Safaricom callback verifies payment)
  const [mpesaReceipt, setMpesaReceipt] = useState("")
  const [googleMeetUrl, setGoogleMeetUrl] = useState("")
  const [calendarEventUrl, setCalendarEventUrl] = useState("")

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current !== null) {
      window.clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }, [])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  // 1. Fetch live slots from Google Calendar API (strictly Wed, Fri, Sun 8am-9pm EAT)
  useEffect(() => {
    async function loadCalendarSlots() {
      try {
        setLoadingSlots(true)
        const res = await fetch("/api/calendar/slots")
        const data = await res.json()
        if (data.success && data.days && data.days.length > 0) {
          setDays(data.days)
          setSelectedDate(data.days[0].value)
        } else {
          generateFallbackDays()
        }
      } catch (err) {
        console.warn("Could not load dynamic slots, using fallback:", err)
        generateFallbackDays()
      } finally {
        setLoadingSlots(false)
      }
    }

    function generateFallbackDays() {
      const fallbackList: CalendarDay[] = []
      const d = new Date()
      d.setDate(d.getDate() + 1)
      while (fallbackList.length < 8) {
        const dayOfWeek = d.getDay() // 0=Sun, 3=Wed, 5=Fri
        if (dayOfWeek === 0 || dayOfWeek === 3 || dayOfWeek === 5) {
          const val = d.toISOString().split("T")[0]
          const lbl = d.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          })
          const standardSlots: DaySlot[] = [
            { time: "08:00 AM", available: true },
            { time: "09:30 AM", available: true },
            { time: "11:00 AM", available: true },
            { time: "12:30 PM", available: true },
            { time: "02:00 PM", available: true },
            { time: "03:30 PM", available: true },
            { time: "05:00 PM", available: true },
            { time: "06:30 PM", available: true },
            { time: "08:00 PM", available: true },
          ]
          fallbackList.push({
            value: val,
            label: lbl,
            slots: standardSlots,
            hasAvailableSlots: true,
          })
        }
        d.setDate(d.getDate() + 1)
      }
      setDays(fallbackList)
      if (fallbackList.length > 0) {
        setSelectedDate(fallbackList[0].value)
      }
    }

    loadCalendarSlots()
  }, [])

  // Sync phone number to M-Pesa phone state
  useEffect(() => {
    if (phoneNumber && !mpesaPhone) {
      setMpesaPhone(phoneNumber)
    }
  }, [phoneNumber, mpesaPhone])

  const selectedDayObj = days.find((d) => d.value === selectedDate)

  const buildScheduledAtIso = () => {
    const [timeVal, modifier] = selectedTime.split(" ")
    const [hours, minutes] = timeVal.split(":")
    let hr = parseInt(hours, 10)
    if (modifier === "PM" && hr < 12) hr += 12
    if (modifier === "AM" && hr === 12) hr = 0
    return `${selectedDate}T${String(hr).padStart(2, "0")}:${minutes}:00+03:00`
  }

  // Step 1 -> Step 2
  const handleProceedToStep2 = () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select both a date and a time slot.")
      return
    }
    setStep(2)
    window.scrollTo({ top: 120, behavior: "smooth" })
  }

  // Step 2 -> Step 3
  const handleProceedToStep3 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) {
      toast.error("Full Name is required")
      return
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Valid email is required")
      return
    }
    if (!phoneNumber.trim()) {
      toast.error("Phone number is required")
      return
    }
    if (!agencyName.trim()) {
      toast.error("Agency / Company name is required")
      return
    }
    if (!bottlenecks.trim()) {
      toast.error("Please describe your primary bottlenecks and goals")
      return
    }

    setStep(3)
    window.scrollTo({ top: 120, behavior: "smooth" })
  }

  // Poll Supabase-backed status endpoint until Safaricom's callback verifies payment
  const checkBookingPaymentStatus = useCallback(
    async (bookingId: string) => {
      try {
        const res = await fetch(
          `/api/consultation/mpesa-status?bookingId=${encodeURIComponent(bookingId)}`,
          { cache: "no-store" }
        )
        const data = await res.json()

        if (data.status === "paid") {
          stopPolling()
          setMpesaReceipt(data.mpesaReceipt || "")
          setGoogleMeetUrl(data.googleMeetUrl || "")
          setCalendarEventUrl(data.calendarEventUrl || "")
          setMpesaPhase("idle")
          setStep(4)
          toast.success("M-Pesa payment verified! Your strategy session is confirmed.")
          window.scrollTo({ top: 100, behavior: "smooth" })
          return true
        }

        if (data.status === "cancelled" || data.status === "failed") {
          stopPolling()
          const msg =
            data.status === "cancelled"
              ? "M-Pesa payment was cancelled on your phone. Please try again when ready."
              : data.resultDesc || "M-Pesa payment was not completed. Please try again."
          setMpesaError(msg)
          setMpesaPhase("failed")
          toast.error(msg)
          return true
        }
      } catch (err) {
        console.warn("[Mpesa Status] Poll error:", err)
      }
      return false
    },
    [stopPolling]
  )

  const startPollingStatus = useCallback(
    (bookingId: string) => {
      stopPolling()
      pollAttemptsRef.current = 0

      pollIntervalRef.current = window.setInterval(async () => {
        pollAttemptsRef.current += 1
        const finished = await checkBookingPaymentStatus(bookingId)
        if (finished) return

        // Stop polling after ~2.5 minutes (50 attempts x 3s)
        if (pollAttemptsRef.current >= 50) {
          stopPolling()
          setMpesaPhase("timeout")
        }
      }, 3000)
    },
    [checkBookingPaymentStatus, stopPolling]
  )

  // Trigger M-Pesa STK Push -> creates pending_payment row in Supabase -> polls for Safaricom callback
  const handleTriggerMpesaStk = async () => {
    const raw = mpesaPhone || phoneNumber
    if (!raw.trim()) {
      toast.error("Please enter your M-Pesa phone number.")
      return
    }

    stopPolling()
    setMpesaError("")
    setMpesaPhase("sending")

    try {
      const scheduledAt = buildScheduledAtIso()
      const res = await fetch("/api/consultation/payment-stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: `${countryCode}${phoneNumber}`.trim(),
          mpesaPhone: raw.trim(),
          agencyName: agencyName.trim(),
          websiteUrl: hasNoWebsite ? "N/A" : websiteUrl.trim() || "N/A",
          bottlenecks: bottlenecks.trim(),
          scheduledAt,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.bookingId) {
        throw new Error(data.error || "Failed to send M-Pesa PIN prompt")
      }

      setPendingBookingId(data.bookingId)
      setMpesaPhase("waiting")
      toast.success("M-Pesa PIN prompt sent! Enter your PIN on your phone to confirm.")
      startPollingStatus(data.bookingId)
    } catch (err: any) {
      const msg = err.message || "Could not trigger M-Pesa STK Push"
      setMpesaError(msg)
      setMpesaPhase("failed")
      toast.error(msg)
    }
  }

  const handleManualStatusRecheck = async () => {
    if (!pendingBookingId) return
    setCheckingManual(true)
    const finished = await checkBookingPaymentStatus(pendingBookingId)
    setCheckingManual(false)
    if (!finished) {
      toast.info("Still waiting for Safaricom confirmation. Please check again in a few seconds.")
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#07070B] text-[#F9F7F6] overflow-x-hidden font-sans font-light pt-28 md:pt-36 pb-24 relative selection:bg-[#C9A66B]/30">
        {/* Subtle ambient lighting */}
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-[#C9A66B]/5 blur-[130px] pointer-events-none -z-10" />

        <section className="container mx-auto max-w-2xl px-4 sm:px-6">
          {/* Minimalist Executive Header */}
          <div className="text-center max-w-xl mx-auto mb-8">
            <h1 className="font-heading font-light text-[26px] sm:text-[34px] text-[#F9F7F6] leading-tight mb-2">
              1-on-1 AI Strategy &amp; Architecture Call
            </h1>
            <p className="text-sm text-[#F9F7F6]/65 font-light mb-3">
              A private 60 minutes deep dive consultation
            </p>
            <div className="inline-block px-3.5 py-1 rounded-full bg-white/[0.04] border border-[#C9A66B]/30 font-mono text-xs font-medium text-[#C9A66B]">
              {CONSULTATION_PRICE_DISPLAY}
            </div>
            <p className="text-sm text-[#F9F7F6]/65 font-light mt-3 max-w-lg mx-auto leading-relaxed">
              Project pricing depends on your scope, so it is quoted after the call. On the call, we ask a few questions about how your business runs today and where automation can fix it. Then you get a fixed price for your specific scope.
            </p>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === i
                    ? "w-8 bg-[#C9A66B]"
                    : step > i
                    ? "w-4 bg-[#C9A66B]/40"
                    : "w-3 bg-white/10"
                }`}
              />
            ))}
          </div>

          {/* STEP 1: DATE & SLOT SELECTION */}
          {step === 1 && (
            <div className="rounded-[22px] bg-[#0D0F18]/80 border border-white/10 backdrop-blur-xl p-5 sm:p-7 shadow-2xl space-y-6">
              <div>
                <h2 className="text-sm font-heading uppercase tracking-wider text-white/80 font-medium flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#C9A66B]" />
                  Select Date &amp; Time (Wed, Fri, Sun &bull; 8am - 9pm EAT)
                </h2>
              </div>

              {loadingSlots ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-white/60">
                  <Loader2 className="w-6 h-6 animate-spin text-[#C9A66B]" />
                  <p className="text-xs">Loading available slots...</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Days Row */}
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/50 mb-2">
                      Available Days
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {days.map((d) => {
                        const isSelected = selectedDate === d.value
                        return (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => {
                              setSelectedDate(d.value)
                              setSelectedTime("")
                            }}
                            className={`p-3 rounded-xl text-left border transition-all ${
                              isSelected
                                ? "bg-[#C9A66B] text-[#07070B] border-[#C9A66B] font-semibold shadow-md"
                                : "bg-white/[0.03] text-white/80 border-white/10 hover:border-white/20"
                            }`}
                          >
                            <span className="text-[11px] block opacity-70">
                              {d.label.split(",")[0]}
                            </span>
                            <span className="text-xs font-heading block mt-0.5">
                              {d.label.split(",")[1]}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Time Slots */}
                  {selectedDayObj && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-[11px] uppercase tracking-wider text-white/50">
                          Time Slot (30m buffer protected)
                        </label>
                        <span className="text-[10px] text-white/40">EAT (UTC+3)</span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {selectedDayObj.slots.map((slot) => {
                          const isSelected = selectedTime === slot.time
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setSelectedTime(slot.time)}
                              className={`py-2.5 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                                !slot.available
                                  ? "bg-white/[0.01] border-white/5 text-white/20 cursor-not-allowed line-through"
                                  : isSelected
                                  ? "bg-[#C9A66B] text-[#07070B] border-[#C9A66B] font-bold"
                                  : "bg-white/[0.03] border-white/10 text-white/90 hover:border-[#C9A66B]/40"
                              }`}
                            >
                              {slot.time}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Continue Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!selectedDate || !selectedTime}
                      onClick={handleProceedToStep2}
                      className="w-full py-3.5 rounded-xl bg-[#C9A66B] text-[#07070B] font-heading font-semibold text-xs tracking-wide hover:bg-[#b59357] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: STRATEGY INTAKE FORM */}
          {step === 2 && (
            <div className="rounded-[22px] bg-[#0D0F18]/80 border border-white/10 backdrop-blur-xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs text-[#C9A66B] font-medium">
                  {selectedDayObj?.label} @ {selectedTime} EAT
                </span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-white/50 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Slot
                </button>
              </div>

              <form onSubmit={handleProceedToStep3} className="space-y-4 text-xs">
                <div>
                  <label className="block text-white/80 font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/80 font-medium mb-1">
                      Email Address (for Google Meet) *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@gmail.com"
                      className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A66B]"
                    />
                  </div>

                  <div>
                    <label className="block text-white/80 font-medium mb-1">
                      WhatsApp / Phone *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="bg-white/[0.06] border border-white/15 rounded-xl px-2.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A66B]"
                      >
                        <option value="+254" className="bg-[#07070B] text-white">+254</option>
                        <option value="+1" className="bg-[#07070B] text-white">+1</option>
                        <option value="+44" className="bg-[#07070B] text-white">+44</option>
                        <option value="+971" className="bg-[#07070B] text-white">+971</option>
                        <option value="+255" className="bg-[#07070B] text-white">+255</option>
                        <option value="+256" className="bg-[#07070B] text-white">+256</option>
                      </select>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="712345678"
                        className="flex-1 bg-white/[0.04] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A66B]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-white/80 font-medium mb-1">
                    Agency / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Your agency or brand name"
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-white/80 font-medium">
                      Business Website / Social Media URL
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const nextVal = !hasNoWebsite
                        setHasNoWebsite(nextVal)
                        if (nextVal) setWebsiteUrl("N/A")
                        else setWebsiteUrl("")
                      }}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-all ${
                        hasNoWebsite
                          ? "bg-[#C9A66B]/20 border-[#C9A66B] text-[#C9A66B] font-semibold"
                          : "border-white/15 text-white/50 hover:text-white"
                      }`}
                    >
                      {hasNoWebsite ? "✓ Set to N/A" : "No website? Click N/A"}
                    </button>
                  </div>

                  {!hasNoWebsite ? (
                    <input
                      type="text"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://... or @instagram / LinkedIn"
                      className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A66B]"
                    />
                  ) : (
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/10 text-white/40 text-xs italic">
                      No website / social media provided (N/A)
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-white/80 font-medium mb-1">
                    Primary Bottlenecks &amp; Goals *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={bottlenecks}
                    onChange={(e) => setBottlenecks(e.target.value)}
                    placeholder="Briefly describe what challenges you want to solve (e.g. slow inquiry responses, CRM disconnects, lead follow-ups)..."
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A66B] resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-[#C9A66B] text-[#07070B] font-heading font-semibold text-xs hover:bg-[#b59357] transition-all flex items-center gap-2"
                  >
                    Proceed to Payment
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: VERIFIED M-PESA PAYMENT (Card & Bitcoin temporarily hidden until live gateways are integrated) */}
          {step === 3 && (
            <div className="rounded-[22px] bg-[#0D0F18]/80 border border-white/10 backdrop-blur-xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-xs text-white/60">Pay for 60-min Strategy Session:</span>
                  <p className="text-sm font-semibold text-[#C9A66B] font-mono">
                    {CONSULTATION_PRICE_KES_FORMATTED}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={mpesaPhase === "sending" || mpesaPhase === "waiting"}
                  onClick={() => {
                    stopPolling()
                    setMpesaPhase("idle")
                    setMpesaError("")
                    setStep(2)
                  }}
                  className="text-xs text-white/50 hover:text-white flex items-center gap-1 disabled:opacity-40"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              {/* Active M-Pesa Verified Payment Box */}
              <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-emerald-500/35 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="text-xs font-heading font-semibold uppercase tracking-wider text-emerald-300">
                      M-Pesa Express (STK Push)
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400/90">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verified by Safaricom
                  </span>
                </div>

                <p className="text-xs text-white/75 leading-relaxed">
                  Enter your M-Pesa phone number below. You will receive a PIN prompt on your phone for{" "}
                  <strong className="text-white">{CONSULTATION_PRICE_KES_FORMATTED}</strong>. Your
                  slot and Google Meet link unlock automatically as soon as Safaricom confirms your
                  payment.
                </p>

                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="mpesa-phone"
                      className="block text-[11px] uppercase tracking-wider text-white/55 mb-1.5"
                    >
                      M-Pesa Phone Number
                    </label>
                    <input
                      id="mpesa-phone"
                      type="tel"
                      autoComplete="tel"
                      disabled={mpesaPhase === "sending" || mpesaPhase === "waiting"}
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="0712345678"
                      className="w-full bg-white/[0.05] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                    />
                  </div>

                  {mpesaPhase !== "waiting" && (
                    <button
                      type="button"
                      disabled={mpesaPhase === "sending" || !mpesaPhone.trim()}
                      onClick={handleTriggerMpesaStk}
                      className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-heading font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)] disabled:opacity-45 cursor-pointer"
                    >
                      {mpesaPhase === "sending" ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Sending M-Pesa PIN Prompt...
                        </>
                      ) : (
                        <>
                          Pay {CONSULTATION_PRICE_KES_FORMATTED} via M-Pesa
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Live Waiting State */}
                {mpesaPhase === "waiting" && (
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-400/40 space-y-2">
                    <div className="flex items-center gap-2.5 text-emerald-300 text-xs font-medium">
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      <span>Waiting for M-Pesa confirmation on your phone...</span>
                    </div>
                    <p className="text-[11px] text-white/65 leading-relaxed">
                      Enter your M-Pesa PIN on your phone. Do not close this page — your booking
                      will confirm automatically within a few seconds after Safaricom verifies
                      payment.
                    </p>
                  </div>
                )}

                {/* Failed / Cancelled State */}
                {mpesaPhase === "failed" && mpesaError && (
                  <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-400/40 flex items-start gap-2.5 text-red-200 text-xs">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-300">Payment not confirmed</p>
                      <p className="text-red-200/80 mt-0.5">{mpesaError}</p>
                    </div>
                  </div>
                )}

                {/* Timeout State — allow manual re-check without paying twice */}
                {mpesaPhase === "timeout" && (
                  <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-400/40 space-y-2.5 text-xs">
                    <p className="text-amber-200 leading-relaxed">
                      We haven&apos;t received Safaricom&apos;s confirmation yet. If money was
                      deducted, click below to check again (no need to pay twice).
                    </p>
                    <button
                      type="button"
                      disabled={checkingManual}
                      onClick={handleManualStatusRecheck}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-200 hover:bg-amber-500/30 font-medium text-xs transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${checkingManual ? "animate-spin" : ""}`} />
                      {checkingManual ? "Checking..." : "Check Payment Status Again"}
                    </button>
                  </div>
                )}
              </div>

              <p className="text-center text-[11px] text-white/45">
                Card &amp; international payment options coming soon.
              </p>
            </div>
          )}

          {/* STEP 4: CONFIRMED SCREEN (ONLY SHOWN AFTER SAFARICOM VERIFIES PAYMENT) */}
          {step === 4 && (
            <div className="rounded-[22px] bg-[#0D0F18]/90 border border-emerald-500/40 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h2 className="text-xl font-heading font-normal text-white mb-1">
                  Strategy Session Confirmed
                </h2>
                <p className="text-xs text-white/60">
                  M-Pesa payment verified and your appointment has been added to Google Calendar.
                </p>
              </div>

              {googleMeetUrl && (
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-[#C9A66B]/30 flex items-center justify-between gap-2 text-left">
                  <div className="truncate">
                    <span className="text-[10px] text-white/50 block">Google Meet Link:</span>
                    <span className="text-xs font-mono text-white truncate block">
                      {googleMeetUrl}
                    </span>
                  </div>
                  <a
                    href={googleMeetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-lg bg-[#C9A66B] text-[#07070B] font-semibold text-xs shrink-0 flex items-center gap-1.5 hover:bg-[#b59357]"
                  >
                    <span>Join Meet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white/80 space-y-1.5 text-left">
                <div className="flex justify-between gap-2">
                  <span className="text-white/50">Date &amp; Time:</span>
                  <span className="text-[#C9A66B] font-semibold">
                    {selectedDayObj?.label} @ {selectedTime} EAT
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-white/50">Client:</span>
                  <span className="text-white">{fullName}</span>
                </div>
                {mpesaReceipt && (
                  <div className="flex justify-between gap-2">
                    <span className="text-white/50">M-Pesa Receipt:</span>
                    <span className="text-emerald-400 font-semibold">{mpesaReceipt}</span>
                  </div>
                )}
                <div className="flex justify-between gap-2">
                  <span className="text-white/50">Advisor:</span>
                  <span className="text-white">atulah@cillah.dev</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-1">
                {calendarEventUrl && (
                  <a
                    href={calendarEventUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs flex items-center gap-1.5"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-[#C9A66B]" />
                    <span>Add to Calendar</span>
                  </a>
                )}
                <a
                  href="/"
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs"
                >
                  Return to Home
                </a>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </>
  )
}
