"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Building, 
  CreditCard, 
  Calendar, 
  Check, 
  Loader2, 
  ArrowRight, 
  Phone,
  Sparkles,
  CheckCircle2,
  CalendarDays,
  Clock,
  ExternalLink
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Step = 1 | 2 | 3 | 4 // Step 1: Contact, Step 2: Payment, Step 3: Calendar, Step 4: Success

export default function BookConsultationPage() {
  const [step, setStep] = useState<Step>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // State from Step 1
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [company, setCompany] = useState("")
  const [recordId, setRecordId] = useState("")

  // State from Step 2
  const [phone, setPhone] = useState("")
  const [mpesaStatus, setMpesaStatus] = useState<"idle" | "sent" | "polling" | "success" | "failed">("idle")
  const [mpesaMessage, setMpesaMessage] = useState("")
  const [receiptNumber, setReceiptNumber] = useState("")

  const [isLocalhost, setIsLocalhost] = useState(false)
  const amountVal = process.env.NEXT_PUBLIC_CONSULTATION_AMOUNT || "2000"
  const formattedAmount = Number(amountVal).toLocaleString("en-US")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsLocalhost(
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
      )
    }
  }, [])

  // State from Step 3
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [selectedTime, setSelectedTime] = useState<string>("")
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [calendarUrl, setCalendarUrl] = useState("")
  const [availableSlots, setAvailableSlots] = useState<any[]>([])
  const [slotsLoading, setSlotsLoading] = useState(true)
  const [daysWithSlots, setDaysWithSlots] = useState<{
    value: string;
    label: string;
    slots: { time: string; available: boolean }[];
    hasAvailableSlots: boolean;
  }[]>([])

  const COMMON_TIMEZONES = useMemo(() => [
    { value: "Africa/Nairobi", label: "Nairobi (EAT, UTC+3)" },
    { value: "UTC", label: "UTC / GMT" },
    { value: "Europe/London", label: "London (GMT/BST)" },
    { value: "Europe/Paris", label: "Paris / Berlin (CET/CEST)" },
    { value: "America/New_York", label: "New York (EST/EDT)" },
    { value: "America/Chicago", label: "Chicago (CST/CDT)" },
    { value: "America/Denver", label: "Denver (MST/MDT)" },
    { value: "America/Los_Angeles", label: "Los Angeles (PST/PDT)" },
    { value: "Asia/Dubai", label: "Dubai (GST, UTC+4)" },
    { value: "Asia/Kolkata", label: "Mumbai (IST, UTC+5:30)" },
    { value: "Africa/Johannesburg", label: "Johannesburg (SAST, UTC+2)" },
    { value: "Africa/Lagos", label: "Lagos (WAT, UTC+1)" },
    { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
    { value: "Asia/Singapore", label: "Singapore (SGT, UTC+8)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST, UTC+9)" },
  ], [])

  const [selectedTimezone, setSelectedTimezone] = useState("Africa/Nairobi")
  const [timezoneOptions, setTimezoneOptions] = useState(COMMON_TIMEZONES)

  // Detect and set user's browser timezone on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (detected) {
        setSelectedTimezone(detected)
        if (!COMMON_TIMEZONES.some(tz => tz.value === detected)) {
          // Add detected timezone to options
          const offsetStr = new Date().toLocaleDateString("en-US", {
            timeZone: detected,
            timeZoneName: "short"
          }).split(", ").pop() || ""
          const cleanName = detected.replace(/_/g, " ")
          setTimezoneOptions([
            { value: detected, label: `${cleanName} (${offsetStr})` },
            ...COMMON_TIMEZONES
          ])
        }
      }
    }
  }, [COMMON_TIMEZONES])

  // Fetch slots from API on mount
  useEffect(() => {
    const loadSlots = async () => {
      setSlotsLoading(true)
      try {
        const response = await fetch("/api/calendar/slots")
        const data = await response.json()
        if (response.ok && data.days) {
          setDaysWithSlots(data.days)
        } else {
          throw new Error(data.error || "Failed to load slots")
        }
      } catch (err: any) {
        console.error("Failed to fetch slots availability:", err)
        setError("Failed to sync available times from Google Calendar. Please reload the page.")
      } finally {
        setSlotsLoading(false)
      }
    }
    loadSlots()
  }, [])

  // Map slots dynamically based on the selected timezone
  const mappedDays = useMemo(() => {
    if (!daysWithSlots || daysWithSlots.length === 0) return []

    const flatSlots: any[] = []
    daysWithSlots.forEach(day => {
      day.slots.forEach((s: any) => {
        const [timeVal, modifier] = s.time.split(" ")
        let [hours, minutes] = timeVal.split(":")
        let hr = parseInt(hours)
        if (modifier === "PM" && hr < 12) hr += 12
        if (modifier === "AM" && hr === 12) hr = 0

        // Parse relative to Nairobi EAT
        const slotStart = new Date(`${day.value}T${String(hr).padStart(2, "0")}:${minutes}:00+03:00`)

        try {
          const localDateValue = slotStart.toLocaleDateString("en-CA", { timeZone: selectedTimezone }) // YYYY-MM-DD
          const localDateLabel = slotStart.toLocaleDateString("en-US", {
            timeZone: selectedTimezone,
            weekday: "short",
            month: "short",
            day: "numeric"
          })
          const localTimeStr = slotStart.toLocaleTimeString("en-US", {
            timeZone: selectedTimezone,
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          })

          flatSlots.push({
            absoluteTime: slotStart.toISOString(),
            nairobiDate: day.value,
            nairobiTime: s.time,
            localDateValue,
            localDateLabel,
            localTimeStr,
            available: s.available
          })
        } catch (e) {
          console.error("Timezone formatting error:", e)
        }
      })
    })

    // Group by localDateValue
    const groups: { [key: string]: { label: string, value: string, slots: any[] } } = {}
    flatSlots.forEach(slot => {
      if (!groups[slot.localDateValue]) {
        groups[slot.localDateValue] = {
          value: slot.localDateValue,
          label: slot.localDateLabel,
          slots: []
        }
      }
      groups[slot.localDateValue].slots.push(slot)
    })

    // Filter to only days with available slots
    const groupedDays = Object.values(groups)
      .map(g => {
        const availableSlots = g.slots.filter(s => s.available)
        return {
          ...g,
          slots: availableSlots,
          hasAvailableSlots: availableSlots.length > 0
        }
      })
      .filter(g => g.hasAvailableSlots)

    // Sort chronologically
    groupedDays.sort((a, b) => a.value.localeCompare(b.value))
    return groupedDays
  }, [daysWithSlots, selectedTimezone])

  // Extract available dates list from mappedDays
  const availableDates = useMemo(() => {
    return mappedDays.map(d => ({
      value: d.value,
      label: d.label
    }))
  }, [mappedDays])

  // Reset selected values when timezone changes
  useEffect(() => {
    setSelectedDate("")
    setSelectedTime("")
    setSelectedSlot(null)
  }, [selectedTimezone])

  // Update available slots list when selectedDate changes
  useEffect(() => {
    setSelectedTime("")
    setSelectedSlot(null)
    if (!selectedDate) {
      setAvailableSlots([])
      return
    }

    const dayData = mappedDays.find((d) => d.value === selectedDate)
    if (dayData) {
      setAvailableSlots(dayData.slots)
    } else {
      setAvailableSlots([])
    }
  }, [selectedDate, mappedDays])

  // STEP 3: Confirm Appointment Slot (Finalizes selection in Airtable + creates Google Calendar event)
  const handleBookingSubmit = async (receipt?: string) => {
    if (!selectedDate || !selectedSlot) return
    setError(null)
    setLoading(true)

    // Send slot relative to original Nairobi EAT timezone
    const [timeVal, modifier] = selectedSlot.nairobiTime.split(" ")
    let [hours, minutes] = timeVal.split(":")
    let hr = parseInt(hours)
    if (modifier === "PM" && hr < 12) hr += 12
    if (modifier === "AM" && hr === 12) hr = 0
    
    const appointmentDateTime = `${selectedSlot.nairobiDate}T${String(hr).padStart(2, "0")}:${minutes}:00+03:00`

    try {
      const response = await fetch("/api/consultation/finalize-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId,
          appointmentDate: appointmentDateTime,
          name,
          email,
          company
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Booking confirmation failed")

      setCalendarUrl(data.calendarEventUrl)
      setTimeout(() => {
        setStep(4)
      }, 1500)
    } catch (err: any) {
      setError(err.message || "Failed to confirm appointment slot")
    } finally {
      setLoading(false)
    }
  }

  // STEP 1: Submit Contact Details
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!name.trim() || !email.trim() || !company.trim()) {
      setError("Please fill in all details")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/consultation/create-record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Failed to create record")

      setRecordId(data.recordId)
      setStep(2)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  // STEP 2: Trigger STK Push Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMpesaStatus("sent")
    setMpesaMessage("Connecting to Safaricom production API...")

    if (!phone.trim()) {
      setError("M-PESA Phone number is required")
      setMpesaStatus("idle")
      return
    }

    try {
      const response = await fetch("/api/consultation/payment-stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId, email, phone })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "STK Push failed")

      if (data.recordId) {
        setRecordId(data.recordId)
      }

      setMpesaStatus("polling")
      setMpesaMessage("STK push prompt sent to your phone. Enter M-PESA PIN to complete payment.")
      
      // Start polling for payment confirmation
      startPollingPayment(data.recordId || recordId)
    } catch (err: any) {
      setError(err.message || "Failed to trigger payment")
      setMpesaStatus("idle")
    }
  }

  // Poll Airtable/cache for Payment Status
  let pollInterval: NodeJS.Timeout
  const startPollingPayment = (recId: string) => {
    let attempts = 0
    const maxAttempts = 20 // 1 minute of polling

    pollInterval = setInterval(async () => {
      attempts++
      try {
        const response = await fetch(`/api/consultation/payment-status?recordId=${recId}&email=${email}`)
        const data = await response.json()

        if (response.ok && data.paymentStatus === "Paid") {
          clearInterval(pollInterval)
          if (data.recordId) {
            setRecordId(data.recordId)
          }
          setReceiptNumber(data.mpesaReceipt)
          setMpesaStatus("success")
          setMpesaMessage("Payment verified successfully!")
          handleBookingSubmit(data.mpesaReceipt)
        }
      } catch (err) {
        console.error("Polling error:", err)
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollInterval)
        if (mpesaStatus === "polling") {
          setMpesaStatus("idle")
          setError("Payment verification timed out. If you paid, click 'Verify Payment' or try again.")
        }
      }
    }, 3000)
  }

  // Dev helper: Simulate successful payment
  const handleSimulatePayment = async () => {
    setError(null)
    setMpesaStatus("polling")
    setMpesaMessage("Simulating webhook callback...")

    try {
      const response = await fetch(`/api/consultation/payment-status?recordId=${recordId}&simulatePaid=true&email=${email}`)
      const data = await response.json()

      if (!response.ok) throw new Error(data.error || "Simulation failed")

      if (data.recordId) {
        setRecordId(data.recordId)
      }
      setReceiptNumber(data.mpesaReceipt)
      setMpesaStatus("success")
      setMpesaMessage("Simulated Payment Success!")
      handleBookingSubmit(data.mpesaReceipt)
    } catch (err: any) {
      setError(err.message)
      setMpesaStatus("idle")
    }
  }

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (pollInterval) clearInterval(pollInterval)
    }
  }, [])

  // Booking Submit removed (moved to top of file)

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-[#FBECE8] to-[#FFF9F6] text-[#1E1E1E] overflow-x-hidden font-sans font-light pt-32 md:pt-40 pb-24">
        
        {/* Step Indicator Header */}
        <section className="container mx-auto max-w-3xl px-6 mb-12">
          <div className="flex items-center justify-between relative max-w-md mx-auto">
            {/* Connecting lines */}
            <div className="absolute left-0 top-1/2 w-full h-[2px] bg-black/5 -translate-y-1/2 -z-10" />
            <div 
              className="absolute left-0 top-1/2 h-[2px] bg-[#C9A66B] -translate-y-1/2 -z-10 transition-all duration-500" 
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            />

            {[
              { num: 1, label: "Details" },
              { num: 2, label: "Schedule" },
              { num: 3, label: "Payment" },
              { num: 4, label: "Finish" }
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-2">
                <div 
                  className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all duration-300 ${
                    step >= s.num 
                      ? "bg-[#C9A66B] border-[#C9A66B] text-white shadow-[0_0_15px_rgba(201,166,107,0.3)]" 
                      : "bg-[#FFF9F6] border-black/10 text-black/40"
                  }`}
                >
                  {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-semibold ${step >= s.num ? "text-[#C9A66B]" : "text-black/30"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Wizard Card Body */}
        <section className="container mx-auto max-w-4xl px-4 sm:px-6 md:px-12">
          <div className="max-w-[700px] w-full mx-auto">
            
            {/* White card with subtle border */}
            <div className="bg-[#FFFDFB] border border-[#C9A66B]/20 rounded-[24px] p-6 sm:p-8 md:p-10 shadow-[0_10px_40px_rgba(201,166,107,0.05)] relative overflow-hidden">
              
              {/* Amber corner accent */}
              <div className="absolute top-0 right-0 h-24 w-24 bg-[#C9A66B]/3 blur-2xl rounded-full" />
              
              <AnimatePresence mode="wait">
                
                {/* STEP 1: Contact Form */}
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="text-center sm:text-left mb-8">
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#C9A66B]/10 border border-[#C9A66B]/20 text-[#C9A66B] mb-3 text-xs font-semibold">
                        <Sparkles className="h-3 w-3" />
                        <span>Step 1 of 3</span>
                      </div>
                      <h2 className="font-heading font-light text-[26px] sm:text-[32px] text-[#1E1E1E] leading-tight mb-2">
                        Let&apos;s Discover Your Business
                      </h2>
                      <p className="text-sm text-[#1E1E1E]/60">
                        Introduce yourself and your company to begin booking your customized AI consultation.
                      </p>
                    </div>

                    <form onSubmit={handleContactSubmit} className="space-y-6">
                      {error && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                          {error}
                        </div>
                      )}

                      {/* Name input */}
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-black/60">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black/30" />
                          <input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className="w-full pl-12 pr-4 py-3.5 rounded-[12px] border border-black/10 bg-[#FFFDFB] focus:border-[#C9A66B] focus:ring-2 focus:ring-[#C9A66B]/15 outline-none transition-all text-sm text-black"
                          />
                        </div>
                      </div>

                      {/* Email input */}
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-black/60">
                          Email Address
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black/30" />
                          <input
                            id="email"
                            type="email"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full pl-12 pr-4 py-3.5 rounded-[12px] border border-black/10 bg-[#FFFDFB] focus:border-[#C9A66B] focus:ring-2 focus:ring-[#C9A66B]/15 outline-none transition-all text-sm text-black"
                          />
                        </div>
                      </div>

                      {/* Company Details */}
                      <div className="space-y-2">
                        <label htmlFor="company" className="text-xs font-semibold uppercase tracking-wider text-black/60">
                          Company & Agency Details
                        </label>
                        <div className="relative">
                          <Building className="absolute left-4 top-4 h-5 w-5 text-black/30" />
                          <textarea
                            id="company"
                            placeholder="e.g. Apex Realty - 15 agents. We want to automate WhatsApp leads."
                            rows={3}
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            required
                            className="w-full pl-12 pr-4 py-3.5 rounded-[12px] border border-black/10 bg-[#FFFDFB] focus:border-[#C9A66B] focus:ring-2 focus:ring-[#C9A66B]/15 outline-none transition-all text-sm text-black"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-[#C9A66B] text-[#FFF9F6] hover:bg-[#C9A66B]/90 font-heading font-semibold rounded-[16px] transition-all flex items-center justify-center gap-2 hover:shadow-[0_6px_20px_rgba(201,166,107,0.2)] disabled:opacity-50"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Creating Session...
                          </>
                        ) : (
                          <>
                            Proceed to Payment
                            <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* STEP 3: Consultation Fee Payment */}
                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="text-center sm:text-left mb-6">
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#C9A66B]/10 border border-[#C9A66B]/20 text-[#C9A66B] mb-3 text-xs font-semibold">
                        <CreditCard className="h-3 w-3" />
                        <span>Step 3 of 3</span>
                      </div>
                      <h2 className="font-heading font-light text-[26px] sm:text-[32px] text-[#1E1E1E] leading-tight mb-2">
                        Consultation Booking Fee
                      </h2>
                      <p className="text-sm text-[#1E1E1E]/60">
                        Authorize payment via M-PESA STK Push to finalize your booked consultation slot.
                      </p>
                    </div>

                    {/* Premium billing card */}
                    <div className="p-6 rounded-[16px] bg-[#C9A66B]/5 border border-[#C9A66B]/20 mb-8 flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-sm text-[#C9A66B] uppercase tracking-wider mb-1">
                          AI Consultation
                        </h4>
                        <p className="text-[11px] text-[#1E1E1E]/50">
                          Complete automation mapping session + calendar invitation
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="font-heading font-semibold text-[22px] text-black">
                          KES {formattedAmount}
                        </span>
                      </div>
                    </div>

                    <form onSubmit={handlePaymentSubmit} className="space-y-6">
                      {error && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                          {error}
                        </div>
                      )}

                      {mpesaStatus === "idle" && (
                        <>
                          <div className="space-y-2">
                            <label htmlFor="phone" className="text-xs font-semibold uppercase tracking-wider text-black/60">
                              M-PESA Phone Number
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-black/30" />
                              <input
                                id="phone"
                                type="text"
                                placeholder="07xxxxxxxx or 2547xxxxxxxx"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                                className="w-full pl-12 pr-4 py-3.5 rounded-[12px] border border-black/10 bg-[#FFFDFB] focus:border-[#C9A66B] focus:ring-2 focus:ring-[#C9A66B]/15 outline-none transition-all text-sm text-black"
                              />
                            </div>
                            <p className="text-[11px] text-[#1E1E1E]/50 leading-relaxed mt-1">
                              Enter the phone number that will receive the M-PESA STK Push prompt to enter your PIN.
                            </p>
                          </div>

                          <button
                            type="submit"
                            className="w-full py-4 bg-[#C9A66B] text-[#FFF9F6] hover:bg-[#C9A66B]/90 font-heading font-semibold rounded-[16px] transition-all flex items-center justify-center gap-2 hover:shadow-[0_6px_20px_rgba(201,166,107,0.2)]"
                          >
                            Send M-PESA STK Push
                          </button>
                        </>
                      )}

                      {/* Polling / Verifying Screen */}
                      {(mpesaStatus === "sent" || mpesaStatus === "polling" || mpesaStatus === "success") && (
                        <div className="py-6 flex flex-col items-center text-center space-y-4">
                          {mpesaStatus === "success" ? (
                            <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                              <Check className="h-8 w-8 stroke-[3]" />
                            </div>
                          ) : (
                            <Loader2 className="h-10 w-10 text-[#C9A66B] animate-spin" />
                          )}
                          <div>
                            <h4 className="font-semibold text-black text-[16px]">
                              {mpesaStatus === "success" ? "Verification Successful" : "Waiting for payment..."}
                            </h4>
                            <p className="text-xs text-[#1E1E1E]/60 max-w-sm mx-auto mt-1 leading-relaxed">
                              {mpesaMessage}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Dev helper section */}
                      {isLocalhost && (
                        <div className="pt-6 border-t border-black/5 flex flex-col items-center space-y-3">
                          <div className="flex items-center gap-1.5 text-[11px] text-[#C9A66B] bg-[#C9A66B]/5 border border-[#C9A66B]/20 px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
                            <Sparkles className="h-3 w-3" />
                            <span>Local Host Developer Sandbox</span>
                          </div>
                          <p className="text-[11px] text-center text-[#1E1E1E]/50 max-w-md">
                            Safaricom cannot call webhooks directly on <code>localhost</code>. Use the button below to bypass payment validation for local testing.
                          </p>
                          <button
                            type="button"
                            onClick={handleSimulatePayment}
                            className="px-5 py-2.5 bg-[#1E1E1E] hover:bg-[#2D2D2D] text-[#FFF9F6] text-xs font-semibold rounded-xl transition-all"
                          >
                            Simulate Payment Success (Dev Mode)
                          </button>
                        </div>
                      )}
                    </form>
                  </motion.div>
                )}

                {/* STEP 2: Appointment Scheduling */}
                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="text-center sm:text-left mb-6">
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#C9A66B]/10 border border-[#C9A66B]/20 text-[#C9A66B] mb-3 text-xs font-semibold">
                        <CalendarDays className="h-3 w-3" />
                        <span>Step 2 of 3</span>
                      </div>
                      <h2 className="font-heading font-light text-[26px] sm:text-[32px] text-[#1E1E1E] leading-tight mb-2">
                        Welcome, {name.split(" ")[0]}!
                      </h2>
                      <p className="text-sm text-[#1E1E1E]/60">
                        Pick a preferred time and date from the available slots below.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {error && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                          {error}
                        </div>
                      )}

                      {/* Timezone Selector */}
                      <div className="space-y-2">
                        <label htmlFor="timezone" className="text-xs font-semibold uppercase tracking-wider text-black/60 block">
                          Time Zone
                        </label>
                        <Select value={selectedTimezone} onValueChange={setSelectedTimezone}>
                          <SelectTrigger id="timezone" className="w-full rounded-xl border-black/10 bg-[#FFFDFB] text-black">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent className="max-h-60 border-[#C9A66B]/20 bg-[#FFFDFB] text-black">
                            {timezoneOptions.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value} className="text-black hover:bg-[#C9A66B]/10">
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 1. Date Grid Picker */}
                      <div className="space-y-3">
                        <span className="text-xs font-semibold uppercase tracking-wider text-black/60 block">
                          Select Date
                        </span>
                        {slotsLoading && availableDates.length === 0 ? (
                          <div className="flex items-center justify-center py-6 gap-2 text-xs text-[#1E1E1E]/50 font-medium">
                            <Loader2 className="h-4 w-4 animate-spin text-[#C9A66B]" />
                            Loading available slots...
                          </div>
                        ) : availableDates.length === 0 ? (
                          <div className="text-sm text-[#1E1E1E]/60 text-center py-6">
                            No slots available in the next 30 days. Please contact us directly.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                            {availableDates.map((d) => (
                              <button
                                key={d.value}
                                type="button"
                                onClick={() => setSelectedDate(d.value)}
                                className={`py-3.5 px-3 rounded-[12px] border text-xs font-semibold transition-all text-center flex flex-col items-center justify-center gap-1 ${
                                  selectedDate === d.value
                                    ? "bg-[#C9A66B] border-[#C9A66B] text-white shadow-[0_4px_15px_rgba(201,166,107,0.2)]"
                                    : "bg-[#FFFDFB] border-black/10 hover:border-[#C9A66B]/40 text-black/80"
                                }`}
                              >
                                <span>{d.label.split(",")[0]}</span>
                                <span className="opacity-60 text-[10px] font-normal">{d.label.split(",")[1]}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* 2. Time Grid Picker */}
                      {selectedDate && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3 pt-2"
                        >
                          <span className="text-xs font-semibold uppercase tracking-wider text-black/60 block">
                            Select Time ({timezoneOptions.find(tz => tz.value === selectedTimezone)?.label.split(" (")[0] || selectedTimezone})
                          </span>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                            {availableSlots.map((slot) => (
                              <button
                                key={slot.absoluteTime}
                                type="button"
                                onClick={() => {
                                  setSelectedSlot(slot)
                                  setSelectedTime(slot.localTimeStr)
                                }}
                                className={`py-3 rounded-[12px] border text-xs font-semibold transition-all text-center flex items-center justify-center gap-1 ${
                                  selectedTime === slot.localTimeStr
                                    ? "bg-[#C9A66B] border-[#C9A66B] text-white shadow-[0_4px_15px_rgba(201,166,107,0.2)]"
                                    : "bg-[#FFFDFB] border-black/10 hover:border-[#C9A66B]/40 text-black/80"
                                }`}
                              >
                                <Clock className="h-3.5 w-3.5 opacity-60" />
                                <span>{slot.localTimeStr}</span>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}

                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        disabled={!selectedDate || !selectedTime}
                        className="w-full py-4 mt-6 bg-[#C9A66B] text-[#FFF9F6] hover:bg-[#C9A66B]/90 font-heading font-semibold rounded-[16px] transition-all flex items-center justify-center gap-2 hover:shadow-[0_6px_20px_rgba(201,166,107,0.2)] disabled:opacity-40"
                      >
                        Proceed to Payment
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: Success Screen */}
                {step === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="py-6 flex flex-col items-center text-center space-y-6"
                  >
                    <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.25)] border-4 border-white animate-bounce">
                      <CheckCircle2 className="h-10 w-10 stroke-[2]" />
                    </div>

                    <div>
                      <h2 className="font-heading font-light text-[28px] sm:text-[34px] text-black leading-tight mb-2">
                        Consultation Confirmed!
                      </h2>
                      <p className="text-sm text-[#1E1E1E]/60 max-w-md mx-auto">
                        Your AI Consultation booking has been registered. The details have been updated in Airtable.
                      </p>
                    </div>

                    {/* Booking summary receipt card */}
                    <div className="w-full max-w-sm p-6 rounded-[20px] bg-[#FFF9F6] border border-[#C9A66B]/15 text-left space-y-4">
                      <div className="flex justify-between border-b border-black/5 pb-3">
                        <span className="text-xs text-black/40 font-semibold uppercase">Client</span>
                        <span className="text-xs font-semibold text-black">{name}</span>
                      </div>
                      <div className="flex justify-between border-b border-black/5 pb-3">
                        <span className="text-xs text-black/40 font-semibold uppercase">Company</span>
                        <span className="text-xs font-semibold text-black">{company.split("-")[0].trim()}</span>
                      </div>
                      <div className="flex justify-between border-b border-black/5 pb-3">
                        <span className="text-xs text-black/40 font-semibold uppercase">Appointment</span>
                        <span className="text-xs font-semibold text-[#C9A66B]">
                          {selectedSlot ? `${selectedSlot.localDateLabel} @ ${selectedSlot.localTimeStr}` : "Scheduled via Google Calendar"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-black/40 font-semibold uppercase">M-PESA Receipt</span>
                        <span className="text-xs font-mono font-semibold text-emerald-600">{receiptNumber}</span>
                      </div>
                    </div>

                    <div className="w-full flex flex-col sm:flex-row gap-3 max-w-md justify-center">
                      {calendarUrl && (
                        <a
                          href={calendarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-4 bg-[#FFFDFB] border border-[#C9A66B]/30 hover:border-[#C9A66B]/60 text-black hover:bg-[#C9A66B]/5 font-heading font-semibold rounded-[16px] transition-all flex items-center justify-center gap-2"
                        >
                          <CalendarDays className="h-4 w-4 text-[#C9A66B]" />
                          Open Google Calendar
                        </a>
                      )}
                      <a
                        href="/"
                        className="w-full py-4 bg-[#C9A66B] hover:bg-[#C9A66B]/90 text-white font-heading font-semibold rounded-[16px] transition-all flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(201,166,107,0.2)]"
                      >
                        Return Home
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Trust Note */}
            <div className="flex items-center justify-center gap-2 mt-6 text-center text-xs text-[#1E1E1E]/60 font-sans">
              <ShieldCheck className="h-4 w-4 text-[#C9A66B] shrink-0" />
              <span>
                Your session is secured using SSL encryption. Production M-PESA details are authenticated by Safaricom.
              </span>
            </div>

          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
