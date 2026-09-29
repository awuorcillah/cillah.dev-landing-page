"use client"

import { motion } from "framer-motion"
import {
  Megaphone,
  Bot,
  CheckCircle,
  UserCheck,
  ArrowRight,
  ArrowDown,
} from "lucide-react"
import { SectionWrapper } from "@/components/section-wrapper"
import { HOW_IT_WORKS } from "@/lib/constants"

const iconMap = {
  Megaphone,
  Bot,
  CheckCircle,
  UserCheck,
} as const

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function HowItWorks() {
  return (
    <SectionWrapper id="how-it-works">
      <h2 className="text-balance text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {HOW_IT_WORKS.headline}
      </h2>

      {/* Desktop: horizontal */}
      <motion.div
        className="mt-12 hidden items-center lg:flex"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ staggerChildren: 0.15 }}
      >
        {HOW_IT_WORKS.steps.map((step, i) => {
          const Icon = iconMap[step.icon]
          return (
            <div key={i} className="flex flex-1 items-center">
              <motion.div
                variants={cardVariants}
                transition={{ duration: 0.5 }}
                className="flex flex-1 flex-col items-center gap-4 text-center"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="text-base font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="max-w-[180px] text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>

              {i < HOW_IT_WORKS.steps.length - 1 && (
                <ArrowRight className="mx-2 h-5 w-5 shrink-0 text-muted-foreground" />
              )}
            </div>
          )
        })}
      </motion.div>

      {/* Mobile/tablet: vertical */}
      <motion.div
        className="mt-12 flex flex-col items-center gap-2 lg:hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {HOW_IT_WORKS.steps.map((step, i) => {
          const Icon = iconMap[step.icon]
          return (
            <div key={i} className="flex flex-col items-center">
              <motion.div
                variants={cardVariants}
                transition={{ duration: 0.5 }}
                className="glass flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl p-5 text-center"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="text-base font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>

              {i < HOW_IT_WORKS.steps.length - 1 && (
                <ArrowDown className="my-2 h-5 w-5 text-muted-foreground" />
              )}
            </div>
          )
        })}
      </motion.div>
    </SectionWrapper>
  )
}
