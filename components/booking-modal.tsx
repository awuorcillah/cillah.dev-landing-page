"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BOOKING_MODAL, SITE } from "@/lib/constants"
import { trackEvent, trackMetaEvent } from "@/lib/analytics"

interface BookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BookingModal({ open, onOpenChange }: BookingModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [submitting, setSubmitting] = useState(false)

  const [fullName, setFullName] = useState("")
  const [agencyName, setAgencyName] = useState("")
  const [countryCode, setCountryCode] = useState("+254")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [monthlyVolume, setMonthlyVolume] = useState("")
  const [platforms, setPlatforms] = useState<string[]>([])
  const [biggestProblem, setBiggestProblem] = useState("")

  const calendlyUrl =
    process.env.NEXT_PUBLIC_CALENDLY_URL || SITE.calendarUrl

  function togglePlatform(value: string) {
    setPlatforms((prev) =>
      prev.includes(value)
        ? prev.filter((p) => p !== value)
        : [...prev, value]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          agencyName,
          phone: `${countryCode}${phoneNumber}`,
          monthlyVolume,
          platforms,
          biggestProblem,
        }),
      })

      trackEvent("form_submit", {
        monthly_volume: monthlyVolume,
        platforms_count: String(platforms.length),
      })
      trackMetaEvent("Lead")

      setStep(2)
    } catch {
      // Proceed to calendly even on failure
      setStep(2)
    } finally {
      setSubmitting(false)
    }
  }

  function handleOpenChange(isOpen: boolean) {
    onOpenChange(isOpen)
    if (!isOpen) {
      // Reset on close
      setTimeout(() => {
        setStep(1)
        setFullName("")
        setAgencyName("")
        setCountryCode("+254")
        setPhoneNumber("")
        setMonthlyVolume("")
        setPlatforms([])
        setBiggestProblem("")
      }, 200)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {BOOKING_MODAL.title}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? BOOKING_MODAL.description
              : "Select a time that works best for you."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="fullName" className="text-foreground">
                Full Name
              </Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="John Doe"
                className="rounded-xl border-border bg-secondary text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="agencyName" className="text-foreground">
                Agency Name
              </Label>
              <Input
                id="agencyName"
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                required
                placeholder="Acme Properties"
                className="rounded-xl border-border bg-secondary text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="phone" className="text-foreground">
                Phone Number
              </Label>
              <div className="flex gap-2">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger
                    className="w-[100px] shrink-0 rounded-xl border-border bg-secondary text-foreground"
                    aria-label="Country code"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 border-border bg-card">
                    <SelectItem value="+254" className="text-foreground">+254</SelectItem>
                    <SelectItem value="+1" className="text-foreground">+1</SelectItem>
                    <SelectItem value="+44" className="text-foreground">+44</SelectItem>
                    <SelectItem value="+971" className="text-foreground">+971</SelectItem>
                    <SelectItem value="+27" className="text-foreground">+27</SelectItem>
                    <SelectItem value="+234" className="text-foreground">+234</SelectItem>
                    <SelectItem value="+255" className="text-foreground">+255</SelectItem>
                    <SelectItem value="+256" className="text-foreground">+256</SelectItem>
                    <SelectItem value="+91" className="text-foreground">+91</SelectItem>
                    <SelectItem value="+61" className="text-foreground">+61</SelectItem>
                    <SelectItem value="+86" className="text-foreground">+86</SelectItem>
                    <SelectItem value="+33" className="text-foreground">+33</SelectItem>
                    <SelectItem value="+49" className="text-foreground">+49</SelectItem>
                    <SelectItem value="+966" className="text-foreground">+966</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(e.target.value.replace(/[^0-9]/g, ""))
                  }
                  required
                  placeholder="794357912"
                  className="flex-1 rounded-xl border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="volume" className="text-foreground">
                Monthly Inquiry Volume
              </Label>
              <Select value={monthlyVolume} onValueChange={setMonthlyVolume} required>
                <SelectTrigger
                  id="volume"
                  className="rounded-xl border-border bg-secondary text-foreground"
                >
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {BOOKING_MODAL.volumeOptions.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      className="text-foreground"
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-foreground">Platforms Used</Label>
              <div className="flex flex-wrap gap-4">
                {BOOKING_MODAL.platformOptions.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 text-sm text-foreground"
                  >
                    <Checkbox
                      checked={platforms.includes(opt.value)}
                      onCheckedChange={() => togglePlatform(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="problem" className="text-foreground">
                Biggest Lead Handling Problem{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="problem"
                value={biggestProblem}
                onChange={(e) => setBiggestProblem(e.target.value.slice(0, 200))}
                placeholder="e.g. We lose leads on weekends..."
                maxLength={200}
                className="rounded-xl border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                rows={3}
              />
              <p className="text-right text-xs text-muted-foreground">
                {biggestProblem.length}/200
              </p>
            </div>

            <Button
              type="submit"
              disabled={submitting || !fullName || !agencyName || !phoneNumber || !monthlyVolume}
              className="mt-2 w-full rounded-2xl py-3 font-semibold transition-transform hover:scale-[1.03]"
            >
              {submitting ? "Submitting..." : BOOKING_MODAL.submitText}
            </Button>
          </form>
        ) : (
          <div className="flex flex-col items-center">
            {calendlyUrl ? (
              <iframe
                src={calendlyUrl}
                width="100%"
                height="630"
                frameBorder="0"
                title="Schedule your automation audit"
                className="rounded-xl"
              />
            ) : (
              <div className="flex flex-col items-center gap-4 py-12 text-center">
                <p className="text-lg font-semibold text-foreground">
                  Booking calendar coming soon.
                </p>
                <p className="text-sm text-muted-foreground">
                  {"Email us at "}
                  <a
                    href={`mailto:${SITE.contactEmail}`}
                    className="text-primary underline"
                  >
                    {SITE.contactEmail}
                  </a>
                  {" or call "}
                  <a
                    href={`tel:${SITE.phone}`}
                    className="text-primary underline"
                  >
                    {SITE.phone}
                  </a>
                  {" to schedule your audit."}
                </p>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
