"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import {
  Calendar as CalendarIcon,
  ChevronDown,
  Clock,
  Globe,
  CheckCircle2,
  ShieldCheck,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Smartphone,
} from "lucide-react"
import { toast } from "sonner"
import { trackMetaEvent } from "@/components/meta-pixel-tracker"
import {
  CONSULTATION_PRICE_DISPLAY,
  CONSULTATION_PRICE_KES_FORMATTED,
  CONSULTATION_PRICE_USD,
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

const CURATED_TIMEZONES: { value: string; label: string }[] = [
  { value: "Africa/Nairobi", label: "Nairobi, Kenya (EAT • UTC+3)" },
  { value: "Asia/Dubai", label: "Dubai, UAE (GST • UTC+4)" },
  { value: "Europe/London", label: "London, UK (GMT / BST)" },
  { value: "Europe/Paris", label: "Paris / Berlin / Amsterdam (CET / CEST)" },
  { value: "America/New_York", label: "New York / Miami (ET)" },
  { value: "America/Chicago", label: "Chicago / Dallas (CT)" },
  { value: "America/Denver", label: "Denver (MT)" },
  { value: "America/Los_Angeles", label: "Los Angeles / San Francisco (PT)" },
  { value: "America/Toronto", label: "Toronto, Canada (ET)" },
  { value: "Africa/Johannesburg", label: "Johannesburg, South Africa (SAST)" },
  { value: "Africa/Lagos", label: "Lagos, Nigeria (WAT)" },
  { value: "Africa/Cairo", label: "Cairo, Egypt (EET)" },
  { value: "Asia/Riyadh", label: "Riyadh / Doha (AST • UTC+3)" },
  { value: "Asia/Kolkata", label: "Mumbai / Delhi, India (IST)" },
  { value: "Asia/Singapore", label: "Singapore (SGT • UTC+8)" },
  { value: "Asia/Tokyo", label: "Tokyo, Japan (JST)" },
  { value: "Australia/Sydney", label: "Sydney, Australia (AEST / AEDT)" },
]

function parseEatSlotToDate(dateIso: string, eatTimeStr: string): Date | null {
  if (!dateIso || !eatTimeStr) return null
  const parts = eatTimeStr.trim().split(" ")
  if (parts.length < 2) return null
  const [timeVal, modifier] = parts
  const [hoursStr, minutesStr] = timeVal.split(":")
  let hr = parseInt(hoursStr, 10)
  if (Number.isNaN(hr)) return null
  if (modifier === "PM" && hr < 12) hr += 12
  if (modifier === "AM" && hr === 12) hr = 0
  const iso = `${dateIso}T${String(hr).padStart(2, "0")}:${minutesStr || "00"}:00+03:00`
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

function getTimeZoneShortName(date: Date, timeZone: string): string {
  if (timeZone === "Africa/Nairobi") return "EAT"
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      timeZoneName: "short",
    }).formatToParts(date)
    const tzPart = parts.find((p) => p.type === "timeZoneName")?.value
    return tzPart || timeZone.split("/").pop()?.replace(/_/g, " ") || timeZone
  } catch {
    return timeZone
  }
}

