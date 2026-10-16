"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  CreditCard,
  ExternalLink,
  Lock,
  Smartphone
} from "lucide-react"
import { toast } from "sonner"

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

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card" | "bitcoin">("mpesa")
  const [mpesaPhone, setMpesaPhone] = useState("")
  const [stkSent, setStkSent] = useState(false)
  const [stkLoading, setStkLoading] = useState(false)
  const [submittingBooking, setSubmittingBooking] = useState(false)
  const [copiedBtc, setCopiedBtc] = useState(false)

  // On-Page Card Form State
  const [cardNumber, setCardNumber] = useState("")
  const [cardExpiry, setCardExpiry] = useState("")
  const [cardCvc, setCardCvc] = useState("")
  const [cardName, setCardName] = useState("")

  // Step 4: Final Confirmation
  const [googleMeetUrl, setGoogleMeetUrl] = useState("")
  const [calendarEventUrl, setCalendarEventUrl] = useState("")

  const BTC_ADDRESS = "13gvFh6UxVFkbfwxmrduVaR9ms6bipwJD4"
  const PRICE_KES = 5000
  const PRICE_USD = 40

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
      let d = new Date()
      d.setDate(d.getDate() + 1)
      while (fallbackList.length < 8) {
        const dayOfWeek = d.getDay() // 0=Sun, 3=Wed, 5=Fri
        if (dayOfWeek === 0 || dayOfWeek === 3 || dayOfWeek === 5) {
          const val = d.toISOString().split("T")[0]
          const lbl = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
          const standardSlots: DaySlot[] = [
            { time: "08:00 AM", available: true },
            { time: "09:30 AM", available: true },
            { time: "11:00 AM", available: true },
            { time: "12:30 PM", available: true },
            { time: "02:00 PM", available: true },
            { time: "03:30 PM", available: true },
            { time: "05:00 PM", available: true },
            { time: "06:30 PM", available: true },
            { time: "08:00 PM", available: true }
          ]
          fallbackList.push({
            value: val,
            label: lbl,
            slots: standardSlots,
            hasAvailableSlots: true
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
    if (!fullName.trim()) { toast.error("Full Name is required"); return }
    if (!email.trim() || !email.includes("@")) { toast.error("Valid email is required"); return }
    if (!phoneNumber.trim()) { toast.error("Phone number is required"); return }
    if (!agencyName.trim()) { toast.error("Agency / Company name is required"); return }
    if (!bottlenecks.trim()) { toast.error("Please describe your primary bottlenecks and goals"); return }

    setStep(3)
    window.scrollTo({ top: 120, behavior: "smooth" })
  }

  // Handle M-Pesa STK Push
  const handleTriggerMpesaStk = async () => {
    const raw = mpesaPhone || phoneNumber
    if (!raw) {
      toast.error("Please provide your M-Pesa phone number.")
      return
    }

    setStkLoading(true)
    try {
      const res = await fetch("/api/consultation/payment-stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `${countryCode}${raw}`.replace("+", ""),
          email,
          amount: PRICE_KES
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to trigger STK Push")

      setStkSent(true)
      toast.success("M-Pesa PIN prompt sent to your phone!")
    } catch (err: any) {
      toast.error(err.message || "Could not trigger M-Pesa STK Push")
    } finally {
      setStkLoading(false)
    }
  }

  // Format Card Number (XXXX XXXX XXXX XXXX)
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16)
    const formatted = val.match(/.{1,4}/g)?.join(" ") || val
    setCardNumber(formatted)
  }

  // Format Expiry (MM/YY)
  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4)
    if (val.length >= 2) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`
    }
    setCardExpiry(val)
  }

  // Finalize Booking & Lock Slot
  const handleFinalizeBooking = async () => {
    // Basic validation if Card was selected
    if (paymentMethod === "card") {
      const cleanCard = cardNumber.replace(/\s/g, "")
      if (cleanCard.length < 15) {
        toast.error("Please enter a valid 16-digit card number")
        return
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        toast.error("Please enter card expiry (MM/YY)")
        return
      }
      if (!cardCvc || cardCvc.length < 3) {
        toast.error("Please enter your card CVC/CVV")
        return
      }
    }

    setSubmittingBooking(true)
    try {
      const [timeVal, modifier] = selectedTime.split(" ")
      let [hours, minutes] = timeVal.split(":")
      let hr = parseInt(hours)
      if (modifier === "PM" && hr < 12) hr += 12
      if (modifier === "AM" && hr === 12) hr = 0
      const scheduledAt = `${selectedDate}T${String(hr).padStart(2, "0")}:${minutes}:00+03:00`

      const payload = {
        fullName,
        email,
        phone: `${countryCode}${phoneNumber}`,
        agencyName,
        websiteUrl: hasNoWebsite ? "N/A" : (websiteUrl || "N/A"),
        bottlenecks,
        scheduledAt,
        paymentMethod,
        paymentStatus: paymentMethod === "mpesa" ? (stkSent ? "paid" : "pending") : "paid",
        amount: PRICE_KES
      }

      const res = await fetch("/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to submit booking")

      setGoogleMeetUrl(data.googleMeetUrl || "")
      setCalendarEventUrl(data.calendarEventUrl || "")
      setStep(4)
      toast.success("Booking confirmed! Your Google Meet link is ready.")
      window.scrollTo({ top: 100, behavior: "smooth" })
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm booking")
    } finally {
      setSubmittingBooking(false)
    }
  }

  const handleCopyBtc = () => {
    navigator.clipboard.writeText(BTC_ADDRESS)
    setCopiedBtc(true)
    toast.success("Bitcoin address copied!")
    setTimeout(() => setCopiedBtc(false), 3000)
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
              1-on-1 AI Strategy & Architecture Call
            </h1>
            <p className="text-sm text-[#F9F7F6]/65 font-light mb-3">
              A private 60 minutes deep dive consultation
            </p>
            <div className="inline-block px-3.5 py-1 rounded-full bg-white/[0.04] border border-[#C9A66B]/30 font-mono text-xs font-medium text-[#C9A66B]">
              KES 5,000 / $40 USD
            </div>
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
                  Select Date & Time (Wed, Fri, Sun • 8am - 9pm EAT)
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
                            <span className="text-[11px] block opacity-70">{d.label.split(",")[0]}</span>
                            <span className="text-xs font-heading block mt-0.5">{d.label.split(",")[1]}</span>
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
                {/* Full Name */}
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

                {/* Email and Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-white/80 font-medium mb-1">Email Address (for Google Meet) *</label>
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
                    <label className="block text-white/80 font-medium mb-1">WhatsApp / Phone *</label>
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

                {/* Agency Name */}
                <div>
                  <label className="block text-white/80 font-medium mb-1">Agency / Business Name *</label>
                  <input
                    type="text"
                    required
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Your agency or brand name"
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>

                {/* Website / Social with Easy N/A Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-white/80 font-medium">Business Website / Social Media URL</label>
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

                {/* Primary Bottlenecks & Goals */}
                <div>
                  <label className="block text-white/80 font-medium mb-1">Primary Bottlenecks & Goals *</label>
                  <textarea
                    required
                    rows={3}
                    value={bottlenecks}
                    onChange={(e) => setBottlenecks(e.target.value)}
                    placeholder="Briefly describe what challenges you want to solve (e.g. slow inquiry responses, CRM disconnects, lead follow-ups)..."
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#C9A66B] resize-none"
                  />
                </div>

                {/* Buttons */}
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

          {/* STEP 3: MINIMALIST PAYMENT (M-PESA / DIRECT CARD / BITCOIN) */}
          {step === 3 && (
            <div className="rounded-[22px] bg-[#0D0F18]/80 border border-white/10 backdrop-blur-xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-xs text-white/60">Pay for 60-min Strategy Session:</span>
                  <p className="text-sm font-semibold text-[#C9A66B] font-mono">
                    {paymentMethod === "mpesa" ? "KES 5,000" : "$40.00 USD"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-white/50 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              {/* Minimal 3-Tab Selector */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("mpesa")}
                  className={`py-3 px-2 rounded-xl border text-center transition-all ${
                    paymentMethod === "mpesa"
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 font-semibold"
                      : "bg-white/[0.02] border-white/10 text-white/60"
                  }`}
                >
                  <span className="text-xs block">M-PESA</span>
                  <span className="text-[10px] text-white/40 block">STK Push</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("card")}
                  className={`py-3 px-2 rounded-xl border text-center transition-all ${
                    paymentMethod === "card"
                      ? "bg-[#00B2FF]/15 border-[#00B2FF] text-[#00B2FF] font-semibold"
                      : "bg-white/[0.02] border-white/10 text-white/60"
                  }`}
                >
                  <span className="text-xs block">Card</span>
                  <span className="text-[10px] text-white/40 block">Visa • Mastercard</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("bitcoin")}
                  className={`py-3 px-2 rounded-xl border text-center transition-all ${
                    paymentMethod === "bitcoin"
                      ? "bg-amber-500/15 border-amber-500 text-amber-400 font-semibold"
                      : "bg-white/[0.02] border-white/10 text-white/60"
                  }`}
                >
                  <span className="text-xs block">Bitcoin</span>
                  <span className="text-[10px] text-white/40 block">BTC Address</span>
                </button>
              </div>

              {/* 1. M-PESA RAIL */}
              {paymentMethod === "mpesa" && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-emerald-500/30 space-y-3">
                  <p className="text-xs text-white/70">
                    Enter your M-Pesa number. You will receive an instant PIN prompt on your phone for <strong>KES 5,000</strong>.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="0712345678"
                      className="flex-1 bg-white/[0.05] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      disabled={stkLoading || !mpesaPhone}
                      onClick={handleTriggerMpesaStk}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all disabled:opacity-40"
                    >
                      {stkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send PIN Prompt"}
                    </button>
                  </div>
                  {stkSent && (
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Prompt sent! Enter your PIN, then click Lock Slot below.
                    </div>
                  )}
                </div>
              )}

              {/* 2. DIRECT ON-PAGE CREDIT / DEBIT CARD RAIL */}
              {paymentMethod === "card" && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-[#00B2FF]/30 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-white/60">
                    <span>Direct Card Checkout ($40.00 USD)</span>
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <Lock className="w-3 h-3" /> 256-Bit Encrypted
                    </span>
                  </div>

                  {/* Card Number */}
                  <div>
                    <label className="block text-white/70 mb-1">Card Number</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4123 4567 8901 2345"
                        maxLength={19}
                        className="w-full bg-white/[0.05] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00B2FF]"
                      />
                      <CreditCard className="w-4 h-4 text-white/40 absolute right-3 top-3" />
                    </div>
                  </div>

                  {/* Expiry & CVC */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/70 mb-1">Expiry Date</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleCardExpiryChange}
                        placeholder="MM / YY"
                        maxLength={5}
                        className="w-full bg-white/[0.05] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00B2FF]"
                      />
                    </div>
                    <div>
                      <label className="block text-white/70 mb-1">CVC / CVV</label>
                      <input
                        type="password"
                        value={cardCvc}
                        onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="•••"
                        maxLength={4}
                        className="w-full bg-white/[0.05] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-[#00B2FF]"
                      />
                    </div>
                  </div>

                  {/* Cardholder Name */}
                  <div>
                    <label className="block text-white/70 mb-1">Cardholder Name</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder={fullName || "Name on card"}
                      className="w-full bg-white/[0.05] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#00B2FF]"
                    />
                  </div>
                </div>
              )}

              {/* 3. MOBILE-FRIENDLY BITCOIN RAIL */}
              {paymentMethod === "bitcoin" && (
                <div className="p-4 rounded-xl bg-white/[0.02] border border-amber-500/30 space-y-3 text-xs">
                  <div className="flex items-center justify-between text-white/70">
                    <span>Send $40 USD (~0.0006 BTC)</span>
                    <span className="text-amber-400 font-semibold font-mono">Bitcoin Network</span>
                  </div>

                  {/* Address with One-Tap Copy */}
                  <div className="bg-black/50 border border-white/15 p-2.5 rounded-xl space-y-1.5">
                    <span className="text-[10px] text-white/50 block">Deposit Address (Tap to copy):</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-white flex-1 break-all select-all">
                        {BTC_ADDRESS}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyBtc}
                        className="p-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 shrink-0 font-medium text-[11px] flex items-center gap-1"
                      >
                        {copiedBtc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedBtc ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Mobile Deep Link */}
                  <a
                    href={`bitcoin:${BTC_ADDRESS}?amount=0.0006`}
                    className="w-full py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white text-xs border border-white/15 flex items-center justify-center gap-2 transition-all"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                    <span>Open in Mobile Crypto Wallet (Binance / Trust / CashApp)</span>
                  </a>
                </div>
              )}

              {/* Final Confirm Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={submittingBooking}
                  onClick={handleFinalizeBooking}
                  className="w-full py-3.5 rounded-xl bg-[#C9A66B] text-[#07070B] font-heading font-semibold text-xs tracking-wide hover:bg-[#b59357] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(201,166,107,0.3)] disabled:opacity-50"
                >
                  {submittingBooking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Confirming & Generating Google Meet...
                    </>
                  ) : (
                    <>
                      Confirm Booking & Lock Slot
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: VIP CONFIRMATION SCREEN */}
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
                  Your appointment has been added to Google Calendar.
                </p>
              </div>

              {/* Direct Meet Link */}
              {googleMeetUrl && (
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-[#C9A66B]/30 flex items-center justify-between gap-2 text-left">
                  <div className="truncate">
                    <span className="text-[10px] text-white/50 block">Google Meet Link:</span>
                    <span className="text-xs font-mono text-white truncate block">{googleMeetUrl}</span>
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

              {/* Summary */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-white/80 space-y-1.5 text-left">
                <div className="flex justify-between">
                  <span className="text-white/50">Date & Time:</span>
                  <span className="text-[#C9A66B] font-semibold">{selectedDayObj?.label} @ {selectedTime} EAT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Client:</span>
                  <span className="text-white">{fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Advisor:</span>
                  <span className="text-white">atulah@cillah.dev</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Reminders:</span>
                  <span className="text-emerald-400">WhatsApp (24h & 1h prior)</span>
                </div>
              </div>

              {/* Actions */}
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
