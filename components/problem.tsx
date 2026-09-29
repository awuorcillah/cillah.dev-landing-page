"use client"

import { motion } from "framer-motion"
import {
  Clock,
  CalendarOff,
  MessageSquare,
  ListX,
  AlertCircle,
  Filter,
  Zap
} from "lucide-react"
import { SectionWrapper } from "@/components/section-wrapper"
import { PROBLEM } from "@/lib/constants"

const iconMap = {
  Clock,
  CalendarOff,
  MessageSquare,
  ListX,
  AlertCircle,
  Filter,
  Zap
} as const

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function Problem() {
  return (
    <SectionWrapper id="problem">
      <h2 className="text-balance text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {PROBLEM.headline}
      </h2>

      <motion.div
        className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {PROBLEM.points.map((point, i) => {
          // @ts-ignore
          const Icon = iconMap[point.icon as keyof typeof iconMap] || AlertCircle
          return (
            <motion.div
              key={i}
              variants={cardVariants}
              transition={{ duration: 0.5 }}
              className="glass flex items-start gap-4 rounded-2xl p-5 md:p-6"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                <Icon className="h-6 w-6 text-destructive" />
              </div>
              <p className="pt-2 text-base font-medium leading-relaxed text-foreground">
                {point.title}
              </p>
            </motion.div>
          )
        })}
      </motion.div>
    </SectionWrapper>
  )
}
