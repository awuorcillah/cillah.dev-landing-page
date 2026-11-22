"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"

type PipelineStage = "new" | "contacted" | "viewing" | "closed"

interface LeadItem {
  name: string
  initialStage: PipelineStage
  progressedStage: PipelineStage
  needsAttention: boolean
}

interface AgentPipeline {
  id: "tom" | "mary" | "jane" | "dan"
  name: "Tom" | "Mary" | "Jane" | "Dan"
  initial: string
  newLeadNote: string
  followupNote: string
  leads: LeadItem[]
}

const STAGES: { id: PipelineStage; label: string }[] = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "viewing", label: "Viewing booked" },
  { id: "closed", label: "Closed" },
]

const AGENTS: AgentPipeline[] = [
  {
    id: "tom",
    name: "Tom",
    initial: "T",
    newLeadNote: "New lead: Grace, 2-bed in Kilimani",
    followupNote: "Follow-up due: Peter, no reply yet",
    leads: [
      { name: "Grace", initialStage: "new", progressedStage: "contacted", needsAttention: false },
      { name: "Peter", initialStage: "new", progressedStage: "new", needsAttention: true },
    ],
  },
  {
    id: "mary",
    name: "Mary",
    initial: "M",
    newLeadNote: "New lead: Brian, 3-bed in Lavington",
    followupNote: "Follow-up due: Brian",
    leads: [
      { name: "Njeri", initialStage: "new", progressedStage: "contacted", needsAttention: false },
      { name: "Brian", initialStage: "new", progressedStage: "new", needsAttention: true },
    ],
  },
  {
    id: "jane",
    name: "Jane",
    initial: "J",
    newLeadNote: "New lead: Caroline, Runda villa",
    followupNote: "Reminder: viewing tomorrow 10:00, Caroline",
    leads: [
      { name: "Caroline", initialStage: "new", progressedStage: "viewing", needsAttention: true },
    ],
  },
  {
    id: "dan",
    name: "Dan",
    initial: "D",
    newLeadNote: "New lead: Kelvin, plot in Karen",
    followupNote: "Follow-up due: Kelvin",
    leads: [
      { name: "Kelvin", initialStage: "new", progressedStage: "new", needsAttention: true },
    ],
  },
]

function BellOutlineIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

export interface Scene3PipelinesProps {
  shouldPlay: boolean
  reducedMotion: boolean
  forceFinalFrame?: boolean
  playNonce: number
  onComplete: () => void
}

type NotificationPhase = "none" | "new-lead" | "followup"

