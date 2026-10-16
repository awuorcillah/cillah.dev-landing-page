"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  Phone,
  Mail,
  User,
  Building2,
  Globe,
  ArrowRight,
  ArrowLeft,
  Copy,
  ExternalLink,
  Check,
  CreditCard,
  QrCode,
  AlertCircle,
  Video
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
  const [bottlenecks, setBottlenecks] = useState("")

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "paypal" | "bitcoin">("mpesa")
  const [mpesaPhone, setMpesaPhone] = useState("")
  const [stkSent, setStkSent] = useState(false)
  const [stkLoading, setStkLoading] = useState(false)
  const [submittingBooking, setSubmittingBooking] = useState(false)
  const [copiedBtc, setCopiedBtc] = useState(false)

  // Step 4: Final Confirmation
  const [googleMeetUrl, setGoogleMeetUrl] = useState("")
  const [calendarEventUrl, setCalendarEventUrl] = useState("")

  // Constants
  const BTC_ADDRESS = "13gvFh6UxVFkbfwxmrduVaR9ms6bipwJD4"
  const PAYPAL_EMAIL = "cherrylatulah2000@gmail.com"
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
          // Default to first available day
          setSelectedDate(data.days[0].value)
        } else {
          // Fallback if API has no days
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

  // Handlers for steps
  const handleProceedToStep2 = () => {
    if (!selectedDate || !selectedTime) {
      toast.error("Please select both an available date and a time slot.")
      return
    }
    setStep(2)
    window.scrollTo({ top: 180, behavior: "smooth" })
  }

  const handleProceedToStep3 = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) { toast.error("Full Name is required"); return }
    if (!email.trim() || !email.includes("@")) { toast.error("Valid email is required"); return }
    if (!phoneNumber.trim()) { toast.error("Phone number is required"); return }
    if (!agencyName.trim()) { toast.error("Agency / Company name is required"); return }
    if (!bottlenecks.trim()) { toast.error("Please describe your primary bottlenecks and goals"); return }

    setStep(3)
    window.scrollTo({ top: 180, behavior: "smooth" })
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
      toast.success("M-Pesa STK Push prompt sent to your phone! Please enter your PIN.")
    } catch (err: any) {
      toast.error(err.message || "Could not trigger M-Pesa STK Push")
    } finally {
      setStkLoading(false)
    }
  }

  // Handle Final Booking Submission
  const handleFinalizeBooking = async () => {
    setSubmittingBooking(true)
    try {
      // Calculate ISO appointment timestamp
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
        websiteUrl: websiteUrl || "N/A",
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
      toast.success("Booking confirmed! Your Google Meet link and details are ready.")
      window.scrollTo({ top: 120, behavior: "smooth" })
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm booking")
    } finally {
      setSubmittingBooking(false)
    }
  }

  const handleCopyBtc = () => {
    navigator.clipboard.writeText(BTC_ADDRESS)
    setCopiedBtc(true)
    toast.success("Bitcoin address copied to clipboard!")
    setTimeout(() => setCopiedBtc(false), 3000)
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#07070B] text-[#F9F7F6] overflow-x-hidden font-sans font-light pt-28 md:pt-36 pb-24 relative selection:bg-[#C9A66B]/30">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[#C9A66B]/6 blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] rounded-full bg-[#F2B6C1]/4 blur-[140px] pointer-events-none -z-10" />

        <section className="container mx-auto max-w-4xl px-4 sm:px-6 md:px-8">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-[#C9A66B]/30 mb-4 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-[#C9A66B]" />
              <span className="text-[11px] font-medium tracking-[0.2em] uppercase text-[#F2B6C1]">
                Executive Strategy Session
              </span>
            </div>
            
            <h1 className="font-heading font-light text-[32px] sm:text-[44px] text-[#F9F7F6] leading-[1.15] mb-4">
              1-on-1 AI Strategy & <br className="hidden sm:inline" />
              <span className="text-[#C9A66B] font-normal italic">Architecture Call</span>
            </h1>

            <p className="text-sm sm:text-base text-[#F9F7F6]/75 font-light leading-relaxed">
              A private 60-minute deep-dive consultation to architect custom AI lead qualification, CRM automation, and multi-channel workflows for your business.
            </p>

            {/* Quick Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6 text-xs text-[#F9F7F6]/80">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10">
                <Clock className="w-3.5 h-3.5 text-[#C9A66B]" />
                <span>60 Minutes Call</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10">
                <Video className="w-3.5 h-3.5 text-[#C9A66B]" />
                <span>Google Meet Direct</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C9A66B]" />
                <span>KES 5,000 / $40 USD</span>
              </div>
            </div>
          </div>

          {/* Stepper Indicator */}
          <div className="mb-8">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className={`p-2 rounded-xl border transition-all ${step >= 1 ? "bg-[#C9A66B]/15 border-[#C9A66B] text-[#C9A66B] font-medium" : "border-white/10 text-white/40"}`}>
                <span className="hidden sm:inline">1. </span>Date & Slot
              </div>
              <div className={`p-2 rounded-xl border transition-all ${step >= 2 ? "bg-[#C9A66B]/15 border-[#C9A66B] text-[#C9A66B] font-medium" : "border-white/10 text-white/40"}`}>
                <span className="hidden sm:inline">2. </span>Strategy Intake
              </div>
              <div className={`p-2 rounded-xl border transition-all ${step >= 3 ? "bg-[#C9A66B]/15 border-[#C9A66B] text-[#C9A66B] font-medium" : "border-white/10 text-white/40"}`}>
                <span className="hidden sm:inline">3. </span>Payment
              </div>
              <div className={`p-2 rounded-xl border transition-all ${step === 4 ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-medium" : "border-white/10 text-white/40"}`}>
                <span className="hidden sm:inline">4. </span>Confirmed
              </div>
            </div>
          </div>

          {/* STEP 1: DATE & SLOT SELECTION */}
          {step === 1 && (
            <div className="rounded-[24px] bg-[#0D0F18]/80 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-lg font-heading font-medium text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-[#C9A66B]" />
                    Select Consultation Slot
                  </h2>
                  <p className="text-xs text-white/60 mt-0.5">
                    Consultations are held on <span className="text-[#C9A66B] font-medium">Wednesdays, Fridays, & Sundays</span> from 8:00 AM to 9:00 PM EAT.
                  </p>
                </div>
                <div className="text-xs text-[#C9A66B] bg-[#C9A66B]/10 border border-[#C9A66B]/30 px-3 py-1.5 rounded-full w-fit">
                  30-Min Buffer Protected
                </div>
              </div>

              {loadingSlots ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-white/60">
                  <Loader2 className="w-7 h-7 animate-spin text-[#C9A66B]" />
                  <p className="text-xs">Checking live Google Calendar availability...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Days Selector */}
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-white/60 font-medium mb-3">
                      Available Days (Wed / Fri / Sun)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {days.map((d) => {
                        const isSelected = selectedDate === d.value
                        return (
                          <button
                            key={d.value}
                            type="button"
                            onClick={() => {
                              setSelectedDate(d.value)
                              setSelectedTime("") // Reset time on date change
                            }}
                            className={`p-3.5 rounded-xl text-left border transition-all ${
                              isSelected
                                ? "bg-[#C9A66B] text-[#07070B] border-[#C9A66B] shadow-[0_0_15px_rgba(201,166,107,0.3)] font-semibold"
                                : "bg-white/[0.03] text-white/80 border-white/10 hover:border-white/30 hover:bg-white/[0.06]"
                            }`}
                          >
                            <span className="text-xs block opacity-75">{d.label.split(",")[0]}</span>
                            <span className="text-sm font-heading block mt-0.5">{d.label.split(",")[1]}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Time Slots */}
                  {selectedDayObj && (
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-xs uppercase tracking-wider text-white/60 font-medium">
                          Available Time Slots (Nairobi / EAT Timezone)
                        </label>
                        <span className="text-[11px] text-white/50">UTC+3 (East Africa Time)</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {selectedDayObj.slots.map((slot) => {
                          const isSelected = selectedTime === slot.time
                          return (
                            <button
                              key={slot.time}
                              type="button"
                              disabled={!slot.available}
                              onClick={() => setSelectedTime(slot.time)}
                              className={`py-3 px-3 rounded-xl text-xs font-medium border flex items-center justify-between transition-all ${
                                !slot.available
                                  ? "bg-white/[0.01] border-white/5 text-white/30 cursor-not-allowed line-through"
                                  : isSelected
                                  ? "bg-[#C9A66B] text-[#07070B] border-[#C9A66B] shadow-[0_0_15px_rgba(201,166,107,0.3)] font-bold scale-[1.02]"
                                  : "bg-white/[0.03] border-white/10 text-white/90 hover:border-[#C9A66B]/50 hover:bg-white/[0.06]"
                              }`}
                            >
                              <span>{slot.time}</span>
                              {slot.available ? (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? "bg-black/20 text-black" : "bg-emerald-500/20 text-emerald-400"}`}>
                                  Open
                                </span>
                              ) : (
                                <span className="text-[10px] text-white/30">Booked</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Continue Button */}
                  <div className="pt-4 border-t border-white/10 flex justify-end">
                    <button
                      type="button"
                      disabled={!selectedDate || !selectedTime}
                      onClick={handleProceedToStep2}
                      className="px-6 py-3.5 rounded-xl bg-[#C9A66B] text-[#07070B] font-heading font-semibold text-xs tracking-wide hover:bg-[#b59357] transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(201,166,107,0.25)]"
                    >
                      Continue to Strategy Intake
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: STRATEGY INTAKE FORM */}
          {step === 2 && (
            <div className="rounded-[24px] bg-[#0D0F18]/80 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-lg font-heading font-medium text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-[#C9A66B]" />
                    Strategy Intake Details
                  </h2>
                  <p className="text-xs text-white/60 mt-0.5">
                    Slot Reserved: <span className="text-[#C9A66B] font-medium">{selectedDayObj?.label} @ {selectedTime} EAT</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-white/60 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change Slot
                </button>
              </div>

              <form onSubmit={handleProceedToStep3} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs text-white/80 font-medium mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#C9A66B]" /> Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Cheryl Atulah"
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C9A66B] transition-colors placeholder:text-white/30"
                  />
                </div>

                {/* Email and Phone in Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/80 font-medium mb-1.5 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#C9A66B]" /> Email Address (for Google Meet & Calendar Invite) *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="client@gmail.com"
                      className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C9A66B] transition-colors placeholder:text-white/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/80 font-medium mb-1.5 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#C9A66B]" /> Phone / WhatsApp Number *
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="bg-white/[0.06] border border-white/15 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-[#C9A66B]"
                      >
                        <option value="+254" className="bg-[#07070B] text-white">+254 (KE)</option>
                        <option value="+1" className="bg-[#07070B] text-white">+1 (US)</option>
                        <option value="+44" className="bg-[#07070B] text-white">+44 (UK)</option>
                        <option value="+971" className="bg-[#07070B] text-white">+971 (UAE)</option>
                        <option value="+27" className="bg-[#07070B] text-white">+27 (ZA)</option>
                        <option value="+255" className="bg-[#07070B] text-white">+255 (TZ)</option>
                        <option value="+256" className="bg-[#07070B] text-white">+256 (UG)</option>
                        <option value="+91" className="bg-[#07070B] text-white">+91 (IN)</option>
                      </select>
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))}
                        placeholder="712345678"
                        className="flex-1 bg-white/[0.04] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C9A66B] transition-colors placeholder:text-white/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Agency Name & Website */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-white/80 font-medium mb-1.5 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#C9A66B]" /> Agency / Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={agencyName}
                      onChange={(e) => setAgencyName(e.target.value)}
                      placeholder="e.g. Apex Real Estate"
                      className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C9A66B] transition-colors placeholder:text-white/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-white/80 font-medium mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#C9A66B]" /> Business Website / Social URL
                    </label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://apexrealestate.com"
                      className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C9A66B] transition-colors placeholder:text-white/30"
                    />
                  </div>
                </div>

                {/* Primary Bottlenecks & Automation Goals */}
                <div>
                  <label className="block text-xs text-white/80 font-medium mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C9A66B]" /> Primary Business Bottlenecks & Automation Goals *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={bottlenecks}
                    onChange={(e) => setBottlenecks(e.target.value)}
                    placeholder="Describe your current lead delays, missed inquiries, CRM disconnects, or the specific autonomous workflows you want to architect..."
                    className="w-full bg-white/[0.04] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C9A66B] transition-colors placeholder:text-white/30 resize-none"
                  />
                </div>

                {/* Form Action Buttons */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-5 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs font-medium transition-all"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-3.5 rounded-xl bg-[#C9A66B] text-[#07070B] font-heading font-semibold text-xs tracking-wide hover:bg-[#b59357] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(201,166,107,0.25)]"
                  >
                    Proceed to Payment (KES 5,000 / $40)
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD (M-PESA / PAYPAL / BITCOIN) */}
          {step === 3 && (
            <div className="rounded-[24px] bg-[#0D0F18]/80 border border-white/10 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h2 className="text-lg font-heading font-medium text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#C9A66B]" />
                    Select Payment Method
                  </h2>
                  <p className="text-xs text-white/60 mt-0.5">
                    Amount: <span className="text-[#C9A66B] font-semibold text-sm">KES 5,000</span> or <span className="text-[#C9A66B] font-semibold text-sm">$40 USD</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs text-white/60 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Form
                </button>
              </div>

              {/* Payment Method Selector Tabs */}
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("mpesa")}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    paymentMethod === "mpesa"
                      ? "bg-emerald-500/15 border-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      : "bg-white/[0.03] border-white/10 text-white/60 hover:border-white/20"
                  }`}
                >
                  <span className="text-xs font-bold text-emerald-400">M-PESA</span>
                  <span className="text-[10px] text-white/70">Lipa na M-Pesa STK</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("paypal")}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    paymentMethod === "paypal"
                      ? "bg-[#00B2FF]/15 border-[#00B2FF] text-white shadow-[0_0_20px_rgba(0,178,255,0.2)]"
                      : "bg-white/[0.03] border-white/10 text-white/60 hover:border-white/20"
                  }`}
                >
                  <span className="text-xs font-bold text-[#00B2FF]">Card / PayPal</span>
                  <span className="text-[10px] text-white/70">Visa • Mastercard • Amex</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod("bitcoin")}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                    paymentMethod === "bitcoin"
                      ? "bg-amber-500/15 border-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                      : "bg-white/[0.03] border-white/10 text-white/60 hover:border-white/20"
                  }`}
                >
                  <span className="text-xs font-bold text-amber-400">Bitcoin</span>
                  <span className="text-[10px] text-white/70">Direct BTC Address</span>
                </button>
              </div>

              {/* RAIL 1: M-PESA STK PUSH */}
              {paymentMethod === "mpesa" && (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                      Lipa Na M-Pesa Online STK Push
                    </span>
                    <span className="text-sm font-mono font-bold text-white">KES 5,000</span>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed">
                    Enter your Safaricom M-Pesa phone number below. When you click <strong className="text-emerald-400">Send STK Push</strong>, an instant PIN prompt will appear on your phone screen to complete the transaction.
                  </p>

                  <div className="flex gap-2">
                    <input
                      type="tel"
                      value={mpesaPhone}
                      onChange={(e) => setMpesaPhone(e.target.value.replace(/[^0-9]/g, ""))}
                      placeholder="e.g. 0712345678"
                      className="flex-1 bg-white/[0.05] border border-white/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                    <button
                      type="button"
                      disabled={stkLoading || !mpesaPhone}
                      onClick={handleTriggerMpesaStk}
                      className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold tracking-wide transition-all flex items-center gap-2 disabled:opacity-40"
                    >
                      {stkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send STK Push"}
                    </button>
                  </div>

                  {stkSent && (
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-start gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>
                        Prompt sent to your phone! Please enter your M-Pesa PIN on your mobile device. Once entered, click <strong>Confirm Booking & Lock Slot</strong> below.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* RAIL 2: CARD / PAYPAL */}
              {paymentMethod === "paypal" && (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-[#00B2FF]/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#00B2FF] uppercase tracking-wider">
                      Credit / Debit Card via PayPal Checkout
                    </span>
                    <span className="text-sm font-mono font-bold text-white">$40.00 USD</span>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed">
                    Pay securely using any <strong>Visa, Mastercard, or American Express</strong> card. You can check out as a guest without needing a PayPal account.
                  </p>

                  <div className="p-4 rounded-xl bg-[#00B2FF]/5 border border-[#00B2FF]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="font-medium text-white">Merchant Account:</p>
                      <p className="text-[#00B2FF] font-mono text-xs">{PAYPAL_EMAIL}</p>
                    </div>

                    <a
                      href={`https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(PAYPAL_EMAIL)}&item_name=1-on-1+AI+Strategy+Call&amount=${PRICE_USD}&currency_code=USD`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-[#00B2FF] text-[#07070B] font-semibold text-xs hover:bg-[#00B2FF]/90 transition-all flex items-center justify-center gap-2 shrink-0 shadow-[0_0_15px_rgba(0,178,255,0.3)]"
                    >
                      <span>Open PayPal / Card Checkout</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <p className="text-[11px] text-white/50">
                    * After completing payment on the PayPal tab, return here and click <strong>Confirm Booking & Lock Slot</strong>.
                  </p>
                </div>
              )}

              {/* RAIL 3: BITCOIN (BINANCE QR & ADDRESS) */}
              {paymentMethod === "bitcoin" && (
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-amber-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                      Bitcoin Network Deposit
                    </span>
                    <span className="text-sm font-mono font-bold text-white">$40.00 USD (~0.0006 BTC)</span>
                  </div>

                  <p className="text-xs text-white/70 leading-relaxed">
                    Scan the QR code or send <strong>$40 USD in BTC</strong> directly to the Binance wallet address below over the <strong>Bitcoin network</strong>.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-white/[0.03] border border-white/10">
                    {/* Dynamic QR image for Bitcoin Address */}
                    <div className="w-36 h-36 bg-white p-2 rounded-xl shrink-0 shadow-lg flex items-center justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=bitcoin:${BTC_ADDRESS}?amount=0.0006`}
                        alt="Bitcoin QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex-1 space-y-2 text-xs w-full">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Network:</span>
                        <span className="font-semibold text-amber-400">Bitcoin</span>
                      </div>
                      <div>
                        <span className="text-white/60 block mb-1">Deposit Wallet Address:</span>
                        <div className="flex items-center gap-2 bg-black/40 border border-white/15 p-2 rounded-lg font-mono text-[11px] break-all">
                          <span className="text-white flex-1">{BTC_ADDRESS}</span>
                          <button
                            type="button"
                            onClick={handleCopyBtc}
                            className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-white shrink-0"
                            title="Copy Address"
                          >
                            {copiedBtc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <p className="text-[10px] text-white/40">
                        * Smart contracts / tokens on other chains are not supported. Send native BTC only.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Final Confirm Button */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-3 rounded-xl border border-white/10 text-white/70 hover:text-white hover:bg-white/5 text-xs font-medium transition-all"
                >
                  Back
                </button>

                <button
                  type="button"
                  disabled={submittingBooking}
                  onClick={handleFinalizeBooking}
                  className="px-7 py-3.5 rounded-xl bg-[#C9A66B] text-[#07070B] font-heading font-semibold text-xs tracking-wide hover:bg-[#b59357] transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(201,166,107,0.3)] disabled:opacity-50"
                >
                  {submittingBooking ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating Google Meet & Locking Slot...
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
            <div className="rounded-[24px] bg-[#0D0F18]/90 border border-emerald-500/40 backdrop-blur-2xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h2 className="text-2xl font-heading font-normal text-white mb-2">
                  1-on-1 AI Strategy Session Confirmed!
                </h2>
                <p className="text-sm text-white/70 max-w-md mx-auto leading-relaxed">
                  Your appointment has been locked on Google Calendar. Your dedicated advisor <strong className="text-[#C9A66B]">Atulah</strong> has been assigned to your session.
                </p>
              </div>

              {/* Google Meet Direct Card */}
              {googleMeetUrl && (
                <div className="max-w-lg mx-auto p-4 rounded-2xl bg-white/[0.04] border border-[#C9A66B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Video className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs text-white/60 block">Meeting Platform:</span>
                      <span className="text-sm font-semibold text-white font-mono break-all">{googleMeetUrl}</span>
                    </div>
                  </div>

                  <a
                    href={googleMeetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 rounded-xl bg-[#C9A66B] text-[#07070B] font-heading font-semibold text-xs hover:bg-[#b59357] transition-all flex items-center justify-center gap-2 shrink-0 shadow-[0_0_15px_rgba(201,166,107,0.3)]"
                  >
                    <span>Join Google Meet</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Summary Details */}
              <div className="max-w-lg mx-auto p-4 rounded-2xl bg-black/40 border border-white/10 text-left text-xs space-y-2 font-mono text-white/80">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/50">Client:</span>
                  <span className="font-semibold text-white">{fullName}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/50">Agency:</span>
                  <span className="text-white">{agencyName || "N/A"}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/50">Scheduled Time:</span>
                  <span className="text-[#C9A66B] font-semibold">{selectedDayObj?.label} @ {selectedTime} EAT</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-white/50">Assigned Advisor:</span>
                  <span className="text-white">atulah@cillah.dev</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Reminders:</span>
                  <span className="text-emerald-400">WhatsApp (24h & 1h prior) + Email</span>
                </div>
              </div>

              {/* Calendar Action */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {calendarEventUrl && (
                  <a
                    href={calendarEventUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <CalendarIcon className="w-4 h-4 text-[#C9A66B]" />
                    <span>Add to Google Calendar</span>
                  </a>
                )}

                <a
                  href="/"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium text-xs transition-all"
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
