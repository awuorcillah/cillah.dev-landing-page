"use client"

import { motion } from "framer-motion"
import {
  Globe,
  Filter,
  CalendarCheck,
  Users,
  Workflow,
} from "lucide-react"
import { SectionWrapper } from "@/components/section-wrapper"
import { PROGRAM_FEATURES } from "@/lib/constants"

const iconMap = {
  Globe,
  Filter,
  CalendarCheck,
  Users,
  Workflow,
} as const

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function ProgramFeatures() {
  return (
    <SectionWrapper id="features">
      <h2 className="text-balance text-center text-3xl font-bold tracking-tight text-foreground md:text-4xl">
        {PROGRAM_FEATURES.headline}
      </h2>

      <motion.div
        className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {PROGRAM_FEATURES.features.map((feature, i) => {
          const Icon = iconMap[feature.icon]
          return (
            <motion.div
              key={i}
              variants={cardVariants}
              transition={{ duration: 0.5 }}
              className="glass flex flex-col gap-4 rounded-2xl p-5 md:p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <Icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <ul className="flex flex-col gap-2">
                {feature.bullets.map((bullet, j) => (
                  <li
                    key={j}
                    className="flex items-center gap-2 text-sm leading-relaxed text-muted-foreground"
                  >
                    <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </motion.div>
          )
        })}
      </motion.div>
    </SectionWrapper>
  )
}
