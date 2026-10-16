"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, Video, ShieldCheck, ArrowRight } from "lucide-react"
import Link from "next/link"

interface BookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BookingModal({ open, onOpenChange }: BookingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#0D0F18]/95 backdrop-blur-2xl sm:max-w-md text-white">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-[#C9A66B]/15 border border-[#C9A66B]/30 flex items-center justify-center text-[#C9A66B] mb-2 mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-heading text-center text-white font-light">
            1-on-1 AI Strategy & Architecture Call
          </DialogTitle>
          <DialogDescription className="text-center text-xs text-white/60">
            Private 60-minute consultation with Cillah.dev to design custom AI agents, CRM routing, and automated workflows.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 text-xs">
            <div className="flex items-center justify-between text-white/80">
              <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#C9A66B]" /> Duration</span>
              <span className="font-semibold text-white">60 Minutes</span>
            </div>
            <div className="flex items-center justify-between text-white/80">
              <span className="flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-[#C9A66B]" /> Platform</span>
              <span className="font-semibold text-white">Google Meet</span>
            </div>
            <div className="flex items-center justify-between text-white/80">
              <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-[#C9A66B]" /> Availability</span>
              <span className="font-semibold text-[#C9A66B]">Wed, Fri, Sun (8am - 9pm EAT)</span>
            </div>
            <div className="flex items-center justify-between text-white/80 pt-1 border-t border-white/5">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#C9A66B]" /> Investment</span>
              <span className="font-semibold text-white font-mono text-sm">KES 5,000 / $40 USD</span>
            </div>
          </div>

          <Link
            href="/book-consultation"
            onClick={() => onOpenChange(false)}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#C9A66B] text-[#07070B] font-heading font-semibold text-xs tracking-wide hover:bg-[#b59357] transition-all shadow-[0_0_20px_rgba(201,166,107,0.3)] text-center"
          >
            <span>Proceed to Calendar & Booking</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
