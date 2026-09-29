"use client"

import { motion } from "framer-motion"
import { ArrowRight, Quote, Building2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SectionWrapper } from "@/components/section-wrapper"
import { SOCIAL_PROOF } from "@/lib/constants"

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

export function SocialProof() {
  return (
    <SectionWrapper id="results">
      <div className="text-center">
        <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {SOCIAL_PROOF.headline}
        </h2>
        <p className="mt-4 text-base text-muted-foreground md:text-lg">
          {SOCIAL_PROOF.subtext}
        </p>
        <Badge
          variant="secondary"
          className="mt-4 border-border bg-secondary text-muted-foreground"
        >
          {SOCIAL_PROOF.label}
        </Badge>
      </div>

      {/* Before / After Metrics */}
      <motion.div
        className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {SOCIAL_PROOF.metrics.map((metric, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            transition={{ duration: 0.5 }}
            className="glass overflow-hidden rounded-2xl"
          >
            <div className="p-5 md:p-6">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {metric.title}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-xl bg-destructive/10 p-3">
                  <p className="text-xs font-medium uppercase text-destructive/80">
                    Before
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {metric.before}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 rounded-xl bg-accent/10 p-3">
                  <p className="text-xs font-medium uppercase text-accent">
                    After
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {metric.after}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Testimonials */}
      <motion.div
        className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {SOCIAL_PROOF.testimonials.map((t, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            transition={{ duration: 0.5 }}
            className="glass flex flex-col gap-4 rounded-2xl p-5 md:p-6"
          >
            <Quote className="h-6 w-6 text-primary/40" />
            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
              {`"${t.quote}"`}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {t.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {t.name}
                </p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Transformation Stories */}
      <motion.div
        className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        transition={{ staggerChildren: 0.1 }}
      >
        {SOCIAL_PROOF.stories.map((story, i) => (
          <motion.div
            key={i}
            variants={cardVariants}
            transition={{ duration: 0.5 }}
            className="glass rounded-2xl p-5 md:p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                <Building2 className="h-5 w-5 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {story.type}
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { label: "Problem", value: story.problem },
                { label: "Automation", value: story.automation },
                { label: "Result", value: story.result },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </SectionWrapper>
  )
}
