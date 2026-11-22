"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ChannelBrandLogo, type ChannelId } from "./channel-icons"

interface ChatMessage {
  sender: "customer" | "ai"
  label: string
  text: string
  time: string
}

interface ChannelTheme {
  shellBg: string
  headerBg: string
  headerAccent: string
  avatarBg: string
  customerBubble: string
  aiBubble: string
  aiLabel: string
  connectorColor: string
  activeRing: string
  showDoubleChecks?: boolean
  statusText: string
}

interface ChannelConversation {
  id: ChannelId
  name: string
  customerName: string
  customerInitial: string
  agentName: "Tom" | "Mary" | "Jane" | "Dan"
  assignedTag: string
  theme: ChannelTheme
  messages: ChatMessage[]
}

const CHANNELS: ChannelConversation[] = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    customerName: "Grace",
    customerInitial: "G",
    agentName: "Tom",
    assignedTag: "Assigned to Tom",
    theme: {
      shellBg: "bg-[#0B141A]",
      headerBg: "bg-[#1F2C34] border-b border-white/10",
      headerAccent: "text-[#25D366]",
      avatarBg: "bg-[#25D366]/20 border-[#25D366]/60 text-[#25D366]",
      customerBubble:
        "bg-[#202C33] text-[#E9EDEF] border border-white/10 rounded-[14px] rounded-tl-[4px]",
      aiBubble:
        "bg-[#005C4B] text-[#E9EDEF] border border-[#25D366]/40 rounded-[14px] rounded-tr-[4px]",
      aiLabel: "text-[#A7F3D0]",
      connectorColor: "bg-[#25D366]/55",
      activeRing: "border-[#25D366]/70 bg-[#25D366]/10",
      showDoubleChecks: true,
      statusText: "online",
    },
    messages: [
      {
        sender: "customer",
        label: "Grace",
        text: "How much is the 2-bed in Kilimani?",
        time: "10:14",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "From KES 14,500,000. May I have your name so I can assign you to one of our agents?",
        time: "10:14",
      },
      {
        sender: "customer",
        label: "Grace",
        text: "Grace",
        time: "10:15",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "Thanks Grace. Tom will message you shortly.",
        time: "10:15",
      },
    ],
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    customerName: "Njeri",
    customerInitial: "N",
    agentName: "Mary",
    assignedTag: "Assigned to Mary",
    theme: {
      shellBg: "bg-[#1B1F23]",
      headerBg: "bg-[#242A30] border-b border-white/10",
      headerAccent: "text-[#70B5F9]",
      avatarBg: "bg-[#0A66C2]/25 border-[#0A66C2]/70 text-[#70B5F9]",
      customerBubble:
        "bg-[#2B3137] text-[#F3F6F8] border border-white/10 rounded-[12px] rounded-tl-[4px]",
      aiBubble:
        "bg-[#0A66C2]/25 text-[#F3F6F8] border border-[#0A66C2]/70 rounded-[12px] rounded-tr-[4px]",
      aiLabel: "text-[#70B5F9]",
      connectorColor: "bg-[#0A66C2]/65",
      activeRing: "border-[#0A66C2]/80 bg-[#0A66C2]/15",
      statusText: "InMail",
    },
    messages: [
      {
        sender: "customer",
        label: "Njeri",
        text: "Looking for office space in Westlands.",
        time: "11:02",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "Great. May I have your name so I can assign you to an agent?",
        time: "11:02",
      },
      {
        sender: "customer",
        label: "Njeri",
        text: "Njeri",
        time: "11:03",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "Thanks Njeri, what's the best phone number to reach you at?",
        time: "11:03",
      },
      {
        sender: "customer",
        label: "Njeri",
        text: "0700 000 012",
        time: "11:04",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "Thanks. Mary will reach out to you shortly on 0700 000 102.",
        time: "11:04",
      },
    ],
  },
  {
    id: "instagram",
    name: "Instagram",
    customerName: "Caroline",
    customerInitial: "C",
    agentName: "Jane",
    assignedTag: "Assigned to Jane",
    theme: {
      shellBg: "bg-[#0E0E10]",
      headerBg: "bg-[#17171B] border-b border-white/10",
      headerAccent: "text-[#F77737]",
      avatarBg: "bg-[#E1306C]/20 border-[#E1306C]/70 text-[#FCAF45]",
      customerBubble:
        "bg-[#262626] text-white border border-white/10 rounded-[16px] rounded-bl-[4px]",
      aiBubble:
        "bg-gradient-to-br from-[#833AB4] via-[#C13584] to-[#E1306C] text-white border border-white/15 rounded-[16px] rounded-br-[4px]",
      aiLabel: "text-white/85",
      connectorColor: "bg-[#E1306C]/65",
      activeRing: "border-[#E1306C]/80 bg-[#E1306C]/15",
      statusText: "Active now",
    },
    messages: [
      {
        sender: "customer",
        label: "Caroline",
        text: "Is the Runda villa still available?",
        time: "12:20",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "Yes, it is. May I have your name so I can assign you to an agent?",
        time: "12:20",
      },
      {
        sender: "customer",
        label: "Caroline",
        text: "Caroline",
        time: "12:21",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "Thanks Caroline, what's the best phone number to reach you at?",
        time: "12:21",
      },
      {
        sender: "customer",
        label: "Caroline",
        text: "0700 000 003",
        time: "12:22",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "Thanks. Jane will reach out to you shortly on 0700 000 103.",
        time: "12:22",
      },
    ],
  },
  {
    id: "tiktok",
    name: "TikTok",
    customerName: "Peter",
    customerInitial: "P",
    agentName: "Tom",
    assignedTag: "Assigned to Tom",
    theme: {
      shellBg: "bg-[#121212]",
      headerBg: "bg-[#1C1C1F] border-b border-white/10",
      headerAccent: "text-[#25F4EE]",
      avatarBg: "bg-[#FE2C55]/20 border-[#25F4EE]/60 text-[#25F4EE]",
      customerBubble:
        "bg-[#262629] text-white border border-white/10 rounded-[14px] rounded-bl-[4px]",
      aiBubble:
        "bg-[#1D2729] text-white border border-[#25F4EE]/55 rounded-[14px] rounded-br-[4px]",
      aiLabel: "text-[#25F4EE]",
      connectorColor: "bg-[#25F4EE]/55",
      activeRing: "border-[#25F4EE]/75 bg-[#25F4EE]/10",
      statusText: "Messages",
    },
    messages: [
      {
        sender: "customer",
        label: "Peter",
        text: "Can I view the apartment this weekend?",
        time: "14:08",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "Yes. May I have your name so I can assign you to an agent?",
        time: "14:08",
      },
      {
        sender: "customer",
        label: "Peter",
        text: "Peter",
        time: "14:09",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "Thanks Peter, what's the best phone number to reach you at?",
        time: "14:09",
      },
      {
        sender: "customer",
        label: "Peter",
        text: "0700 000 014",
        time: "14:10",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "Thanks. Tom will reach out to you shortly on 0700 000 101.",
        time: "14:10",
      },
    ],
  },
  {
    id: "facebook",
    name: "Facebook",
    customerName: "Kelvin",
    customerInitial: "K",
    agentName: "Dan",
    assignedTag: "Assigned to Dan",
    theme: {
      shellBg: "bg-[#18191A]",
      headerBg: "bg-[#242526] border-b border-white/10",
      headerAccent: "text-[#4599FF]",
      avatarBg: "bg-[#1877F2]/25 border-[#1877F2]/75 text-[#4599FF]",
      customerBubble:
        "bg-[#303030] text-[#E4E6EB] border border-white/10 rounded-[16px] rounded-bl-[4px]",
      aiBubble:
        "bg-[#0084FF] text-white border border-[#4599FF]/50 rounded-[16px] rounded-br-[4px]",
      aiLabel: "text-white/85",
      connectorColor: "bg-[#1877F2]/65",
      activeRing: "border-[#1877F2]/80 bg-[#1877F2]/15",
      statusText: "Messenger",
    },
    messages: [
      {
        sender: "customer",
        label: "Kelvin",
        text: "Do you have plots in Karen?",
        time: "15:40",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "We do. May I have your name so I can assign you to an agent?",
        time: "15:40",
      },
      {
        sender: "customer",
        label: "Kelvin",
        text: "Kelvin",
        time: "15:41",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "Thanks Kelvin, what's the best phone number to reach you at?",
        time: "15:41",
      },
      {
        sender: "customer",
        label: "Kelvin",
        text: "0700 000 004",
        time: "15:42",
      },
      {
        sender: "ai",
        label: "Cillah AI",
        text: "Thanks. Dan will reach out to you shortly on 0700 000 104.",
        time: "15:42",
      },
    ],
  },
]

