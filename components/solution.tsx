"use client"

import { motion } from "framer-motion"
import {
  Zap,
  Filter,
  CalendarCheck,
  BellRing,
} from "lucide-react"
import { SectionWrapper } from "@/components/section-wrapper"
import { SOLUTION } from "@/lib/constants"

const iconMap = {
  Zap,
  Filter,
  CalendarCheck,
  BellRing,
} as const

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function Solution() {
  return (
    <SectionWrapper id="solution">
      <h2 className="text-balance text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {SOLUTION.headline}
      </h2>

      <motion.div
        className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {SOLUTION.features.map((feature, i) => {
          const Icon = iconMap[feature.icon]
          return (
            <motion.div
              key={i}
              variants={cardVariants}
              transition={{ duration: 0.5 }}
              className="glass flex flex-col gap-4 rounded-2xl p-5 md:p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          )
        })}
      </motion.div>
    </SectionWrapper>
  )
}