export function Scene3Pipelines({
  shouldPlay,
  reducedMotion,
  forceFinalFrame = false,
  playNonce,
  onComplete,
}: Scene3PipelinesProps) {
  const timersRef = useRef<number[]>([])
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const instantFinal = reducedMotion || forceFinalFrame

  // Track lg (1024px) breakpoint so timers reset cleanly on breakpoint cross
  const [isDesktop, setIsDesktop] = useState(false)

  // Step states
  const [branchesDrawn, setBranchesDrawn] = useState<boolean>(instantFinal)
  const [chipsTraveling, setChipsTraveling] = useState<boolean>(false)
  const [agentsLoadedCount, setAgentsLoadedCount] = useState<number>(instantFinal ? 4 : 0)
  const [notificationPhase, setNotificationPhase] = useState<NotificationPhase>(
    instantFinal ? "followup" : "none"
  )
  const [showTwoDaysLater, setShowTwoDaysLater] = useState<boolean>(instantFinal)
  const [progressed, setProgressed] = useState<boolean>(instantFinal)
  const [scanActive, setScanActive] = useState<boolean>(false)
  const [attentionActive, setAttentionActive] = useState<boolean>(instantFinal)
  const [showClosingLine, setShowClosingLine] = useState<boolean>(instantFinal)

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
      setBranchesDrawn(true)
      setChipsTraveling(false)
      setAgentsLoadedCount(4)
      setNotificationPhase("followup")
      setShowTwoDaysLater(true)
      setProgressed(true)
      setScanActive(false)
      setAttentionActive(true)
      setShowClosingLine(true)
      onCompleteRef.current()
      return
    }

    if (!shouldPlay) {
      setBranchesDrawn(false)
      setChipsTraveling(false)
      setAgentsLoadedCount(0)
      setNotificationPhase("none")
      setShowTwoDaysLater(false)
      setProgressed(false)
      setScanActive(false)
      setAttentionActive(false)
      setShowClosingLine(false)
      return
    }

    // Reset before playback
    setBranchesDrawn(false)
    setChipsTraveling(false)
    setAgentsLoadedCount(0)
    setNotificationPhase("none")
    setShowTwoDaysLater(false)
    setProgressed(false)
    setScanActive(false)
    setAttentionActive(false)
    setShowClosingLine(false)

    const schedule = (fn: () => void, delayMs: number) => {
      const id = window.setTimeout(fn, delayMs)
      timersRef.current.push(id)
    }

    // Step 2: 4 gold branch lines draw out
    schedule(() => setBranchesDrawn(true), 350)

    // Step 3: Lead chips travel along branches into each agent's "New" stage
    schedule(() => setChipsTraveling(true), 1000)
    schedule(() => setAgentsLoadedCount(2), 1450)
    schedule(() => {
      setAgentsLoadedCount(4)
      setChipsTraveling(false)
    }, 1900)

    // Step 4: New-lead notifications pop in each card
    schedule(() => setNotificationPhase("new-lead"), 2400)

    // Step 5: "Two days later" — new-lead toasts fade out, chips advance
    schedule(() => setNotificationPhase("none"), 4200)
    schedule(() => setShowTwoDaysLater(true), 4400)
    schedule(() => setProgressed(true), 4900)

    // Step 6: Gold scan line sweeps across all 4 pipelines -> attention pulse + follow-up toasts
    schedule(() => setScanActive(true), 6300)
    schedule(() => {
      setAttentionActive(true)
      setNotificationPhase("followup")
    }, 7400)
    schedule(() => setScanActive(false), 7600)

    // Step 7: Closing line appears and Scene 3 rests on final frame (9.6s total)
    schedule(() => setShowClosingLine(true), 8600)
    schedule(() => onCompleteRef.current(), 9600)

    return () => {
      clearAllTimers()
    }
  }, [shouldPlay, instantFinal, playNonce, isDesktop])

  const getActiveNotification = (agent: AgentPipeline): string | null => {
    if (notificationPhase === "new-lead") return agent.newLeadNote
    if (notificationPhase === "followup") return agent.followupNote
    return null
  }

  const getStageCounts = (agent: AgentPipeline, isLoaded: boolean) => {
    const counts: Record<PipelineStage, number> = {
      new: 0,
      contacted: 0,
      viewing: 0,
      closed: 0,
    }
    if (!isLoaded) return counts
    for (const lead of agent.leads) {
      const stage = progressed ? lead.progressedStage : lead.initialStage
      counts[stage] += 1
    }
    return counts
  }

  const desktopBranchPaths = [
    "M 0 250 C 36 250, 36 62, 80 62",
    "M 0 250 C 36 250, 36 188, 80 188",
    "M 0 250 C 36 250, 36 312, 80 312",
    "M 0 250 C 36 250, 36 438, 80 438",
  ]

  const renderLeadChip = (lead: LeadItem, keyPrefix: string) => {
    const isPulsing = attentionActive && lead.needsAttention

    const chipClasses = isPulsing
      ? "bg-[#C9A66B]/20 border-[#C9A66B] text-[#F9F7F6] shadow-[0_0_12px_rgba(201,166,107,0.45)]"
      : "bg-[#1C1C1C] border-white/15 text-[#F9F7F6]/90"

    if (instantFinal) {
      return (
        <span
          key={`${keyPrefix}-${lead.name}`}
          className={`inline-flex items-center px-2 py-0.5 rounded-full border font-sans text-[12px] leading-tight whitespace-nowrap ${chipClasses}`}
        >
          {lead.name}
        </span>
      )
    }

    return (
      <motion.span
        key={`${keyPrefix}-${lead.name}-${progressed ? "p" : "i"}`}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={
          isPulsing
            ? {
                opacity: 1,
                scale: [1, 1.07, 1],
              }
            : { opacity: 1, scale: 1 }
        }
        transition={
          isPulsing
            ? { duration: 0.9, repeat: 2, ease: "easeInOut" }
            : { duration: 0.28, ease: "easeOut" }
        }
        className={`inline-flex items-center px-2 py-0.5 rounded-full border font-sans text-[12px] leading-tight whitespace-nowrap transition-colors duration-300 ${chipClasses}`}
      >
        {lead.name}
      </motion.span>
    )
  }

  const renderNotificationToast = (note: string | null, agentId: string) => {
    if (instantFinal) {
      return note ? (
        <div className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#07070B]/85 border border-[#C9A66B]/40 px-2.5 py-1 text-left max-w-full">
          <BellOutlineIcon className="h-3.5 w-3.5 text-[#C9A66B] shrink-0" />
          <span className="font-sans text-[12px] leading-[1.35] text-[#F9F7F6]/90 break-words">
            {note}
          </span>
        </div>
      ) : null
    }

    return (
      <AnimatePresence mode="wait">
        {note && (
          <motion.div
            key={`${agentId}-${notificationPhase}-${playNonce}`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#07070B]/85 border border-[#C9A66B]/40 px-2.5 py-1 text-left max-w-full"
          >
            <BellOutlineIcon className="h-3.5 w-3.5 text-[#C9A66B] shrink-0" />
            <span className="font-sans text-[12px] leading-[1.35] text-[#F9F7F6]/90 break-words">
              {note}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <div className="w-full">
      {/* DESKTOP VIEW (>= 1024px): Backend on left, gold branches fanning right, 4 stacked agent cards with 4 stages in a row */}
      <div className="hidden lg:block w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-12 items-center">
          {/* Left: Compact Backend Panel */}
          <div className="col-span-3">
            <div className="rounded-[16px] bg-[#1C1C1C] border border-[#C9A66B]/30 p-4 text-left space-y-3">
              <span className="block font-heading font-medium text-[12px] uppercase tracking-[0.14em] text-[#C9A66B]">
                Backend: your private office
              </span>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#07070B] border border-[#C9A66B]/35 text-[12px] font-heading font-medium text-[#F9F7F6]">
                <span className="text-[#F9F7F6]/70">New leads:</span>
                <span className="text-[#C9A66B] font-semibold">6</span>
              </div>
              <div className="min-h-[28px]">
                {showTwoDaysLater &&
                  (instantFinal ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#C9A66B]/15 border border-[#C9A66B]/45 text-[#C9A66B] font-heading font-medium text-[12px]">
                      Two days later
                    </span>
                  ) : (
                    <motion.span
                      key={`two-days-desktop-${playNonce}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#C9A66B]/15 border border-[#C9A66B]/45 text-[#C9A66B] font-heading font-medium text-[12px]"
                    >
                      Two days later
                    </motion.span>
                  ))}
              </div>
            </div>
          </div>

          {/* Middle: Fanning Gold Branch Lines */}
          <div className="col-span-1 h-[500px] relative">
            <svg
              viewBox="0 0 80 500"
              preserveAspectRatio="none"
              className="w-full h-full overflow-visible"
              aria-hidden="true"
            >
              {desktopBranchPaths.map((d, idx) =>
                instantFinal ? (
                  <path
                    key={idx}
                    d={d}
                    fill="none"
                    stroke="#C9A66B"
                    strokeOpacity={0.65}
                    strokeWidth={1.6}
                    strokeDasharray="4 4"
                  />
                ) : (
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
                      branchesDrawn
                        ? { pathLength: 1, opacity: 1 }
                        : { pathLength: 0, opacity: 0 }
                    }
                    transition={{ duration: 0.5, delay: idx * 0.08, ease: "easeOut" }}
                  />
                )
              )}

              {/* Travelling gold lead dots along branches during Step 3 */}
              {chipsTraveling &&
                !instantFinal &&
                [62, 188, 312, 438].map((targetY, idx) => (
                  <motion.circle
                    key={`travel-dot-${idx}-${playNonce}`}
                    r={3.5}
                    fill="#C9A66B"
                    initial={{ cx: 4, cy: 250, opacity: 0.9 }}
                    animate={{ cx: 78, cy: targetY, opacity: [0.9, 1, 0.2] }}
                    transition={{ duration: 0.75, delay: idx * 0.12, ease: "easeInOut" }}
                  />
                ))}
            </svg>
          </div>

          {/* Right: Four Stacked Agent Cards with Gold Scan Line Overlay */}
          <div className="col-span-8 relative space-y-2.5 overflow-hidden rounded-[16px]">
            {/* Thin gold scan line sweeping left-to-right across the 4 pipelines */}
            {scanActive && !instantFinal && (
              <motion.div
                key={`scan-desktop-${playNonce}`}
                initial={{ left: "0%", opacity: 0 }}
                animate={{ left: "100%", opacity: [0, 0.95, 0.95, 0] }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                className="pointer-events-none absolute top-0 bottom-0 w-[2px] z-30 bg-[#C9A66B] shadow-[0_0_18px_3px_rgba(201,166,107,0.7)]"
              />
            )}

            {AGENTS.map((agent, agentIdx) => {
              const isLoaded = agentsLoadedCount > agentIdx
              const activeNote = getActiveNotification(agent)

              return (
                <div
                  key={agent.id}
                  className="rounded-[14px] bg-[#1C1C1C] border border-white/10 px-3.5 py-2.5 text-left"
                >
                  {/* Card Header: Initial Badge + Name + Notification Toast */}
                  <div className="flex items-center justify-between gap-3 mb-2 min-h-[30px]">
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="h-7 w-7 rounded-full bg-[#C9A66B]/15 border border-[#C9A66B]/50 text-[#C9A66B] font-heading font-semibold text-[12px] flex items-center justify-center shrink-0">
                        {agent.initial}
                      </span>
                      <span className="font-heading font-medium text-[13px] text-[#F9F7F6]">
                        {agent.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-end min-w-0">
                      {renderNotificationToast(activeNote, agent.id)}
                    </div>
                  </div>

                  {/* Four Pipeline Stages in a Row */}
                  <div className="grid grid-cols-4 gap-2">
                    {STAGES.map((stage) => {
                      const stageLeads = isLoaded
                        ? agent.leads.filter((lead) => {
                            const currentStage = progressed
                              ? lead.progressedStage
                              : lead.initialStage
                            return currentStage === stage.id
                          })
                        : []

                      return (
                        <div
                          key={stage.id}
                          className="rounded-[10px] bg-[#07070B]/75 border border-white/10 px-2 py-1.5 min-w-0"
                        >
                          <span className="block font-heading text-[12px] text-[#F9F7F6]/55 leading-tight mb-1 truncate">
                            {stage.label}
                          </span>
                          <div className="flex flex-wrap items-center gap-1 min-h-[24px]">
                            {stageLeads.map((lead) =>
                              renderLeadChip(lead, `d-${agent.id}-${stage.id}`)
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Final Closing Line */}
        <div className="mt-4 min-h-[24px] text-center">
          {showClosingLine &&
            (instantFinal ? (
              <p className="font-heading text-[13px] font-medium text-[#C9A66B] tracking-wide">
                Every lead assigned. Every follow-up reminded.
              </p>
            ) : (
              <motion.p
                key={`closing-desktop-${playNonce}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="font-heading text-[13px] font-medium text-[#C9A66B] tracking-wide"
              >
                Every lead assigned. Every follow-up reminded.
              </motion.p>
            ))}
        </div>
      </div>

      {/* PHONE & TABLET VIEW (< 1024px): Compact stack fitting comfortably under 820px with all text >= 12px */}
      <div className="lg:hidden w-full max-w-xl mx-auto">
        {/* Top Backend Panel */}
        <div className="rounded-[14px] bg-[#1C1C1C] border border-[#C9A66B]/30 px-3 py-2.5 text-left">
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
            <span className="font-heading font-medium text-[12px] uppercase tracking-[0.1em] text-[#C9A66B]">
              Backend: your private office
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#07070B] border border-[#C9A66B]/35 text-[12px] font-heading font-medium text-[#F9F7F6]">
                <span className="text-[#F9F7F6]/70">New leads:</span>
                <span className="text-[#C9A66B] font-semibold">6</span>
              </span>
              {showTwoDaysLater && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#C9A66B]/15 border border-[#C9A66B]/45 text-[#C9A66B] font-heading font-medium text-[12px]">
                  Two days later
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Short Downward Gold Branch Lines */}
        <div className="w-full h-4">
          <svg
            viewBox="0 0 400 16"
            preserveAspectRatio="none"
            className="w-full h-full"
            aria-hidden="true"
          >
            {[80, 160, 240, 320].map((x, idx) =>
              instantFinal ? (
                <line
                  key={x}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={16}
                  stroke="#C9A66B"
                  strokeOpacity={0.65}
                  strokeWidth={1.6}
                  strokeDasharray="3 3"
                />
              ) : (
                <motion.line
                  key={`${x}-${playNonce}`}
                  x1={x}
                  y1={0}
                  x2={x}
                  y2={16}
                  stroke="#C9A66B"
                  strokeOpacity={0.75}
                  strokeWidth={1.6}
                  strokeDasharray="3 3"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={
                    branchesDrawn
                      ? { pathLength: 1, opacity: 1 }
                      : { pathLength: 0, opacity: 0 }
                  }
                  transition={{ duration: 0.35, delay: idx * 0.06, ease: "easeOut" }}
                />
              )
            )}
          </svg>
        </div>

        {/* Four Compact Stacked Agent Cards with Gold Scan Line Overlay */}
        <div className="relative space-y-2 overflow-hidden rounded-[14px]">
          {scanActive && !instantFinal && (
            <motion.div
              key={`scan-mobile-${playNonce}`}
              initial={{ left: "0%", opacity: 0 }}
              animate={{ left: "100%", opacity: [0, 0.95, 0.95, 0] }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
              className="pointer-events-none absolute top-0 bottom-0 w-[2px] z-30 bg-[#C9A66B] shadow-[0_0_16px_3px_rgba(201,166,107,0.7)]"
            />
          )}

          {AGENTS.map((agent, agentIdx) => {
            const isLoaded = agentsLoadedCount > agentIdx
            const counts = getStageCounts(agent, isLoaded)
            const activeNote = getActiveNotification(agent)

            return (
              <div
                key={agent.id}
                className="rounded-[14px] bg-[#1C1C1C] border border-white/10 px-3 py-2.5 text-left"
              >
                {/* Header: Badge + Agent Name + Lead Chips */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="h-6 w-6 rounded-full bg-[#C9A66B]/15 border border-[#C9A66B]/50 text-[#C9A66B] font-heading font-semibold text-[12px] flex items-center justify-center shrink-0">
                      {agent.initial}
                    </span>
                    <span className="font-heading font-medium text-[13px] text-[#F9F7F6]">
                      {agent.name}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5 min-h-[24px]">
                    {isLoaded &&
                      agent.leads.map((lead) =>
                        renderLeadChip(lead, `m-${agent.id}`)
                      )}
                  </div>
                </div>

                {/* Short Labelled Stage Counters (all >= 12px, clean wrap at 360px, single line at 768px) */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] leading-[1.35] mb-1.5">
                  {STAGES.map((stage) => {
                    const count = counts[stage.id]
                    return (
                      <span
                        key={stage.id}
                        className={`font-sans whitespace-nowrap ${
                          count > 0 ? "text-[#F9F7F6]/90" : "text-[#F9F7F6]/45"
                        }`}
                      >
                        {stage.label}{" "}
                        <span
                          className={`font-heading font-semibold tabular-nums ${
                            count > 0 ? "text-[#C9A66B]" : "text-[#F9F7F6]/40"
                          }`}
                        >
                          {count}
                        </span>
                      </span>
                    )
                  })}
                </div>

                {/* Notification Toast Area */}
                <div className="min-h-[30px] flex items-center">
                  {renderNotificationToast(activeNote, `m-${agent.id}`)}
                </div>
              </div>
            )
          })}
        </div>

        {/* Final Closing Line */}
        <div className="mt-3 min-h-[22px] text-center">
          {showClosingLine &&
            (instantFinal ? (
              <p className="font-heading text-[13px] font-medium text-[#C9A66B] tracking-wide">
                Every lead assigned. Every follow-up reminded.
              </p>
            ) : (
              <motion.p
                key={`closing-mobile-${playNonce}`}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="font-heading text-[13px] font-medium text-[#C9A66B] tracking-wide"
              >
                Every lead assigned. Every follow-up reminded.
              </motion.p>
            ))}
        </div>
      </div>
    </div>
  )
}
