"use client"

import { motion } from "framer-motion"
import { Instagram, Facebook, Globe, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatMockup } from "@/components/chat-mockup"
import { HERO } from "@/lib/constants"

interface HeroProps {
  onOpenBooking: () => void
}

const platforms = [
  { icon: Instagram, label: "Instagram" },
  { icon: Facebook, label: "Facebook" },
  { icon: MessageCircle, label: "WhatsApp" },
  { icon: Globe, label: "Website" },
]

export function Hero({ onOpenBooking }: HeroProps) {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden px-4 pb-16 pt-28 md:pt-32">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:gap-16">
        {/* Text */}
        <motion.div
          className="flex-1 text-center lg:text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-balance text-4xl font-bold leading-[1.1] tracking-tight text-foreground md:text-6xl">
            {HERO.headline}
          </h1>
          <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-muted-foreground md:text-xl">
            {HERO.subheadline}
          </p>
          <div className="mt-8">
            <Button
              onClick={onOpenBooking}
              size="lg"
              className="rounded-2xl px-8 py-4 text-base font-semibold transition-transform hover:scale-[1.03]"
            >
              {HERO.ctaPrimary}
            </Button>
          </div>
        </motion.div>

        {/* Chat Mockup */}
        <motion.div
          className="flex flex-1 flex-col items-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ChatMockup />

          {/* Platform Icons */}
          <div className="flex items-center gap-4">
            {platforms.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground"
                title={label}
              >
                <Icon className="h-5 w-5" />
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