function formatSlotInTimeZone(
  dateIso: string,
  eatTimeStr: string,
  targetTimeZone: string
): {
  timeLabel: string
  dateLabel: string
  dayOffsetLabel: string
  tzShort: string
} {
  const slotDate = parseEatSlotToDate(dateIso, eatTimeStr)
  if (!slotDate) {
    return { timeLabel: eatTimeStr, dateLabel: dateIso, dayOffsetLabel: "", tzShort: "EAT" }
  }

  try {
    const timeLabel = new Intl.DateTimeFormat("en-US", {
      timeZone: targetTimeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(slotDate)

    const dateLabel = new Intl.DateTimeFormat("en-US", {
      timeZone: targetTimeZone,
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(slotDate)

    // Compare YYYY-MM-DD in target timezone vs EAT dateIso to detect midnight shifts
    const targetYmd = new Intl.DateTimeFormat("en-CA", {
      timeZone: targetTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(slotDate)

    let dayOffsetLabel = ""
    if (targetYmd < dateIso) dayOffsetLabel = "prev day"
    else if (targetYmd > dateIso) dayOffsetLabel = "next day"

    const tzShort = getTimeZoneShortName(slotDate, targetTimeZone)
    return { timeLabel, dateLabel, dayOffsetLabel, tzShort }
  } catch {
    return { timeLabel: eatTimeStr, dateLabel: dateIso, dayOffsetLabel: "", tzShort: "EAT" }
  }
}

export default function BookConsultationPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  // Live clock & automatic browser IANA timezone detection + manual override
  const [now, setNow] = useState<Date | null>(null)
  const [detectedTimeZone, setDetectedTimeZone] = useState<string>("Africa/Nairobi")
  const [selectedTimeZone, setSelectedTimeZone] = useState<string>("Africa/Nairobi")

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz) {
        setDetectedTimeZone(tz)
        setSelectedTimeZone(tz)
      }
    } catch {}
    setNow(new Date())
    const interval = window.setInterval(() => {
      setNow(new Date())
    }, 1000)
    return () => window.clearInterval(interval)
  }, [])

  const timeZoneOptions = useMemo(() => {
    const exists = CURATED_TIMEZONES.some((t) => t.value === detectedTimeZone)
    if (exists || !detectedTimeZone) return CURATED_TIMEZONES
    return [
      {
        value: detectedTimeZone,
        label: `${detectedTimeZone.replace(/_/g, " ")} (Auto-detected)`,
      },
      ...CURATED_TIMEZONES,
    ]
  }, [detectedTimeZone])

  const isSelectedEat = selectedTimeZone === "Africa/Nairobi"

  const eatDateText = now
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "Africa/Nairobi",
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(now)
    : ""

  const eatTimeText = now
    ? new Intl.DateTimeFormat("en-US", {
        timeZone: "Africa/Nairobi",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now)
    : ""

  const selectedTzTimeText =
    now && !isSelectedEat
      ? new Intl.DateTimeFormat("en-US", {
          timeZone: selectedTimeZone,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).format(now)
      : ""

  const selectedTzDateText =
    now && !isSelectedEat
      ? new Intl.DateTimeFormat("en-US", {
          timeZone: selectedTimeZone,
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(now)
      : ""

  const selectedTzShort = now ? getTimeZoneShortName(now, selectedTimeZone) : "EAT"

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

  // Step 3: Payment Method (M-Pesa Express OR Card via Paystack)
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card">("mpesa")
  const [mpesaPhone, setMpesaPhone] = useState("")
  const [mpesaPhase, setMpesaPhase] = useState<MpesaPhase>("idle")
  const [mpesaError, setMpesaError] = useState("")
  const [cardLoading, setCardLoading] = useState(false)
  const [cardError, setCardError] = useState("")
  const [verifyingPaystackReturn, setVerifyingPaystackReturn] = useState(false)
  const [confirmedMethodLabel, setConfirmedMethodLabel] = useState<"M-Pesa" | "Card">("M-Pesa")
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

  // Verify Paystack Card return (?paystack_ref=...&bookingId=...)
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const paystackRef = params.get("paystack_ref") || params.get("reference") || params.get("trxref")
    const bookingId = params.get("bookingId") || ""
    if (!paystackRef) return

    let active = true
    async function verifyCardReturn() {
      setVerifyingPaystackReturn(true)
      setPaymentMethod("card")
      setStep(3)
      try {
        const res = await fetch(
          `/api/consultation/paystack-verify?reference=${encodeURIComponent(
            paystackRef!
          )}&bookingId=${encodeURIComponent(bookingId)}`,
          { cache: "no-store" }
        )
        const data = await res.json()
        if (!active) return

        if (res.ok && data.status === "paid") {
          setConfirmedMethodLabel("Card")
          setMpesaReceipt(data.receipt || paystackRef!)
          setGoogleMeetUrl(data.googleMeetUrl || "")
          setCalendarEventUrl(data.calendarEventUrl || "")
          if (data.fullName) setFullName(data.fullName)
          setStep(4)
          trackMetaEvent(
            "Schedule",
            {
              content_name: "60-Minute Deep Dive Consultation",
              value: CONSULTATION_PRICE_USD,
              currency: "USD",
            },
            `consult-schedule-${data.bookingId || bookingId}`
          )
          trackMetaEvent(
            "Purchase",
            {
              content_name: "60-Minute Deep Dive Consultation",
              value: CONSULTATION_PRICE_USD,
              currency: "USD",
            },
            `consult-purchase-${data.bookingId || bookingId}`
          )
          toast.success("Card payment verified! Your strategy session is confirmed.")
          // Clean query params without reload
          window.history.replaceState({}, "", "/book-consultation")
        } else {
          const msg =
            data.resultDesc ||
            data.error ||
            "Card payment was not completed. Please try again."
          setCardError(msg)
          toast.error(msg)
        }
      } catch (err: any) {
        if (!active) return
        setCardError(err?.message || "Could not verify card payment.")
      } finally {
        if (active) setVerifyingPaystackReturn(false)
      }
    }

    verifyCardReturn()
    return () => {
      active = false
    }
  }, [])

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
      const nowTime = new Date()
      const minAdvanceTime = new Date(nowTime.getTime() + 24 * 60 * 60 * 1000)
      const eatNow = new Date(nowTime.getTime() + 3 * 60 * 60 * 1000)
      const d = new Date(Date.UTC(eatNow.getUTCFullYear(), eatNow.getUTCMonth(), eatNow.getUTCDate()))
      const standardTimes = [
        "08:00 AM",
        "09:30 AM",
        "11:00 AM",
        "12:30 PM",
        "02:00 PM",
        "03:30 PM",
        "05:00 PM",
        "06:30 PM",
        "08:00 PM",
      ]

      let lookahead = 0
      while (fallbackList.length < 8 && lookahead < 60) {
        const dayOfWeek = d.getUTCDay() // 0=Sun, 3=Wed, 5=Fri
        if (dayOfWeek === 0 || dayOfWeek === 3 || dayOfWeek === 5) {
          const val = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`
          const lbl = new Intl.DateTimeFormat("en-US", {
            timeZone: "UTC",
            weekday: "short",
            month: "short",
            day: "numeric",
          }).format(d)

          const slots: DaySlot[] = standardTimes.map((time) => {
            const slotDate = parseEatSlotToDate(val, time)
            const available = slotDate ? slotDate >= minAdvanceTime : false
            return {
              time,
              available,
              reason: available ? undefined : "Requires 24h advance notice",
            }
          })

          if (slots.some((s) => s.available)) {
            fallbackList.push({
              value: val,
              label: lbl,
              slots,
              hasAvailableSlots: true,
            })
          }
        }
        d.setUTCDate(d.getUTCDate() + 1)
        lookahead++
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
  const selectedConvertedSlot =
    selectedDate && selectedTime
      ? formatSlotInTimeZone(selectedDate, selectedTime, selectedTimeZone)
      : null

  const formattedSelectedSummary = selectedDayObj && selectedTime
    ? isSelectedEat
      ? `${selectedDayObj.label} @ ${selectedTime} EAT`
      : `${selectedConvertedSlot?.dateLabel} @ ${selectedConvertedSlot?.timeLabel} ${selectedConvertedSlot?.tzShort} (${selectedDayObj.label} @ ${selectedTime} EAT)`
    : ""

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
    trackMetaEvent("InitiateCheckout", {
      content_name: "60-Minute Deep Dive Consultation",
      value: CONSULTATION_PRICE_USD,
      currency: "USD",
    })
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
          trackMetaEvent(
            "Schedule",
            {
              content_name: "60-Minute Deep Dive Consultation",
              value: CONSULTATION_PRICE_USD,
              currency: "USD",
            },
            `consult-schedule-${bookingId}`
          )
          trackMetaEvent(
            "Purchase",
            {
              content_name: "60-Minute Deep Dive Consultation",
              value: CONSULTATION_PRICE_USD,
              currency: "USD",
            },
            `consult-purchase-${bookingId}`
          )
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

  // Initialize Paystack Card Checkout (Visa / Mastercard / Apple Pay — Local & International)
  const handlePayWithCard = async () => {
    setCardError("")
    setCardLoading(true)
    try {
      const scheduledAt = buildScheduledAtIso()
      const res = await fetch("/api/consultation/paystack-initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: `${countryCode}${phoneNumber}`.trim(),
          agencyName: agencyName.trim(),
          websiteUrl: hasNoWebsite ? "N/A" : websiteUrl.trim() || "N/A",
          bottlenecks: bottlenecks.trim(),
          scheduledAt,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.authorizationUrl) {
        throw new Error(data.error || "Could not start Paystack card checkout")
      }
      window.location.href = data.authorizationUrl
    } catch (err: any) {
      const msg = err?.message || "Card checkout could not be started"
      setCardError(msg)
      toast.error(msg)
      setCardLoading(false)
    }
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#07070B] text-[#F9F7F6] overflow-x-hidden font-sans font-light pt-24 sm:pt-28 pb-24 relative selection:bg-[#C9A66B]/30">
        {/* Subtle ambient lighting */}
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-[#C9A66B]/5 blur-[130px] pointer-events-none -z-10" />

        <section className="container mx-auto max-w-2xl px-4 sm:px-6">
          {/* Ultra-Clean Header: Subtitle + Dynamic Price Only */}
          <div className="text-center max-w-xl mx-auto mb-6">
            <h1 className="font-heading font-light text-[22px] sm:text-[28px] text-[#F9F7F6] leading-snug mb-3">
              A private 60 minutes deep dive consultation
            </h1>
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/[0.04] border border-[#C9A66B]/40 font-mono text-xs sm:text-sm font-medium text-[#C9A66B]">
              {CONSULTATION_PRICE_DISPLAY}
            </div>
          </div>

          {/* LIVE CURRENT DATE & TIME BOX FRAME — Distinctive Warm Champagne Spotlight */}
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-[#FBF6EC] via-[#F4E7CE] to-[#EAD6B0] border-2 border-[#C9A66B] px-4 py-4 sm:px-6 sm:py-5 shadow-[0_14px_40px_rgba(201,166,107,0.22)] text-[#141418]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3.5">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-[#141418] border border-[#C9A66B]/60 flex items-center justify-center shrink-0 shadow-md">
                  <Clock className="w-5 h-5 text-[#E5C687]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-600 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
                    </span>
                    <span className="text-[10px] font-heading font-bold uppercase tracking-[0.18em] text-[#7A5922]">
                      Current Date &amp; Time (Nairobi / EAT)
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 min-h-[26px]">
                    {now ? (
                      <>
                        <span className="text-sm sm:text-[16px] font-semibold text-[#141418]">
                          {eatDateText}
                        </span>
                        <span className="text-[#141418]/30 hidden sm:inline">&bull;</span>
                        <span className="font-mono text-sm sm:text-[16px] font-bold text-[#6E4D14] tabular-nums">
                          {eatTimeText} EAT
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-[#141418]/60 font-mono">Syncing live clock...</span>
                    )}
                  </div>
                </div>
              </div>

              {!isSelectedEat && now ? (
                <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-[#141418]/15 pt-2.5 sm:pt-0 sm:pl-4 shrink-0">
                  <div className="flex items-center sm:justify-end gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A5922]">
                    <Globe className="w-3 h-3 text-[#7A5922]" />
                    <span>Your Selected Time ({selectedTzShort})</span>
                  </div>
                  <p className="font-mono text-xs sm:text-[13px] text-[#141418] font-bold tabular-nums mt-0.5">
                    {selectedTzDateText} &bull; {selectedTzTimeText}
                  </p>
                  <p className="text-[10px] text-[#141418]/65 truncate max-w-[200px] sm:ml-auto">
                    {selectedTimeZone.replace(/_/g, " ")}
                  </p>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141418] text-[11px] font-mono font-semibold text-[#E5C687] shrink-0 shadow-sm">
                  <Globe className="w-3.5 h-3.5 text-[#C9A66B]" />
                  <span>UTC+3</span>
                </div>
              )}
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 mb-6">
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
            <div className="rounded-[22px] bg-[#0D0F18]/90 border border-white/10 backdrop-blur-xl shadow-2xl overflow-hidden">
              {/* Distinctive Warm Header Strip for Select Date & Time + Timezone */}
              <div className="bg-gradient-to-r from-[#272016] via-[#312719] to-[#231D14] border-b border-[#C9A66B]/40 px-5 py-4 sm:px-7 sm:py-5 space-y-3.5">
                <h2 className="text-sm font-heading uppercase tracking-wider text-[#FAF4E8] font-semibold flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#E5C687] shrink-0" />
                  <span>Select Date &amp; Time (Wed, Fri, Sun &bull; 8am - 9pm EAT)</span>
                </h2>

                {/* Timezone Selector Dropdown */}
                <div className="space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <label
                      htmlFor="booking-timezone"
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#E5C687] shrink-0"
                    >
                      <Globe className="w-3.5 h-3.5 text-[#E5C687]" />
                      <span>Your Timezone:</span>
                    </label>
                    <div className="relative flex-1">
                      <select
                        id="booking-timezone"
                        value={selectedTimeZone}
                        onChange={(e) => setSelectedTimeZone(e.target.value)}
                        className="w-full appearance-none bg-[#FBF6EC] border-2 border-[#C9A66B] rounded-xl pl-3.5 pr-11 py-2.5 text-xs font-bold text-[#141418] focus:outline-none focus:ring-2 focus:ring-[#C9A66B]/60 cursor-pointer shadow-sm"
                      >
                        {timeZoneOptions.map((tz) => (
                          <option key={tz.value} value={tz.value} className="bg-[#FBF6EC] text-[#141418]">
                            {tz.label}
                          </option>
                        ))}
                      </select>
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg bg-[#141418] text-[#E5C687] flex items-center justify-center shadow-sm"
                      >
                        <ChevronDown className="w-4 h-4" strokeWidth={2.8} />
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#FAF4E8]/70 sm:text-right">
                    Select your timezone to view every available slot in your exact local time.
                  </p>
                </div>
              </div>

              {/* Available Days & Time Slots (Classic Dark Obsidian Background) */}
              <div className="p-5 sm:p-7">
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
                      Available Days (Nairobi Schedule: Wed, Fri, Sun)
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
                            className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
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
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <label className="block text-[11px] uppercase tracking-wider text-white/50">
                          Available Times (24h notice &bull; 30m buffer)
                        </label>
                        <span className="text-[10px] font-mono text-[#C9A66B]">
                          Shown in {selectedTzShort}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {selectedDayObj.slots.map((slot) => {
                          const isSelected = selectedTime === slot.time
                          const converted = formatSlotInTimeZone(
                            selectedDayObj.value,
                            slot.time,
                            selectedTimeZone
                          )
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
                                  ? "bg-[#C9A66B] text-[#07070B] border-[#C9A66B] font-bold cursor-pointer"
                                  : "bg-white/[0.03] border-white/10 text-white/90 hover:border-[#C9A66B]/40 cursor-pointer"
                              }`}
                            >
                              <span className="block">{converted.timeLabel}</span>
                              {!isSelectedEat && (
                                <span
                                  className={`block text-[10px] mt-0.5 ${
                                    isSelected ? "text-[#07070B]/75" : "text-white/45"
                                  }`}
                                >
                                  {converted.dayOffsetLabel
                                    ? `${converted.dayOffsetLabel} • ${slot.time} EAT`
                                    : `${slot.time} EAT`}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>

                      {selectedTime && !isSelectedEat && selectedConvertedSlot && (
                        <div className="mt-3 px-3.5 py-2 rounded-xl bg-[#C9A66B]/10 border border-[#C9A66B]/25 text-[11px] text-[#F9F7F6]/90">
                          Selected:{" "}
                          <strong className="text-[#C9A66B]">
                            {selectedConvertedSlot.dateLabel} at {selectedConvertedSlot.timeLabel}{" "}
                            {selectedConvertedSlot.tzShort}
                          </strong>{" "}
                          <span className="text-white/55">
                            ({selectedDayObj.label} at {selectedTime} EAT)
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Continue Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!selectedDate || !selectedTime}
                      onClick={handleProceedToStep2}
                      className="w-full py-3.5 rounded-xl bg-[#C9A66B] text-[#07070B] font-heading font-semibold text-xs tracking-wide hover:bg-[#b59357] transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
              </div>
            </div>
          )}

          {/* STEP 2: STRATEGY INTAKE FORM */}
          {step === 2 && (
            <div className="rounded-[22px] bg-[#0D0F18]/80 border border-white/10 backdrop-blur-xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                <span className="text-xs text-[#C9A66B] font-medium">
                  {formattedSelectedSummary}
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

          {/* STEP 3: VERIFIED PAYMENT (M-Pesa Express + Card via Paystack) */}
          {step === 3 && (
            <div className="rounded-[22px] bg-[#0D0F18]/80 border border-white/10 backdrop-blur-xl p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-xs text-white/60">Pay for 60-min Strategy Session:</span>
                  <p className="text-sm font-semibold text-[#C9A66B] font-mono">
                    {CONSULTATION_PRICE_DISPLAY}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={mpesaPhase === "sending" || mpesaPhase === "waiting" || cardLoading || verifyingPaystackReturn}
                  onClick={() => {
                    stopPolling()
                    setMpesaPhase("idle")
                    setMpesaError("")
                    setCardError("")
                    setStep(2)
                  }}
                  className="text-xs text-white/50 hover:text-white flex items-center gap-1 disabled:opacity-40"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>
              </div>

              {verifyingPaystackReturn ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#C9A66B]" />
                  <p className="text-sm font-semibold text-white">Verifying your Card payment...</p>
                  <p className="text-xs text-white/60">
                    Confirming with Paystack and generating your Google Meet session link.
                  </p>
                </div>
              ) : (
                <>
                  {/* Payment Method Selector */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      disabled={mpesaPhase === "sending" || mpesaPhase === "waiting" || cardLoading}
                      onClick={() => {
                        setPaymentMethod("mpesa")
                        setCardError("")
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        paymentMethod === "mpesa"
                          ? "bg-emerald-500/15 border-emerald-400/70 text-white shadow-[0_0_20px_rgba(16,185,129,0.12)]"
                          : "bg-white/[0.02] border-white/10 text-white/65 hover:border-white/25"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-heading font-semibold uppercase tracking-wider">
                          M-Pesa
                        </span>
                      </div>
                      <p className="text-[11px] text-white/60">Instant STK Push (Kenya)</p>
                    </button>

                    <button
                      type="button"
                      disabled={mpesaPhase === "sending" || mpesaPhase === "waiting" || cardLoading}
                      onClick={() => {
                        stopPolling()
                        setMpesaPhase("idle")
                        setMpesaError("")
                        setPaymentMethod("card")
                      }}
                      className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                        paymentMethod === "card"
                          ? "bg-[#C9A66B]/15 border-[#C9A66B] text-white shadow-[0_0_20px_rgba(201,166,107,0.18)]"
                          : "bg-white/[0.02] border-white/10 text-white/65 hover:border-white/25"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-4 h-4 text-[#C9A66B]" />
                        <span className="text-xs font-heading font-semibold uppercase tracking-wider">
                          Card
                        </span>
                      </div>
                      <p className="text-[11px] text-white/60">Visa, Mastercard &bull; Global</p>
                    </button>
                  </div>

                  {/* OPTION 1: M-PESA EXPRESS (SAFARICOM DARAJA) */}
                  {paymentMethod === "mpesa" && (
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

                      {mpesaPhase === "failed" && mpesaError && (
                        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-400/40 flex items-start gap-2.5 text-red-200 text-xs">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-300">Payment not confirmed</p>
                            <p className="text-red-200/80 mt-0.5">{mpesaError}</p>
                          </div>
                        </div>
                      )}

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
                  )}

                  {/* OPTION 2: CARD CHECKOUT (PAYSTACK — LOCAL & INTERNATIONAL CARDS) */}
                  {paymentMethod === "card" && (
                    <div className="p-4 sm:p-5 rounded-xl bg-white/[0.02] border border-[#C9A66B]/45 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#C9A66B]" />
                          <span className="text-xs font-heading font-semibold uppercase tracking-wider text-[#E5C687]">
                            Card Checkout (Visa / Mastercard / Apple Pay)
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#C9A66B]">
                          <ShieldCheck className="w-3.5 h-3.5" /> Secured by Paystack
                        </span>
                      </div>

                      <p className="text-xs text-white/75 leading-relaxed">
                        Pay securely using any Kenyan or International debit/credit card (Visa, Mastercard,
                        or Apple Pay) for{" "}
                        <strong className="text-white">{CONSULTATION_PRICE_DISPLAY}</strong>. You will
                        return here automatically with your confirmed Google Meet link immediately after
                        payment.
                      </p>

                      <div className="p-3 rounded-xl bg-black/35 border border-white/10 text-[11px] text-white/70 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-white/50">Billed Amount:</span>
                          <span className="font-mono text-[#E5C687] font-semibold">
                            {CONSULTATION_PRICE_KES_FORMATTED} (~${CONSULTATION_PRICE_USD} USD)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/50">Receipt Email:</span>
                          <span className="text-white truncate max-w-[220px]">{email}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={cardLoading}
                        onClick={handlePayWithCard}
                        className="w-full py-3.5 rounded-xl bg-[#C9A66B] hover:bg-[#d8b77c] text-[#07070B] font-heading font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(201,166,107,0.28)] disabled:opacity-45 cursor-pointer"
                      >
                        {cardLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Opening Secure Card Checkout...
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            Pay {CONSULTATION_PRICE_KES_FORMATTED} with Card
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      {cardError && (
                        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-400/40 flex items-start gap-2.5 text-red-200 text-xs">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-medium text-red-300">Card checkout notice</p>
                            <p className="text-red-200/80 mt-0.5">{cardError}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
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
                  {confirmedMethodLabel} payment verified and your appointment has been added to Google Calendar.
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
                  <span className="text-[#C9A66B] font-semibold text-right">
                    {formattedSelectedSummary}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-white/50">Client:</span>
                  <span className="text-white">{fullName}</span>
                </div>
                {mpesaReceipt && (
                  <div className="flex justify-between gap-2">
                    <span className="text-white/50">
                      {confirmedMethodLabel === "Card" ? "Payment Reference:" : "M-Pesa Receipt:"}
                    </span>
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