interface ChatBubbleProps {
  message: ChatMessage
  theme: ChannelTheme
  reducedMotion: boolean
  compact?: boolean
}

function ChatBubble({
  message,
  theme,
  reducedMotion,
  compact = false,
}: ChatBubbleProps) {
  const isAi = message.sender === "ai"

  const bubbleClasses = isAi ? theme.aiBubble : theme.customerBubble
  const alignmentClasses = isAi ? "ml-3 sm:ml-5" : "mr-3 sm:mr-5"
  const spacingClasses = compact
    ? "px-2.5 py-2 text-[11.5px] xl:text-[12px] leading-[1.4]"
    : "px-3.5 py-2.5 text-[13px] sm:text-[14px] leading-relaxed"

  const content = (
    <div className={`${alignmentClasses} ${bubbleClasses} ${spacingClasses} text-left break-words`}>
      {isAi && (
        <span
          className={`block font-heading font-semibold uppercase tracking-[0.12em] mb-0.5 ${
            compact ? "text-[9px]" : "text-[10px]"
          } ${theme.aiLabel}`}
        >
          {message.label}
        </span>
      )}
      <p className="font-sans font-normal">{message.text}</p>
      <div className="mt-1 flex items-center justify-end gap-1 opacity-70">
        <span className={compact ? "text-[9px]" : "text-[10px]"}>{message.time}</span>
        {isAi && theme.showDoubleChecks && (
          <svg
            viewBox="0 0 16 11"
            className="h-2.5 w-3.5 text-[#53BDEB] shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1 5.5 4.2 8.7 10.5 2" />
            <path d="M5.5 5.5 8.7 8.7 15 2" />
          </svg>
        )}
      </div>
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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C9A66B]/15 border border-[#C9A66B]/45 text-[#C9A66B] font-heading font-medium text-[11px] tracking-wide">
      <span className="h-1.5 w-1.5 rounded-full bg-[#C9A66B]" />
      {label}
    </span>
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
  forceFinalFrame?: boolean
  playNonce: number
  onComplete: () => void
}

// Total steps per channel = messages.length + 1 (the final step reveals the "Assigned to ..." tag)
const FINAL_DESKTOP_STEPS = CHANNELS.map((c) => c.messages.length + 1)
const EMPTY_DESKTOP_STEPS = CHANNELS.map(() => 0)

export function Scene1Inquiries({
  shouldPlay,
  reducedMotion,
  forceFinalFrame = false,
  playNonce,
  onComplete,
}: Scene1InquiriesProps) {
  const timersRef = useRef<number[]>([])
  const desktopScrollRefs = useRef<(HTMLDivElement | null)[]>([])
  const mobileScrollRef = useRef<HTMLDivElement | null>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  const instantFinal = reducedMotion || forceFinalFrame

  const [isDesktop, setIsDesktop] = useState<boolean>(false)
  const [desktopSteps, setDesktopSteps] = useState<number[]>(() =>
    instantFinal ? FINAL_DESKTOP_STEPS : EMPTY_DESKTOP_STEPS
  )
  const [mobileChannelIdx, setMobileChannelIdx] = useState<number>(0)
  const [mobileStep, setMobileStep] = useState<number>(() =>
    instantFinal ? CHANNELS[0].messages.length + 1 : 0
  )
  const [sequenceFinished, setSequenceFinished] = useState<boolean>(instantFinal)

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

    if (instantFinal) {
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
      // Desktop (>= 1024px): staggered columns across all 5 channels (~6.4s total)
      setDesktopSteps(EMPTY_DESKTOP_STEPS)

      const channelStaggerMs = 750
      const bubbleIntervalMs = 460
      let maxTime = 0

      CHANNELS.forEach((channel, colIdx) => {
        const channelStart = 150 + colIdx * channelStaggerMs
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
      // Phone & Tablet (< 1024px): single conversation panel playing each channel in turn (~11.7s total)
      setMobileChannelIdx(0)
      setMobileStep(0)

      let cursorMs = 150
      const bubbleIntervalMs = 280
      const channelHoldMs = 500

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
      }, cursorMs - channelHoldMs + 350)
    }

    return () => {
      clearAllTimers()
    }
  }, [shouldPlay, instantFinal, playNonce, isDesktop])

  // Auto-scroll desktop chat windows to newest bubble as messages arrive
  useEffect(() => {
    desktopScrollRefs.current.forEach((el) => {
      if (el) {
        el.scrollTo({
          top: el.scrollHeight,
          behavior: instantFinal ? "auto" : "smooth",
        })
      }
    })
  }, [desktopSteps, instantFinal])

  // Auto-scroll mobile/tablet chat panel to newest bubble as messages arrive
  useEffect(() => {
    const el = mobileScrollRef.current
    if (el) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: instantFinal ? "auto" : "smooth",
      })
    }
  }, [mobileStep, mobileChannelIdx, instantFinal])

  const activeMobileChannel = CHANNELS[mobileChannelIdx]
  const visibleMobileMessages = activeMobileChannel.messages.slice(
    0,
    Math.min(mobileStep, activeMobileChannel.messages.length)
  )
  const showMobileTag = mobileStep > activeMobileChannel.messages.length

  const handleSelectMobileChannel = (idx: number) => {
    if (!sequenceFinished && !instantFinal) return
    setMobileChannelIdx(idx)
    setMobileStep(CHANNELS[idx].messages.length + 1)
  }

  return (
    <div className="w-full">
      {/* DESKTOP VIEW (>= 1024px): 5 columns across with real brand logos & native dark-mode chat interfaces */}
      <div className="hidden lg:grid lg:grid-cols-5 lg:gap-3.5 xl:gap-4 items-stretch">
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
              {/* Real Platform Logo Header */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={`p-1 rounded-2xl border transition-all duration-300 ${
                    isActive
                      ? `${channel.theme.activeRing} scale-105`
                      : "border-white/10 bg-[#1C1C1C]/70 opacity-85"
                  }`}
                >
                  <ChannelBrandLogo id={channel.id} className="h-9 w-9" />
                </div>
                <span
                  className={`font-heading text-[12px] font-medium tracking-wide transition-colors duration-300 ${
                    isActive ? "text-[#F9F7F6]" : "text-[#F9F7F6]/65"
                  }`}
                >
                  {channel.name}
                </span>
              </div>

              {/* Vertical Connector */}
              <div
                className={`h-3.5 w-px my-1.5 transition-colors duration-300 ${
                  isActive ? channel.theme.connectorColor : "bg-white/10"
                }`}
              />

              {/* Real-Life Platform Chat Window */}
              <div
                className={`w-full rounded-[16px] ${channel.theme.shellBg} border border-white/10 overflow-hidden flex flex-col justify-between h-[430px] min-w-0 shadow-[0_12px_32px_rgba(0,0,0,0.35)]`}
              >
                <div className="flex flex-col flex-1 min-h-0">
                  {/* Platform Mini Chat Top Bar */}
                  <div
                    className={`px-3 py-2 flex items-center justify-between gap-2 shrink-0 ${channel.theme.headerBg}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`h-6 w-6 rounded-full border text-[11px] font-heading font-semibold flex items-center justify-center shrink-0 ${channel.theme.avatarBg}`}
                      >
                        {channel.customerInitial}
                      </span>
                      <div className="text-left min-w-0">
                        <p className="font-heading text-[11.5px] font-medium text-[#F9F7F6] leading-tight truncate">
                          {channel.customerName}
                        </p>
                        <p className={`text-[9.5px] leading-tight ${channel.theme.headerAccent}`}>
                          {channel.theme.statusText}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Alternating Chat Bubbles (auto-scrolls smoothly as messages arrive) */}
                  <div
                    ref={(el) => {
                      desktopScrollRefs.current[colIdx] = el
                    }}
                    className="p-2.5 space-y-2 flex-1 overflow-y-auto scrollbar-thin"
                  >
                    {visibleMessages.map((msg, mIdx) => (
                      <ChatBubble
                        key={`${channel.id}-${playNonce}-${mIdx}`}
                        message={msg}
                        theme={channel.theme}
                        reducedMotion={instantFinal}
                        compact
                      />
                    ))}
                  </div>
                </div>

                <div className="px-2.5 py-2 border-t border-white/10 bg-[#07070B]/45 text-left min-h-[40px] flex items-center shrink-0">
                  {showTag && (
                    <AssignedTag
                      key={`${channel.id}-tag-${playNonce}`}
                      label={channel.assignedTag}
                      reducedMotion={instantFinal}
                    />
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* PHONE & TABLET VIEW (< 1024px): 5 real platform logos on top + native-styled active chat panel */}
      <div className="lg:hidden w-full max-w-xl mx-auto">
        {/* Five Real Brand Logos Row */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-3 mb-4">
          {CHANNELS.map((channel, idx) => {
            const isActive = idx === mobileChannelIdx && (shouldPlay || instantFinal)
            const isInteractive = sequenceFinished || instantFinal

            return (
              <div
                key={channel.id}
                onClick={isInteractive ? () => handleSelectMobileChannel(idx) : undefined}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-[14px] border px-1 py-2 sm:py-2.5 min-w-0 transition-all duration-300 ${
                  isActive
                    ? `${channel.theme.activeRing} scale-[1.03]`
                    : "bg-[#1C1C1C] border-white/10 opacity-75"
                } ${isInteractive ? "cursor-pointer hover:opacity-100" : ""}`}
              >
                <ChannelBrandLogo id={channel.id} className="h-7 w-7 sm:h-8 sm:w-8 shrink-0" />
                <span className="hidden sm:block font-heading text-[11px] font-medium text-[#F9F7F6]/90 truncate max-w-full">
                  {channel.name}
                </span>
              </div>
            )
          })}
        </div>

        {/* Single Native-Styled Conversation Panel */}
        <div
          className={`w-full rounded-[16px] ${activeMobileChannel.theme.shellBg} border border-white/10 overflow-hidden text-left h-[460px] sm:h-[470px] flex flex-col justify-between shadow-[0_12px_32px_rgba(0,0,0,0.35)]`}
        >
          <div className="flex flex-col flex-1 min-h-0">
            {/* Native Chat Header */}
            <div
              className={`px-4 py-3 flex items-center justify-between gap-2 shrink-0 ${activeMobileChannel.theme.headerBg}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <ChannelBrandLogo id={activeMobileChannel.id} className="h-7 w-7 shrink-0" />
                <div className="min-w-0">
                  <p className="font-heading text-[13px] sm:text-[14px] font-medium text-[#F9F7F6] leading-tight truncate">
                    {activeMobileChannel.customerName}{" "}
                    <span className="text-[#F9F7F6]/50 font-normal">
                      &bull; {activeMobileChannel.name}
                    </span>
                  </p>
                  <p className={`text-[11px] leading-tight ${activeMobileChannel.theme.headerAccent}`}>
                    {activeMobileChannel.theme.statusText}
                  </p>
                </div>
              </div>
              <span className="text-[11px] font-heading font-medium text-[#F9F7F6]/60 shrink-0">
                {mobileChannelIdx + 1} / {CHANNELS.length}
              </span>
            </div>

            {/* Alternating Left / Right Chat Messages (auto-scrolls smoothly) */}
            <div
              ref={mobileScrollRef}
              className="p-4 sm:p-5 space-y-2.5 flex-1 overflow-y-auto scrollbar-thin"
            >
              {visibleMobileMessages.map((msg, mIdx) => (
                <ChatBubble
                  key={`${activeMobileChannel.id}-${playNonce}-${mIdx}`}
                  message={msg}
                  theme={activeMobileChannel.theme}
                  reducedMotion={instantFinal}
                />
              ))}
            </div>
          </div>

          <div className="px-4 py-3 border-t border-white/10 bg-[#07070B]/45 min-h-[48px] flex items-center shrink-0">
            {showMobileTag && (
              <AssignedTag
                key={`${activeMobileChannel.id}-tag-${playNonce}`}
                label={activeMobileChannel.assignedTag}
                reducedMotion={instantFinal}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
