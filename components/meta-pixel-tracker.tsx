"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export function trackMetaEvent(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string
) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return
  try {
    if (eventId) {
      window.fbq("track", eventName, params || {}, { eventID: eventId })
    } else if (params) {
      window.fbq("track", eventName, params)
    } else {
      window.fbq("track", eventName)
    }
  } catch {
    // Never break UI if ad blocker interferes with fbq
  }
}

/**
 * Fires a Meta Pixel PageView on every client-side App Router navigation
 * (clicks, back/forward, and left/right page swipes). Skips the initial render
 * because the bootstrap script in app/layout.tsx already fired the first PageView.
 */
export function MetaPixelTracker() {
  const pathname = usePathname()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    trackMetaEvent("PageView")
  }, [pathname])

  return null
}
