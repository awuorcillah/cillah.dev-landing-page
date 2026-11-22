"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

type ChannelId = "whatsapp" | "linkedin" | "instagram" | "tiktok" | "facebook"

interface ChatMessage {
  sender: "customer" | "ai"
  label: string
  text: string
}

interface ChannelConversation {
  id: ChannelId
  name: string
  customerName: string
  agentName: "Tom" | "Mary" | "Jane" | "Dan"
  assignedTag: string
  messages: ChatMessage[]
}

const CHANNELS: ChannelConversation[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    customerName: "Grace",
    agentName: "Tom",
    assignedTag: "Assigned to Tom",
    messages: [
      {
        sender: "customer",
        label: "Grace",
        text: "How much is the 2-bed in Kilimani?",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "From KES 14,500,000. May I have your name so I can assign you to one of our agents?",
      },
      {
        sender: "customer",
        label: "Grace",
        text: "Grace",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "Thanks Grace. Tom will message you shortly.",
      },
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    customerName: "Njeri",
    agentName: "Mary",
    assignedTag: "Assigned to Mary",
    messages: [
      {
        sender: "customer",
        label: "Njeri",
        text: "Looking for office space in Westlands.",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "Great. May I have your name so I can assign you to an agent?",
      },
      {
        sender: "customer",
        label: "Njeri",
        text: "Njeri",
      },
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    customerName: "Caroline",
    agentName: "Jane",
    assignedTag: "Assigned to Jane",
    messages: [
      {
        sender: "customer",
        label: "Caroline",
        text: "Is the Runda villa still available?",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "Yes, it is. May I have your name so I can assign you to an agent?",
      },
      {
        sender: "customer",
        label: "Caroline",
        text: "Caroline",
      },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    customerName: "Peter",
    agentName: "Tom",
    assignedTag: "Assigned to Tom",
    messages: [
      {
        sender: "customer",
        label: "Peter",
        text: "Can I view the apartment this weekend?",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "Yes. May I have your name so I can assign you to an agent?",
      },
      {
        sender: "customer",
        label: "Peter",
        text: "Peter",
      },
    ],
  },
  {
    id: "facebook",
    name: "Facebook",
    customerName: "Kelvin",
    agentName: "Dan",
    assignedTag: "Assigned to Dan",
    messages: [
      {
        sender: "customer",
        label: "Kelvin",
        text: "Do you have plots in Karen?",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "We do. May I have your name so I can assign you to an agent?",
      },
      {
        sender: "customer",
        label: "Kelvin",
        text: "Kelvin",
      },
    ],
  },
]

function ChannelOutlineIcon({ id, className }: { id: ChannelId; className?: string }) {
  const sharedProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
  }

  switch (id) {
    case "whatsapp":
      return (
        <svg {...sharedProps}>
          <path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z" />
          <path d="M9.5 9.2c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.6l-.5.6c-.1.1-.1.3 0 .5.4.8 1.2 1.5 2 1.9.2.1.4.1.5 0l.6-.5c.2-.1.4-.2.6-.1l1.5.7c.3.1.4.3.4.5v.5c0 .3-.1.6-.5.8-.6.3-1.7.4-3.3-.3-1.8-.8-3.3-2.3-4.1-4.1-.7-1.6-.6-2.7-.3-3.3Z" />
        </svg>
      )
    case "linkedin":
      return (
        <svg {...sharedProps}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M8 11v5" />
          <circle cx="8" cy="8" r="0.7" fill="currentColor" stroke="none" />
          <path d="M12 16v-5" />
          <path d="M12 13a2.2 2.2 0 0 1 4.4 0v3" />
        </svg>
      )
    case "instagram":
      return (
        <svg {...sharedProps}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      )
    case "tiktok":
      return (
        <svg {...sharedProps}>
          <path d="M14 4v10.5a3.5 3.5 0 1 1-2.5-3.35" />
          <path d="M14 4c.7 2.4 2.4 4 5 4.3" />
        </svg>
      )
    case "facebook":
      return (
        <svg {...sharedProps}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M14.8 8H13a2 2 0 0 0-2 2v11" />
          <path d="M9 13h5.2" />
        </svg>
      )
  }
}

interface ChatBubbleProps {
  message: ChatMessage
  reducedMotion: boolean
  compact?: boolean
}

function ChatBubble({ message, reducedMotion, compact = false }: ChatBubbleProps) {
  const isAi = message.sender === "ai"

  const bubbleClasses = isAi
    ? "bg-[#C9A66B]/[0.07] border border-[#C9A66B]/45 text-[#F9F7F6]"
    : "bg-[#07070B]/85 border border-white/10 text-[#F9F7F6]/90"

  const spacingClasses = compact
    ? "rounded-[12px] px-3 py-2 text-[12px] xl:text-[12.5px] leading-[1.45]"
    : "rounded-[14px] px-3.5 py-2.5 text-[13px] sm:text-[14px] leading-relaxed"

  const content = (
    <div className={`${bubbleClasses} ${spacingClasses} text-left break-words`}>
      <span
        className={`block font-heading font-medium uppercase tracking-[0.14em] mb-1 ${
          compact ? "text-[9px]" : "text-[10px]"
        } ${isAi ? "text-[#C9A66B]" : "text-[#F9F7F6]/50"}`}
      >
        {message.label}
      </span>
      <p className="font-sans font-light">{message.text}</p>
    </div>
  )

  if (reducedMotion) {
    return content
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, ease: "easeOut" }}
    >
      {content}
    </motion.div>
  )
}

