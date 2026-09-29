"use client"

import { useState, useEffect, useRef } from "react"
import { motion, useInView } from "framer-motion"

export function InboxPremiumSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: false, amount: 0.3 })
  const [unreadCount, setUnreadCount] = useState(3)

  useEffect(() => {
    if (isInView) {
      const timers = [
        setTimeout(() => setUnreadCount(6), 1500),
        setTimeout(() => setUnreadCount(11), 3000),
        setTimeout(() => setUnreadCount(18), 4500)
      ]
      return () => timers.forEach(clearTimeout)
    } else {
      setUnreadCount(3)
    }
  }, [isInView])

  const chats = [
    { time: "9:36 PM", text: "Where is this located?", phone: "+254 7XX XXX XXX", blur: "blur-0", opacity: "opacity-100", overflowDest: "left", delay: 1.8 },
    { time: "9:27 PM", text: "How much is it?", phone: "+254 7XX XXX XXX", blur: "blur-0", opacity: "opacity-100", overflowDest: "none", delay: 1.5 },
    { time: "9:18 PM", text: "Is it still on the market?", phone: "+254 7XX XXX XXX", blur: "blur-[0.5px]", opacity: "opacity-95", overflowDest: "right", delay: 1.2 },
    { time: "9:12 PM", text: "Location?", phone: "+254 7XX XXX XXX", blur: "blur-[1px]", opacity: "opacity-90", overflowDest: "none", delay: 0.9 },
    { time: "9:03 PM", text: "Price?", phone: "+254 7XX XXX XXX", blur: "blur-[1.5px]", opacity: "opacity-80", overflowDest: "none", delay: 0.6 },
    { time: "8:52 PM", text: "Can I get more info?", phone: "+254 7XX XXX XXX", blur: "blur-[2px]", opacity: "opacity-60", overflowDest: "none", delay: 0.3 },
    { time: "8:47 PM", text: "Is this still available?", phone: "+254 7XX XXX XXX", blur: "blur-[3px]", opacity: "opacity-40", overflowDest: "none", delay: 0.1 },
  ]

  return (
    <section ref={containerRef} className="relative bg-[#05070A] min-h-[90vh] py-24 md:py-32 flex items-center overflow-hidden">
      {/* Cinematic Dark Background & Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-[#00B2FF]/10 blur-[150px] rounded-full -translate-y-1/2" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#00B2FF]/5 blur-[120px] rounded-full" />
      </div>

      <div className="container mx-auto px-4 max-w-7xl relative z-10 md:mt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* LEFT SIDE: COPY */}
          <div className="flex flex-col order-1">
            <h1 className="text-4xl md:text-5xl lg:text-[52px] font-bold text-white leading-[1.1] tracking-tight mb-10">
              You Are Losing Buyers Before <br className="hidden lg:block"/>Your Team Even Sees the Message
              <span className="block text-2xl md:text-3xl lg:text-4xl text-muted-foreground mt-6 font-semibold leading-snug">
                Every Delayed Reply Is a Lost Property Viewing
              </span>
            </h1>
            
            <div className="text-lg md:text-xl text-white/60 leading-relaxed font-medium space-y-2 mb-12 lg:mb-20">
              <p>How many times can one person answer</p>
              <p className="text-white/90">“Is this still available?”</p>
              <p className="text-white/90">“Can I get more details?”</p>
              <p>across WhatsApp, Instagram, Facebook, and TikTok —</p>
              <p>as inquiries keep coming in, one after another?</p>
            </div>
            
            {/* Desktop Micro Line & CTA */}
            <div className="hidden lg:flex flex-col items-start mt-8">
              <p className="text-base text-white/40 max-w-md leading-relaxed font-medium mb-6">
                While your team is sleeping, busy, or handling other clients — inquiries keep coming.
              </p>
              <a 
                href="https://cal.com/airaptorfx/ai-automation-strategy-call" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-8 py-4 text-white font-bold text-lg bg-[#00B2FF] hover:bg-[#33C2FF] rounded-xl shadow-[0_4px_14px_0_rgba(0,178,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,178,255,0.5)] hover:-translate-y-0.5 transition-all duration-200"
              >
                Book Your Automation Audit
              </a>
            </div>
          </div>

          {/* RIGHT SIDE: PHONE MOCKUP */}
          <div className="relative w-full max-w-[380px] mx-auto order-2 lg:ml-auto">
            
            {/* Phone Frame */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative z-10 w-full rounded-[40px] border border-white/5 bg-[#0A0D14]/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_0_1px_rgba(0,178,255,0.15),inset_0_2px_20px_rgba(0,178,255,0.05)] flex flex-col h-[700px]"
            >
              {/* Fake Phone Notch */}
              <div className="absolute top-0 inset-x-0 h-6 bg-[#05070A] z-20 rounded-b-xl mx-24 border-b border-white/5 shadow-inner"></div>
              
              {/* Phone Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5 pt-10 px-6">
                <h3 className="text-xl font-bold text-white tracking-tight">Messages</h3>
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
                  className="px-3 py-1 rounded-full bg-[#00B2FF]/10 border border-[#00B2FF]/30 text-[#00B2FF] text-xs font-bold shadow-[0_0_15px_rgba(0,178,255,0.2)] transition-all duration-300"
                >
                  <span className="font-mono">{unreadCount}</span> Unread
                </motion.div>
              </div>

              {/* Chat List */}
              <div className="flex-1 mt-4 relative px-4 pb-6 flex flex-col">
                {chats.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                    transition={{ delay: msg.delay, duration: 0.8, ease: "easeOut" }}
                    className={`relative p-3 mb-3 rounded-2xl flex gap-3 transition-all duration-1000 ${
                      msg.overflowDest === "left" 
                        ? "-ml-6 sm:-ml-12 mr-6 sm:mr-8 bg-[#0A0D14] border border-[#00B2FF]/30 shadow-[0_10px_30px_rgba(0,178,255,0.15)] z-30" 
                        : msg.overflowDest === "right"
                          ? "-mr-6 sm:-mr-12 ml-6 sm:ml-8 bg-[#0A0D14] border border-[#00B2FF]/20 shadow-[0_10px_30px_rgba(0,178,255,0.1)] z-20"
                          : "border border-white/5 bg-white/[0.02] z-10"
                    } ${msg.blur} ${msg.opacity}`}
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-bold text-white text-sm truncate pr-2">{msg.phone}</p>
                        <p className="text-[10px] text-[#00B2FF] font-medium shrink-0">{msg.time}</p>
                      </div>
                      <p className="text-xs text-muted-foreground truncate font-medium">{msg.text}</p>
                    </div>
                    {/* Unread dot */}
                    <div className="flex flex-col items-end justify-center shrink-0">
                      <div className="w-4 h-4 rounded-full bg-[#00B2FF] flex items-center justify-center shadow-[0_0_8px_rgba(0,178,255,0.6)]">
                         <span className="text-[9px] text-black font-bold">1</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Soft gradient mask at the bottom to fake endless overflow */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0D14] to-transparent pointer-events-none rounded-b-[40px] z-40" />
            </motion.div>

          </div>

          {/* Mobile Micro Line & CTA */}
          <div className="flex flex-col items-center lg:hidden order-3 mt-8 text-center px-4 w-full">
            <p className="text-sm text-white/40 max-w-sm mx-auto leading-relaxed font-medium mb-6">
              While your team is sleeping, busy, or handling other clients — inquiries keep coming.
            </p>
            <a 
              href="https://cal.com/airaptorfx/ai-automation-strategy-call" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-8 py-4 w-full sm:w-auto text-white font-bold text-lg bg-[#00B2FF] hover:bg-[#33C2FF] rounded-xl shadow-[0_4px_14px_0_rgba(0,178,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,178,255,0.5)] hover:-translate-y-0.5 transition-all duration-200"
            >
              Book Your Automation Audit
            </a>
          </div>

        </div>
      </div>
    </section>
  )
}
