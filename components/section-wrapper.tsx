"use client"

import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface SectionWrapperProps extends HTMLMotionProps<"section"> {
  children: React.ReactNode
  className?: string
  delay?: number
  id?: string
}

export function SectionWrapper({
  children,
  className,
  delay = 0,
  id,
  ...props
}: SectionWrapperProps) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      viewport={{ once: true, amount: 0.2 }}
      className={cn("px-4 py-16 md:py-24", className)}
      {...props}
    >
      <div className="mx-auto max-w-6xl">{children}</div>
    </motion.section>
  )
}
