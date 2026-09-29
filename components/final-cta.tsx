"use client"

import { Button } from "@/components/ui/button"
import { SectionWrapper } from "@/components/section-wrapper"
import { FINAL_CTA, SITE } from "@/lib/constants"
import { Phone } from "lucide-react"

interface FinalCtaProps {
  onOpenBooking: () => void
}

export function FinalCta({ onOpenBooking }: FinalCtaProps) {
  return (
    <SectionWrapper className="bg-primary/5">
      <div className="text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {FINAL_CTA.headline}
        </h2>
        <div className="mt-8">
          <Button
            onClick={onOpenBooking}
            size="lg"
            className="rounded-2xl px-8 py-4 text-base font-semibold transition-transform hover:scale-[1.03]"
          >
            {FINAL_CTA.cta}
          </Button>
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          {"Or call us directly: "}
          <a
            href={`tel:${SITE.phone}`}
            className="inline-flex items-center gap-1.5 font-medium text-primary transition-colors hover:text-primary/80"
          >
            <Phone className="h-3.5 w-3.5" />
            {SITE.phone}
          </a>
        </p>
      </div>
    </SectionWrapper>
  )
}
