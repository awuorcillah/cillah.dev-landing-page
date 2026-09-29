"use client"

import { motion } from "framer-motion"
import { 
  Zap, 
  Users, 
  Database, 
  RefreshCcw, 
  BarChart3, 
  Filter,
  ArrowRight,
  MessageCircle,
  Instagram,
  Facebook,
  Globe
} from "lucide-react"

export function SystemFlow() {
  const steps = [
    { icon: Zap, label: "Leads", sub: "Web, WA, IG, FB" },
    { icon: Filter, label: "Instant Response", sub: "Inbox Automation" },
    { icon: Users, label: "Distribution", sub: "Lead Routing" },
    { icon: RefreshCcw, label: "Automation", sub: "Booking & Follow-up" },
    { icon: Database, label: "Tracking", sub: "CRM & Pipeline" },
    { icon: BarChart3, label: "Reporting", sub: "Decision Layer" },
  ]

  return (
    <div className="w-full py-12">
      <div className="relative flex flex-col items-center gap-8 md:flex-row md:justify-between md:gap-4">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className={`group relative flex flex-col items-center ${index === 0 ? "scale-110" : ""}`}
          >
            {index === 0 ? (
              <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-secondary border border-white/10 transition-colors group-hover:border-[var(--primary-accent)]/50 group-hover:bg-secondary/80 mt-[-8px]">
                <div className="grid grid-cols-2 gap-1.5 p-1">
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#25D366]/20">
                    <MessageCircle className="h-4 w-4 text-[#25D366]" />
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#E1306C]/20">
                    <Instagram className="h-4 w-4 text-[#E1306C]" />
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#1877F2]/20">
                    <Facebook className="h-4 w-4 text-[#1877F2]" />
                  </div>
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10">
                    <Globe className="h-4 w-4 text-white/70" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary border border-white/10 transition-colors group-hover:border-[var(--primary-accent)]/50 group-hover:bg-secondary/80">
                <step.icon className="h-7 w-7 text-white transition-colors group-hover:text-[var(--primary-accent)]" />
              </div>
            )}
            
            <div className={`mt-4 text-center ${index === 0 ? "mt-5" : ""}`}>
              <p className="text-sm font-bold text-white">{step.label}</p>
              <p className="text-[10px] text-muted-foreground">{step.sub}</p>
            </div>

            {index < steps.length - 1 && (
              <div className="hidden absolute top-8 -right-4 w-8 h-px bg-white/10 md:block overflow-hidden">
                <motion.div 
                  className="absolute -top-1.5 -right-1"
                  animate={{ x: [0, 4, 0] }} 
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                >
                  <ArrowRight className="h-3 w-3 text-white/60" />
                </motion.div>
                <motion.div
                  className="absolute top-0 left-0 h-px bg-gradient-to-r from-transparent via-[var(--primary-accent)] to-transparent w-full"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear", delay: index * 0.2 }}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
