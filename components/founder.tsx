"use client"

import Image from "next/image"
import { Linkedin, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SectionWrapper } from "@/components/section-wrapper"
import { FOUNDER, HERO, SITE } from "@/lib/constants"

interface FounderProps {
  onOpenBooking: () => void
}

export function Founder({ onOpenBooking }: FounderProps) {
  return (
    <SectionWrapper id="founder">
      <h2 className="text-balance text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {FOUNDER.sectionTitle}
      </h2>

      <div className="mt-12 flex flex-col items-center gap-8 md:flex-row md:gap-12">
        {/* Image */}
        <div className="relative h-64 w-64 shrink-0 overflow-hidden rounded-2xl md:h-72 md:w-72">
          <Image
            src="/images/founder.png"
            alt={`${FOUNDER.name}, ${FOUNDER.title}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 256px, 288px"
          />
        </div>

        {/* Bio */}
        <div className="flex flex-col items-center gap-4 text-center md:items-start md:text-left">
          <h3 className="text-2xl font-bold text-foreground">{FOUNDER.name}</h3>
          <p className="text-base font-medium text-primary">{FOUNDER.title}</p>

          <ul className="flex flex-col gap-2">
            {FOUNDER.bio.map((line, i) => (
              <li
                key={i}
                className="flex items-center gap-2 text-sm leading-relaxed text-muted-foreground"
              >
                <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {line}
              </li>
            ))}
          </ul>

          <div className="mt-2 flex items-center gap-4">
            <Button
              onClick={onOpenBooking}
              className="rounded-2xl px-6 py-3 font-semibold transition-transform hover:scale-[1.03]"
            >
              {HERO.cta}
            </Button>
            <a
              href={SITE.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:text-foreground"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" />
            </a>
            <a
              href={SITE.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
