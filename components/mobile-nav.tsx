"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { SITE, DELIVERABLES } from "@/lib/constants"
import { Zap } from "lucide-react"

interface MobileNavProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOpenBooking: () => void
}

export function MobileNav({
  open,
  onOpenChange,
  onOpenBooking,
}: MobileNavProps) {
  function navigate(href: string) {
    onOpenChange(false)
    window.location.href = href
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="border-white/5 bg-[var(--primary-bg)] text-white">
        <SheetHeader className="mb-8">
          <SheetTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-[var(--primary-accent)]" />
            {SITE.name}
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-3 rounded-xl px-4 py-4 text-left text-lg font-bold text-white transition-colors hover:bg-white/5"
          >
            System
          </button>

          <div className="py-2 px-4 border-b border-white/5 mb-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Deliverables</p>
            <div className="flex flex-col gap-2">
              {DELIVERABLES.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.link)}
                  className="text-left py-2 text-white/70 hover:text-white transition-colors"
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => navigate("/how-it-works")}
            className="rounded-xl px-4 py-4 text-left text-lg font-bold text-white transition-colors hover:bg-white/5"
          >
            How It Works
          </button>
          
          <button
            onClick={() => navigate("/pricing")}
            className="rounded-xl px-4 py-4 text-left text-lg font-bold text-white transition-colors hover:bg-white/5"
          >
            Pricing
          </button>

          <div className="mt-8">
            <Button
              onClick={() => {
                onOpenChange(false)
                onOpenBooking()
              }}
              className="w-full h-14 bg-[var(--primary-accent)] hover:bg-[var(--secondary-accent)] text-white font-bold"
            >
              {SITE.cta}
            </Button>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
