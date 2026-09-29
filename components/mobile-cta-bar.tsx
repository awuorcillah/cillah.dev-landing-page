"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { HERO } from "@/lib/constants"

interface MobileCtaBarProps {
  onOpenBooking: () => void
}

export function MobileCtaBar({ onOpenBooking }: MobileCtaBarProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.8)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 p-3 backdrop-blur-md md:hidden"
        >
          <Button
            onClick={onOpenBooking}
            className="w-full rounded-2xl py-4 font-semibold transition-transform hover:scale-[1.03]"
          >
            {HERO.cta}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