function AssignedTag({ label, reducedMotion }: { label: string; reducedMotion: boolean }) {
  const tag = (
    <div className="pt-2">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C9A66B]/10 border border-[#C9A66B]/40 text-[#C9A66B] font-heading font-medium text-[11px] tracking-wide">
        <span className="h-1.5 w-1.5 rounded-full bg-[#C9A66B]" />
        {label}
      </span>
    </div>
  )

  if (reducedMotion) {
    return tag
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
    >
      {tag}
    </motion.div>
  )
}

export interface Scene1InquiriesProps {
  shouldPlay: boolean
  reducedMotion: boolean
  playNonce: number
  onComplete: () => void
}

// Total steps per channel = messages.length + 1 (the final step reveals the "Assigned to ..." tag)
const FINAL_DESKTOP_STEPS = CHANNELS.map((c) => c.messages.length + 1)
const EMPTY_DESKTOP_STEPS = CHANNELS.map(() => 0)

export function Scene1Inquiries({
  shouldPlay,
  reducedMotion,
  playNonce,
  onComplete,
}: Scene1InquiriesProps) {
  const timersRef = useRef<number[]>([])
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const [isDesktop, setIsDesktop] = useState<boolean>(false)
  const [desktopSteps, setDesktopSteps] = useState<number[]>(() =>
    reducedMotion ? FINAL_DESKTOP_STEPS : EMPTY_DESKTOP_STEPS
  )
  const [mobileChannelIdx, setMobileChannelIdx] = useState<number>(0)
  const [mobileStep, setMobileStep] = useState<number>(() =>
    reducedMotion ? CHANNELS[0].messages.length + 1 : 0
  )
  const [sequenceFinished, setSequenceFinished] = useState<boolean>(reducedMotion)

  const clearAllTimers = () => {
    for (const id of timersRef.current) {
      window.clearTimeout(id)
    }
    timersRef.current = []
  }

  // Track lg (1024px) breakpoint
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(min-width: 1024px)")
    const sync = () => setIsDesktop(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers()
    }
  }, [])

  // Playback scheduler
  useEffect(() => {
    clearAllTimers()

    if (reducedMotion) {
      setDesktopSteps(FINAL_DESKTOP_STEPS)
      setMobileChannelIdx(0)
      setMobileStep(CHANNELS[0].messages.length + 1)
      setSequenceFinished(true)
      onCompleteRef.current()
      return
    }

    if (!shouldPlay) {
      setDesktopSteps(EMPTY_DESKTOP_STEPS)
      setMobileChannelIdx(0)
      setMobileStep(0)
      setSequenceFinished(false)
      return
    }

    setSequenceFinished(false)

    const schedule = (fn: () => void, delayMs: number) => {
      const id = window.setTimeout(fn, delayMs)
      timersRef.current.push(id)
    }

    if (isDesktop) {
      // Desktop (>= 1024px): staggered columns across all 5 channels
      setDesktopSteps(EMPTY_DESKTOP_STEPS)

      const channelStaggerMs = 950
      const bubbleIntervalMs = 560
      let maxTime = 0

      CHANNELS.forEach((channel, colIdx) => {
        const channelStart = 180 + colIdx * channelStaggerMs
        const totalSteps = channel.messages.length + 1

        for (let step = 1; step <= totalSteps; step++) {
          const t = channelStart + (step - 1) * bubbleIntervalMs
          if (t > maxTime) maxTime = t
          schedule(() => {
            setDesktopSteps((prev) => {
              const next = [...prev]
              next[colIdx] = step
              return next
            })
          }, t)
        }
      })

      schedule(() => {
        setSequenceFinished(true)
        onCompleteRef.current()
      }, maxTime + 450)
    } else {
      // Phone & Tablet (< 1024px): single conversation panel playing each channel in turn
      setMobileChannelIdx(0)
      setMobileStep(0)

      let cursorMs = 180
      const bubbleIntervalMs = 620
      const channelHoldMs = 1150

      CHANNELS.forEach((channel, idx) => {
        const totalSteps = channel.messages.length + 1
        const startOfChannel = cursorMs

        schedule(() => {
          setMobileChannelIdx(idx)
          setMobileStep(0)
        }, startOfChannel)

        for (let step = 1; step <= totalSteps; step++) {
          const stepTime = startOfChannel + step * bubbleIntervalMs
          schedule(() => {
            setMobileChannelIdx(idx)
            setMobileStep(step)
          }, stepTime)
        }

        cursorMs = startOfChannel + totalSteps * bubbleIntervalMs + channelHoldMs
      })

      schedule(() => {
        setSequenceFinished(true)
        onCompleteRef.current()
      }, cursorMs - channelHoldMs + 400)
    }

    return () => {
      clearAllTimers()
    }
  }, [shouldPlay, reducedMotion, playNonce, isDesktop])

  const activeMobileChannel = CHANNELS[mobileChannelIdx]
  const visibleMobileMessages = activeMobileChannel.messages.slice(
    0,
    Math.min(mobileStep, activeMobileChannel.messages.length)
  )
  const showMobileTag = mobileStep > activeMobileChannel.messages.length

  const handleSelectMobileChannel = (idx: number) => {
    if (!sequenceFinished && !reducedMotion) return
    setMobileChannelIdx(idx)
    setMobileStep(CHANNELS[idx].messages.length + 1)
  }

  return (
    <div className="w-full">
      {/* DESKTOP VIEW (>= 1024px): 5 columns across with staggered chats below each icon */}
      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-4 xl:gap-5 items-stretch">
        {CHANNELS.map((channel, colIdx) => {
          const step = desktopSteps[colIdx] ?? 0
          const isActive = step > 0
          const visibleMessages = channel.messages.slice(
            0,
            Math.min(step, channel.messages.length)
          )
          const showTag = step > channel.messages.length

          return (
            <div key={channel.id} className="flex flex-col items-center min-w-0">
              {/* Channel Icon Header */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`h-11 w-11 rounded-2xl flex items-center justify-center border transition-colors duration-300 ${
                    isActive
                      ? "bg-[#C9A66B]/15 border-[#C9A66B]/60 text-[#C9A66B]"
                      : "bg-[#1C1C1C] border-white/10 text-[#F9F7F6]/75"
                  }`}
                >
                  <ChannelOutlineIcon id={channel.id} className="h-5 w-5" />
                </div>
                <span
                  className={`font-heading text-[12px] font-medium tracking-wide transition-colors duration-300 ${
                    isActive ? "text-[#C9A66B]" : "text-[#F9F7F6]/70"
                  }`}
                >
                  {channel.name}
                </span>
              </div>

              {/* Subtle Vertical Connector */}
              <div
                className={`h-4 w-px my-2 transition-colors duration-300 ${
                  isActive ? "bg-[#C9A66B]/45" : "bg-white/10"
                }`}
              />

              {/* Conversation Panel */}
              <div className="w-full flex-1 rounded-[16px] bg-[#1C1C1C] border border-white/10 p-3 xl:p-3.5 flex flex-col justify-between min-h-[340px] min-w-0">
                <div className="space-y-2.5">
                  {visibleMessages.map((msg, mIdx) => (
                    <ChatBubble
                      key={`${channel.id}-${playNonce}-${mIdx}`}
                      message={msg}
                      reducedMotion={reducedMotion}
                      compact
                    />
                  ))}
                </div>

                {showTag && (
                  <div className="pt-2 border-t border-white/10 mt-3 text-left">
                    <AssignedTag
                      key={`${channel.id}-tag-${playNonce}`}
                      label={channel.assignedTag}
                      reducedMotion={reducedMotion}
                    />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* PHONE & TABLET VIEW (< 1024px): 5 icons across top + single readable conversation panel */}
      <div className="lg:hidden w-full max-w-xl mx-auto">
        {/* Five-Icon Row */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3 mb-4">
          {CHANNELS.map((channel, idx) => {
            const isActive = idx === mobileChannelIdx && (shouldPlay || reducedMotion)
            const isInteractive = sequenceFinished || reducedMotion

            return (
              <div
                key={channel.id}
                onClick={isInteractive ? () => handleSelectMobileChannel(idx) : undefined}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-[14px] border px-1 py-2.5 sm:py-3 min-w-0 transition-colors duration-300 ${
                  isActive
                    ? "bg-[#C9A66B]/15 border-[#C9A66B]/70 text-[#C9A66B]"
                    : "bg-[#1C1C1C] border-white/10 text-[#F9F7F6]/65"
                } ${isInteractive ? "cursor-pointer hover:border-[#C9A66B]/45" : ""}`}
              >
                <ChannelOutlineIcon id={channel.id} className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span className="font-heading text-[9.5px] sm:text-[11px] font-medium tracking-tight sm:tracking-wide truncate max-w-full">
                  {channel.name}
                </span>
              </div>
            )
          })}
        </div>

        {/* Single Conversation Panel */}
        <div className="w-full rounded-[16px] bg-[#1C1C1C] border border-white/10 p-4 sm:p-6 text-left min-h-[310px] sm:min-h-[330px] flex flex-col justify-between">
          <div>
            {/* Active Channel Header inside Panel */}
            <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-white/10">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[#C9A66B] shrink-0">
                  <ChannelOutlineIcon id={activeMobileChannel.id} className="h-4 w-4" />
                </span>
                <span className="font-heading text-[13px] sm:text-[14px] font-medium text-[#F9F7F6] truncate">
                  {activeMobileChannel.name}
                </span>
                <span className="text-[#F9F7F6]/30">&bull;</span>
                <span className="text-[12px] sm:text-[13px] text-[#F9F7F6]/65 truncate">
                  {activeMobileChannel.customerName}
                </span>
              </div>
              <span className="text-[10px] font-heading uppercase tracking-[0.18em] text-[#C9A66B] shrink-0">
                {mobileChannelIdx + 1} / {CHANNELS.length}
              </span>
            </div>

            {/* Messages */}
            <div className="space-y-3">
              {visibleMobileMessages.map((msg, mIdx) => (
                <ChatBubble
                  key={`${activeMobileChannel.id}-${playNonce}-${mIdx}`}
                  message={msg}
                  reducedMotion={reducedMotion}
                />
              ))}
            </div>
          </div>

          {showMobileTag && (
            <div className="pt-3 border-t border-white/10 mt-4">
              <AssignedTag
                key={`${activeMobileChannel.id}-tag-${playNonce}`}
                label={activeMobileChannel.assignedTag}
                reducedMotion={reducedMotion}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
