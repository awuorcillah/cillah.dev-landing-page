"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import * as Icons from "lucide-react"
import { ArrowRight } from "lucide-react"

interface DeliverableCardProps {
  id: string
  title: string
  description: string
  link: string
  icon: string
  bullets: readonly string[]
}

export function DeliverableCard({ title, description, link, icon, bullets }: DeliverableCardProps) {
  const IconComponent = (Icons as any)[icon]

  return (
    <Link href={link}>
      <motion.div
        whileHover={{ y: -5 }}
        className="group relative flex h-full flex-col glass-card p-8 transition-all hover:glow-subtle hover:border-[var(--primary-accent)]/30"
      >
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 transition-colors group-hover:bg-primary/20">
          <IconComponent className="h-6 w-6 text-[var(--primary-accent)]" />
        </div>

        <h3 className="mb-4 text-2xl font-bold text-white transition-colors group-hover:text-[var(--primary-accent)]">
          {title}
        </h3>
        
        <p className="mb-6 text-muted-foreground leading-relaxed">
          {description}
        </p>

        <ul className="mb-8 mt-auto space-y-3">
          {bullets.map((bullet, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-white/70">
              <div className="h-1 w-1 rounded-full bg-[var(--primary-accent)]" />
              {bullet}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 text-sm font-bold text-[var(--primary-accent)] opacity-0 transition-all group-hover:opacity-100">
          Learn More <ArrowRight className="h-4 w-4" />
        </div>

        <div className="absolute inset-0 z-[-1] rounded-2xl bg-gradient-to-br from-[var(--primary-accent)]/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </motion.div>
    </Link>
  )
}
