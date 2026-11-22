"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Scene1Inquiries } from "./scene-1-inquiries"
import { Scene2Building } from "./scene-2-building"

export type FlowScene = 1 | 2 | 3

export function FlowAnimation() {
  const rootRef = useRef<HTMLDivElement>(null)
  const transitionTimerRef = useRef<number | null>(null)

  // Parent scene state prepared for Scene 1, Scene 2, and upcoming Scene 3
  const [currentScene, setCurrentScene] = useState<FlowScene>(1)
  const [hasEnteredView, setHasEnteredView] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [forceFinalFrame, setForceFinalFrame] = useState(false)
  const [playNonce, setPlayNonce] = useState(0)
  const [sequenceCompleted, setSequenceCompleted] = useState(false)

  const clearTransitionTimer = useCallback(() => {
    if (transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = null
    }
  }, [])

  // Clean up transition timer on unmount
  useEffect(() => {
    return () => {
      clearTransitionTimer()
    }
  }, [clearTransitionTimer])

  // Respect prefers-reduced-motion: show final frame immediately with no motion or timers
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const apply = () => {
      const prefersReduced = mq.matches
      setReducedMotion(prefersReduced)
      if (prefersReduced) {
        clearTransitionTimer()
        setSequenceCompleted(true)
      }
    }
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [clearTransitionTimer])

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
    if (reducedMotion || forceFinalFrame) return
    clearTransitionTimer()
    // Brief hold on Scene 1's completed frame, then zoom into Scene 2
    transitionTimerRef.current = window.setTimeout(() => {
      transitionTimerRef.current = null
      setCurrentScene(2)
    }, 900)
  }, [reducedMotion, forceFinalFrame, clearTransitionTimer])

  const handleScene2Complete = useCallback(() => {
    setSequenceCompleted(true)
  }, [])

  const handleSelectSceneDot = (scene: FlowScene) => {
    if (scene === 3) return
    clearTransitionTimer()
    setForceFinalFrame(true)
    setCurrentScene(scene)
    setSequenceCompleted(true)
  }

  const handleReplay = () => {
    if (reducedMotion) return
    clearTransitionTimer()
    setForceFinalFrame(false)
    setSequenceCompleted(false)
    setCurrentScene(1)
    setHasEnteredView(true)
    setPlayNonce((prev) => prev + 1)
  }

  return (
    <div ref={rootRef} className="w-full">
      {/* Visually hidden summary for screen readers and search engines */}
      <p className="sr-only">
        Customers message a real estate agency on WhatsApp, Instagram, Facebook, TikTok and LinkedIn. An AI assistant answers, collects their name and assigns each lead to a sales agent. All inquiries and website form submissions flow into one private backend, where each lead is assigned to a sales agent.
      </p>

      {/* Fixed-height animated stage per breakpoint so switching scenes never causes layout jump */}
      <div
        aria-hidden="true"
        className="w-full h-[860px] sm:h-[820px] lg:h-[560px] flex items-center justify-center overflow-hidden"
      >
        {reducedMotion ? (
          <div className="w-full">
            {currentScene === 1 && (
              <Scene1Inquiries
                shouldPlay={true}
                reducedMotion={true}
                forceFinalFrame={true}
                playNonce={playNonce}
                onComplete={handleScene1Complete}
              />
            )}
            {currentScene === 2 && (
              <Scene2Building
                shouldPlay={true}
                reducedMotion={true}
                forceFinalFrame={true}
                playNonce={playNonce}
                onComplete={handleScene2Complete}
              />
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {currentScene === 1 && (
              <motion.div
                key={`scene-1-${playNonce}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
              >
                <Scene1Inquiries
                  shouldPlay={hasEnteredView}
                  reducedMotion={false}
                  forceFinalFrame={forceFinalFrame}
                  playNonce={playNonce}
                  onComplete={handleScene1Complete}
                />
              </motion.div>
            )}
            {currentScene === 2 && (
              <motion.div
                key={`scene-2-${playNonce}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
              >
                <Scene2Building
                  shouldPlay={hasEnteredView}
                  reducedMotion={false}
                  forceFinalFrame={forceFinalFrame}
                  playNonce={playNonce}
                  onComplete={handleScene2Complete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Progress dots (3 scenes; Scene 3 disabled until implemented) */}
      <div className="mt-4 flex items-center justify-center gap-3">
        {([1, 2, 3] as FlowScene[]).map((scene) => {
          const isDisabled = scene === 3
          const isActive = currentScene === scene
          return (
            <button
              key={scene}
              type="button"
              disabled={isDisabled}
              onClick={() => handleSelectSceneDot(scene)}
              aria-label={
                isDisabled ? "Scene 3 coming soon" : `Show scene ${scene}`
              }
              aria-current={isActive ? "step" : undefined}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                isDisabled
                  ? "w-2.5 bg-white/15 cursor-not-allowed"
                  : isActive
                  ? "w-6 bg-[#C9A66B] cursor-pointer"
                  : "w-2.5 bg-[#F9F7F6]/30 hover:bg-[#F9F7F6]/60 cursor-pointer"
              }`}
            />
          )
        })}
      </div>

      {/* Subtle footer metadata + Replay control */}
      <div className="mt-4 flex items-center justify-between gap-4 max-w-xl lg:max-w-none mx-auto px-1">
        <span className="text-[12px] text-[#F9F7F6]/45 font-sans tracking-wide">
          Sample data, fictional
        </span>

        {!reducedMotion && (
          <button
            type="button"
            onClick={handleReplay}
            className={`text-[12px] font-heading font-medium tracking-wide transition-opacity duration-300 cursor-pointer ${
              sequenceCompleted
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
