"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Scene1Inquiries } from "./scene-1-inquiries"
import { Scene2Building } from "./scene-2-building"
import { Scene3Pipelines } from "./scene-3-pipelines"

export type FlowScene = 1 | 2 | 3

export function FlowAnimation() {
  const rootRef = useRef<HTMLDivElement>(null)
  const transitionTimerRef = useRef<number | null>(null)

  const [currentScene, setCurrentScene] = useState<FlowScene>(1)
  const [isInView, setIsInView] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [playNonce, setPlayNonce] = useState(0)

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
      }
    }
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [clearTransitionTimer])

  // Play automatically whenever the section is in view; pause when scrolled off screen
  useEffect(() => {
    if (typeof window === "undefined") return
    const node = rootRef.current
    if (!node) return

    if (typeof IntersectionObserver === "undefined") {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return
        if (entry.isIntersecting) {
          setIsInView(true)
        } else {
          setIsInView(false)
          clearTransitionTimer()
        }
      },
      { threshold: 0.05 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [clearTransitionTimer])

  const handleScene1Complete = useCallback(() => {
    if (reducedMotion || !isInView) return
    clearTransitionTimer()
    transitionTimerRef.current = window.setTimeout(() => {
      transitionTimerRef.current = null
      setCurrentScene(2)
    }, 900)
  }, [reducedMotion, isInView, clearTransitionTimer])

  const handleScene2Complete = useCallback(() => {
    if (reducedMotion || !isInView) return
    clearTransitionTimer()
    transitionTimerRef.current = window.setTimeout(() => {
      transitionTimerRef.current = null
      setCurrentScene(3)
    }, 900)
  }, [reducedMotion, isInView, clearTransitionTimer])

  const handleScene3Complete = useCallback(() => {
    if (reducedMotion || !isInView) return
    clearTransitionTimer()
    // Hold briefly on the completed closing frame, then automatically loop back to Scene 1
    transitionTimerRef.current = window.setTimeout(() => {
      transitionTimerRef.current = null
      setCurrentScene(1)
      setPlayNonce((prev) => prev + 1)
    }, 2200)
  }, [reducedMotion, isInView, clearTransitionTimer])

  const handleSelectSceneDot = (scene: FlowScene) => {
    clearTransitionTimer()
    setCurrentScene(scene)
    if (!reducedMotion) {
      setIsInView(true)
      setPlayNonce((prev) => prev + 1)
    }
  }

  const handleReplay = () => {
    if (reducedMotion) return
    clearTransitionTimer()
    setCurrentScene(1)
    setIsInView(true)
    setPlayNonce((prev) => prev + 1)
  }

  return (
    <div ref={rootRef} className="w-full">
      {/* Visually hidden summary for screen readers and search engines */}
      <p className="sr-only">
        Customers message a real estate agency on WhatsApp, Instagram, Facebook, TikTok and LinkedIn. An AI assistant answers, collects their name and assigns each lead to a sales agent. All inquiries and website form submissions flow into one private backend, where each lead is assigned to a sales agent. Each lead then lands in the pipeline of its assigned sales agent, who receives notifications for new leads, follow-ups and upcoming viewings.
      </p>

      {/* Fixed-height animated stage per breakpoint; all 3 scenes vertically centred inside */}
      <div
        aria-hidden="true"
        className="w-full h-[820px] sm:h-[800px] lg:h-[620px] flex items-center justify-center overflow-hidden"
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
            {currentScene === 3 && (
              <Scene3Pipelines
                shouldPlay={true}
                reducedMotion={true}
                forceFinalFrame={true}
                playNonce={playNonce}
                onComplete={handleScene3Complete}
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
                  shouldPlay={isInView}
                  reducedMotion={false}
                  forceFinalFrame={false}
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
                  shouldPlay={isInView}
                  reducedMotion={false}
                  forceFinalFrame={false}
                  playNonce={playNonce}
                  onComplete={handleScene2Complete}
                />
              </motion.div>
            )}
            {currentScene === 3 && (
              <motion.div
                key={`scene-3-${playNonce}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full"
              >
                <Scene3Pipelines
                  shouldPlay={isInView}
                  reducedMotion={false}
                  forceFinalFrame={false}
                  playNonce={playNonce}
                  onComplete={handleScene3Complete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Progress dots (all 3 scenes enabled) */}
      <div className="mt-4 flex items-center justify-center gap-3">
        {([1, 2, 3] as FlowScene[]).map((scene) => {
          const isActive = currentScene === scene
          return (
            <button
              key={scene}
              type="button"
              onClick={() => handleSelectSceneDot(scene)}
              aria-label={`Show scene ${scene}`}
              aria-current={isActive ? "step" : undefined}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                isActive
                  ? "w-6 bg-[#C9A66B]"
                  : "w-2.5 bg-[#F9F7F6]/30 hover:bg-[#F9F7F6]/60"
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
            className="text-[12px] font-heading font-medium tracking-wide text-[#C9A66B]/80 hover:text-[#F9F7F6] transition-colors duration-300 cursor-pointer"
          >
            Replay
          </button>
        )}
      </div>
    </div>
  )
}
