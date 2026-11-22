"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import {
  CHANNEL_META,
  ChannelOutlineIcon,
  type SourceIconId,
} from "./channel-icons"

interface BackendLead {
  id: string
  name: string
  sourceIcon: SourceIconId
  sourceLabel?: string
  agent: "Tom" | "Mary" | "Jane" | "Dan"
}

const CHANNEL_LEADS: BackendLead[] = [
  { id: "grace", name: "Grace", sourceIcon: "whatsapp", agent: "Tom" },
  { id: "njeri", name: "Njeri", sourceIcon: "linkedin", agent: "Mary" },
  { id: "caroline", name: "Caroline", sourceIcon: "instagram", agent: "Jane" },
  { id: "peter", name: "Peter", sourceIcon: "tiktok", agent: "Tom" },
  { id: "kelvin", name: "Kelvin", sourceIcon: "facebook", agent: "Dan" },
]

const WEBSITE_LEAD: BackendLead = {
  id: "brian",
  name: "Brian",
  sourceIcon: "website",
  sourceLabel: "Website form",
  agent: "Mary",
}

const FORM_FIELDS = [
  { key: "name", label: "Name", value: "Brian" },
  { key: "phone", label: "Phone", value: "+254 700 000 006" },
  { key: "lookingFor", label: "Looking for", value: "3-bed in Lavington" },
] as const

export interface Scene2BuildingProps {
  shouldPlay: boolean
  reducedMotion: boolean
  forceFinalFrame?: boolean
  playNonce: number
  onComplete: () => void
}

