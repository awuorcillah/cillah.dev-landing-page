"use client"

import { Shield } from "lucide-react"
import { SectionWrapper } from "@/components/section-wrapper"
import { GUARANTEE } from "@/lib/constants"

export function Guarantee() {
  return (
    <SectionWrapper id="guarantee">
      <div className="mx-auto max-w-2xl rounded-2xl border-2 border-accent/30 bg-accent/5 p-6 text-center md:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
          <Shield className="h-8 w-8 text-accent" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-foreground md:text-3xl">
          {GUARANTEE.headline}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground md:text-lg">
          {GUARANTEE.copy}
        </p>
      </div>
    </SectionWrapper>
  )
}
