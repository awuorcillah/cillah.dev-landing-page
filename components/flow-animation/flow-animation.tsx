"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Scene1Inquiries } from "./scene-1-inquiries"

export type FlowScene = 1 | 2 | 3

export function FlowAnimation() {
  const rootRef = useRef<HTMLDivElement>(null)

  // Parent scene state prepared for Scene 2 and Scene 3
  const [currentScene, setCurrentScene] = useState<FlowScene>(1)
  const [hasEnteredView, setHasEnteredView] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [playNonce, setPlayNonce] = useState(0)
  const [hasCompleted, setHasCompleted] = useState(false)

  // Respect prefers-reduced-motion: show final frame immediately with no motion or timers
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => {
      const prefersReduced = mq.matches
      setReducedMotion(prefersReduced)
      if (prefersReduced) {
        setHasCompleted(true)
      }
    }
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  // Start playing once when the section scrolls into view
  useEffect(() => {
    if (typeof window === "undefined") return
    const node = rootRef.current
    if (!node) return

    if (typeof IntersectionObserver === "undefined") {
      setHasEnteredView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHasEnteredView(true)
            observer.disconnect()
            break
          }
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const handleScene1Complete = useCallback(() => {
    setHasCompleted(true)
  }, [])

  const handleReplay = () => {
    if (reducedMotion) return
    setCurrentScene(1)
    setHasCompleted(false)
    setHasEnteredView(true)
    setPlayNonce((prev) => prev + 1)
  }

  return (
    <div ref={rootRef} className="w-full">
      {/* Visually hidden summary for screen readers and search engines */}
      <p className="sr-only">
        Customers message a real estate agency on WhatsApp, Instagram, Facebook, TikTok and LinkedIn. An AI assistant answers, collects their name and assigns each lead to a sales agent.
      </p>

      {/* Animated stage hidden from assistive tech so screen readers get the clean summary above */}
      <div aria-hidden="true" className="w-full">
        {currentScene === 1 && (
          <Scene1Inquiries
            shouldPlay={hasEnteredView}
            reducedMotion={reducedMotion}
            playNonce={playNonce}
            onComplete={handleScene1Complete}
          />
        )}
      </div>

      {/* Subtle footer metadata + Replay control */}
      <div className="mt-5 flex items-center justify-between gap-4 max-w-xl lg:max-w-none mx-auto px-1">
        <span className="text-[12px] text-[#F9F7F6]/45 font-sans tracking-wide">
          Sample conversations, fictional data
        </span>

        {!reducedMotion && (
          <button
            type="button"
            onClick={handleReplay}
            className={`text-[12px] font-heading font-medium tracking-wide transition-opacity duration-300 cursor-pointer ${
              hasCompleted
                ? "text-[#C9A66B] hover:text-[#F9F7F6] opacity-100"
                : "text-[#C9A66B]/60 hover:text-[#C9A66B] opacity-75"
            }`}
          >
            Replay
          </button>
        )}
      </div>
    </div>
  )
}