export function Scene2Building({
  shouldPlay,
  reducedMotion,
  forceFinalFrame = false,
  playNonce,
  onComplete,
}: Scene2BuildingProps) {
  const timersRef = useRef<number[]>([])
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const instantFinal = reducedMotion || forceFinalFrame

  // Track lg (1024px) breakpoint so timers clean up cleanly on breakpoint cross
  const [isDesktop, setIsDesktop] = useState(false)

  // Animation states
  const [activeLinesCount, setActiveLinesCount] = useState<number>(instantFinal ? 5 : 0)
  const [visibleLeadsCount, setVisibleLeadsCount] = useState<number>(instantFinal ? 6 : 0)
  const [filledFieldsCount, setFilledFieldsCount] = useState<number>(instantFinal ? 3 : 0)
  const [submitPulsing, setSubmitPulsing] = useState<boolean>(false)
  const [dotTraveling, setDotTraveling] = useState<boolean>(false)
  const [formSubmitted, setFormSubmitted] = useState<boolean>(instantFinal)

  const clearAllTimers = () => {
    for (const id of timersRef.current) {
      window.clearTimeout(id)
    }
    timersRef.current = []
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(min-width: 1024px)")
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  useEffect(() => {
    return () => {
      clearAllTimers()
    }
  }, [])

  useEffect(() => {
    clearAllTimers()

    if (instantFinal) {
      setActiveLinesCount(5)
      setVisibleLeadsCount(6)
      setFilledFieldsCount(3)
      setSubmitPulsing(false)
      setDotTraveling(false)
      setFormSubmitted(true)
      onCompleteRef.current()
      return
    }

    if (!shouldPlay) {
      setActiveLinesCount(0)
      setVisibleLeadsCount(0)
      setFilledFieldsCount(0)
      setSubmitPulsing(false)
      setDotTraveling(false)
      setFormSubmitted(false)
      return
    }

    // Reset before playback
    setActiveLinesCount(0)
    setVisibleLeadsCount(0)
    setFilledFieldsCount(0)
    setSubmitPulsing(false)
    setDotTraveling(false)
    setFormSubmitted(false)

    const schedule = (fn: () => void, delayMs: number) => {
      const id = window.setTimeout(fn, delayMs)
      timersRef.current.push(id)
    }

    // Step 1 & 2: 5 channel lines flow in and add Grace, Njeri, Caroline, Peter, Kelvin
    for (let i = 0; i < 5; i++) {
      const lineStart = 350 + i * 700
      const rowArrive = lineStart + 350
      schedule(() => setActiveLinesCount(i + 1), lineStart)
      schedule(() => setVisibleLeadsCount(i + 1), rowArrive)
    }

    // Step 3: Frontend website form fills one field at a time, Submit pulses, dot travels, Brian arrives
    schedule(() => setFilledFieldsCount(1), 4100)
    schedule(() => setFilledFieldsCount(2), 4850)
    schedule(() => setFilledFieldsCount(3), 5600)

    schedule(() => {
      setSubmitPulsing(true)
      setFormSubmitted(true)
    }, 6350)

    schedule(() => {
      setSubmitPulsing(false)
      setDotTraveling(true)
    }, 6750)

    schedule(() => {
      setDotTraveling(false)
      setVisibleLeadsCount(6)
    }, 7400)

    // Step 4: Rest on final frame (~7.9s total)
    schedule(() => {
      onCompleteRef.current()
    }, 7900)

    return () => {
      clearAllTimers()
    }
  }, [shouldPlay, instantFinal, playNonce, isDesktop])

  const allLeads: BackendLead[] = [...CHANNEL_LEADS, WEBSITE_LEAD]
  const visibleLeads = allLeads.slice(0, visibleLeadsCount)

  const renderLeadRow = (lead: BackendLead, index: number) => {
    const rowContent = (
      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-x-2 gap-y-1 rounded-[12px] bg-[#07070B]/80 border border-white/10 px-3 py-2 text-left min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[#C9A66B] shrink-0">
            <ChannelOutlineIcon id={lead.sourceIcon} className="h-4 w-4" />
          </span>
          <span className="font-sans text-[13px] font-medium text-[#F9F7F6] truncate">
            {lead.name}
          </span>
          {lead.sourceLabel && (
            <span className="font-sans text-[12px] text-[#F9F7F6]/60 truncate">
              &bull; {lead.sourceLabel}
            </span>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C9A66B]/10 border border-[#C9A66B]/40 text-[#C9A66B] font-heading font-medium text-[12px] whitespace-nowrap shrink-0">
          Assigned to {lead.agent}
        </span>
      </div>
    )

    if (instantFinal) {
      return <div key={`${lead.id}-${index}`}>{rowContent}</div>
    }

    return (
      <motion.div
        key={`${lead.id}-${playNonce}-${index}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {rowContent}
      </motion.div>
    )
  }

  const renderFrontFace = () => (
    <div className="w-full rounded-[16px] bg-[#1C1C1C] border border-[#C9A66B]/30 p-4 sm:p-5 text-left shadow-[0_18px_45px_rgba(0,0,0,0.5)]">
      {/* Mini website header bar */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3.5 border-b border-white/10">
        <span className="font-heading font-medium text-[12px] uppercase tracking-[0.14em] text-[#C9A66B]">
          Frontend: what your customers see
        </span>
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-white/15" />
          <span className="h-2 w-2 rounded-full bg-[#C9A66B]/60" />
        </div>
      </div>

      {/* Mini website form */}
      <div className="space-y-2.5">
        {FORM_FIELDS.map((field, idx) => {
          const isFilled = filledFieldsCount > idx
          return (
            <div key={field.key}>
              <span className="block font-sans text-[12px] text-[#F9F7F6]/60 mb-1">
                {field.label}
              </span>
              <div
                className={`w-full rounded-[10px] bg-[#07070B]/85 border px-3 py-2 min-h-[38px] flex items-center transition-colors duration-300 ${
                  isFilled ? "border-[#C9A66B]/50" : "border-white/10"
                }`}
              >
                {isFilled ? (
                  instantFinal ? (
                    <span className="font-sans text-[13px] text-[#F9F7F6]">
                      {field.value}
                    </span>
                  ) : (
                    <motion.span
                      key={`${field.key}-${playNonce}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="font-sans text-[13px] text-[#F9F7F6]"
                    >
                      {field.value}
                    </motion.span>
                  )
                ) : (
                  <span className="font-sans text-[13px] text-[#F9F7F6]/25">
                    &mdash;
                  </span>
                )}
              </div>
            </div>
          )
        })}

        <div className="pt-1.5">
          <motion.div
            animate={
              submitPulsing && !instantFinal
                ? { scale: [1, 0.94, 1.04, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.38, ease: "easeInOut" }}
            className={`w-full rounded-[12px] bg-[#C9A66B] text-[#07070B] font-heading font-semibold text-[13px] py-2.5 text-center tracking-wide transition-shadow duration-300 ${
              submitPulsing
                ? "shadow-[0_0_24px_rgba(201,166,107,0.65)]"
                : formSubmitted
                ? "shadow-[0_0_12px_rgba(201,166,107,0.25)]"
                : ""
            }`}
          >
            Submit
          </motion.div>
        </div>
      </div>
    </div>
  )

  const renderBackFace = () => (
    <div className="w-full rounded-[16px] bg-[#1C1C1C] border border-white/10 p-4 sm:p-5 text-left">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3.5 border-b border-white/10">
        <span className="font-heading font-medium text-[12px] uppercase tracking-[0.14em] text-[#C9A66B]">
          Backend: your private office
        </span>
        <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#07070B] border border-[#C9A66B]/35 text-[12px] font-heading font-medium text-[#F9F7F6] shrink-0">
          <span className="text-[#F9F7F6]/70">New leads</span>
          <span className="text-[#C9A66B] font-semibold tabular-nums">
            {visibleLeadsCount}
          </span>
        </span>
      </div>

      <div className="space-y-2 min-h-[268px]">
        {visibleLeads.map((lead, idx) => renderLeadRow(lead, idx))}
      </div>
    </div>
  )

  // Desktop SVG paths from 5 evenly-spaced channel icon centres into the Back face on the right
  const desktopChannelPaths = [
    "M 100 0 C 100 32, 540 16, 540 56",
    "M 300 0 C 300 30, 610 18, 610 56",
    "M 500 0 C 500 28, 680 20, 680 56",
    "M 700 0 C 700 28, 750 24, 750 56",
    "M 900 0 C 900 30, 820 22, 820 56",
  ]

  return (
    <div className="w-full">
      {/* DESKTOP VIEW (>= 1024px): 5 icons across top, gold dotted lines into Back face, offset 2-face building */}
      <div className="hidden lg:block w-full max-w-5xl mx-auto">
        {/* Five Channel Icons Row */}
        <div className="grid grid-cols-5 gap-4">
          {CHANNEL_META.map((channel, idx) => {
            const isActive = activeLinesCount > idx
            return (
              <div key={channel.id} className="flex flex-col items-center gap-1.5">
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center border transition-colors duration-300 ${
                    isActive
                      ? "bg-[#C9A66B]/15 border-[#C9A66B]/65 text-[#C9A66B]"
                      : "bg-[#1C1C1C] border-white/10 text-[#F9F7F6]/70"
                  }`}
                >
                  <ChannelOutlineIcon id={channel.id} className="h-5 w-5" />
                </div>
                <span
                  className={`font-heading text-[12px] font-medium transition-colors duration-300 ${
                    isActive ? "text-[#C9A66B]" : "text-[#F9F7F6]/70"
                  }`}
                >
                  {channel.name}
                </span>
              </div>
            )
          })}
        </div>

        {/* Gold Dotted SVG Flow Lines Into Back Face */}
        <div className="w-full h-14 relative">
          <svg
            viewBox="0 0 1000 56"
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
            aria-hidden="true"
          >
            {desktopChannelPaths.map((d, idx) => {
              const isVisible = activeLinesCount > idx
              if (instantFinal) {
                return (
                  <path
                    key={idx}
                    d={d}
                    fill="none"
                    stroke="#C9A66B"
                    strokeOpacity={0.65}
                    strokeWidth={1.6}
                    strokeDasharray="4 4"
                  />
                )
              }
              return (
                <motion.path
                  key={`${idx}-${playNonce}`}
                  d={d}
                  fill="none"
                  stroke="#C9A66B"
                  strokeOpacity={0.75}
                  strokeWidth={1.6}
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={
                    isVisible
                      ? { pathLength: 1, opacity: 1 }
                      : { pathLength: 0, opacity: 0 }
                  }
                  transition={{ duration: 0.42, ease: "easeOut" }}
                />
              )
            })}
          </svg>
        </div>

        {/* Two-Face Building (Front face forward-left, Back face offset behind-right for depth) */}
        <div className="relative grid grid-cols-12 items-start">
          {/* FRONT face — slightly forward & lower to create architectural depth */}
          <div className="col-span-5 relative z-20 mt-6 -mr-4">
            {renderFrontFace()}
          </div>

          {/* Travelling gold bridge + dot from Front Submit button to Back face */}
          <div className="col-span-1 relative z-30 flex items-center justify-center self-end mb-12 h-8">
            <div className="w-full h-px border-t border-dashed border-[#C9A66B]/55" />
            {dotTraveling && !instantFinal && (
              <motion.span
                key={`desktop-dot-${playNonce}`}
                initial={{ x: -24, opacity: 0.9, scale: 0.9 }}
                animate={{ x: 24, opacity: 1, scale: 1.15 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="absolute h-3 w-3 rounded-full bg-[#C9A66B] shadow-[0_0_12px_rgba(201,166,107,0.95)]"
              />
            )}
          </div>

          {/* BACK face — offset upward/right behind Front face */}
          <div className="col-span-6 relative z-10 -ml-2">
            {renderBackFace()}
          </div>
        </div>
      </div>

      {/* PHONE & TABLET VIEW (< 1024px): 5 icons on top, short lines down, Front face then Back face */}
      <div className="lg:hidden w-full max-w-xl mx-auto">
        {/* Compact 5-Icon Row */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3">
          {CHANNEL_META.map((channel, idx) => {
            const isActive = activeLinesCount > idx
            return (
              <div
                key={channel.id}
                className={`flex flex-col items-center justify-center gap-1 rounded-[12px] border py-2 px-1 transition-colors duration-300 min-w-0 ${
                  isActive
                    ? "bg-[#C9A66B]/15 border-[#C9A66B]/65 text-[#C9A66B]"
                    : "bg-[#1C1C1C] border-white/10 text-[#F9F7F6]/70"
                }`}
              >
                <ChannelOutlineIcon id={channel.id} className="h-5 w-5 shrink-0" />
                <span className="hidden sm:block font-heading text-[12px] font-medium truncate max-w-full">
                  {channel.name}
                </span>
              </div>
            )
          })}
        </div>

        {/* Short Gold Dotted Lines Flowing Down */}
        <div className="w-full h-7">
          <svg
            viewBox="0 0 500 28"
            preserveAspectRatio="none"
            className="w-full h-full"
            aria-hidden="true"
          >
            {[50, 150, 250, 350, 450].map((x, idx) => {
              const isVisible = activeLinesCount > idx
              if (instantFinal) {
                return (
                  <line
                    key={x}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={28}
                    stroke="#C9A66B"
                    strokeOpacity={0.65}
                    strokeWidth={1.6}
                    strokeDasharray="3 3"
                  />
                )
              }
              return (
                <motion.line
                  key={`${x}-${playNonce}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={28}
                  stroke="#C9A66B"
                  strokeOpacity={0.75}
                  strokeWidth={1.6}
                  strokeDasharray="3 3"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={
                    isVisible
                      ? { pathLength: 1, opacity: 1 }
                      : { pathLength: 0, opacity: 0 }
                  }
                  transition={{ duration: 0.35, ease: "easeOut" }}
                />
              )
            })}
          </svg>
        </div>

        {/* Stacked Building: FRONT face first */}
        {renderFrontFace()}

        {/* Vertical Gold Connector + Travelling Dot into BACK face */}
        <div className="relative h-8 flex items-center justify-center">
          <div className="h-full w-px border-l border-dashed border-[#C9A66B]/55" />
          {dotTraveling && !instantFinal && (
            <motion.span
              key={`mobile-dot-${playNonce}`}
              initial={{ y: -12, opacity: 0.9, scale: 0.9 }}
              animate={{ y: 12, opacity: 1, scale: 1.15 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute h-3 w-3 rounded-full bg-[#C9A66B] shadow-[0_0_12px_rgba(201,166,107,0.95)]"
            />
          )}
        </div>

        {/* BACK face below */}
        {renderBackFace()}
      </div>
    </div>
  )
}
