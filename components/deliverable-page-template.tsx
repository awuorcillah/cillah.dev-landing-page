"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ComparisonCard } from "@/components/comparison-card"
import { Button } from "@/components/ui/button"
import { SITE } from "@/lib/constants"
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react"

interface DeliverablePageTemplateProps {
  title: string
  tagline: string
  overview: string
  pains: { title: string; desc: string }[]
  whatItDoes: string
  howItWorksSteps: { title: string; desc: string }[]
  features: string[]
  beforeAfter: { category: string; before: string; after: string }
  testimonial: { quote: string; author: string; role: string }
}

export function DeliverablePageTemplate({
  title,
  tagline,
  overview,
  pains,
  whatItDoes,
  howItWorksSteps,
  features,
  beforeAfter,
  testimonial
}: DeliverablePageTemplateProps) {
  const openBooking = () => {
    window.location.href = SITE.calendarUrl
  }

  return (
    <>
      <Navbar onOpenBooking={openBooking} />

      <main className="pt-20">
        {/* HERO */}
        <section className="py-20 bg-[#05070A]">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <p className="text-[var(--primary-accent)] font-bold uppercase tracking-widest mb-4">Dedicated System Layer</p>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">{title}</h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10">{tagline}</p>
              <Button 
                size="lg" 
                onClick={openBooking}
                className="bg-[#00B2FF] hover:bg-[#1F6FFF] text-[#FFFFFF] font-bold h-auto py-4 px-10 text-lg rounded-full shadow-[0_0_20px_rgba(0,178,255,0.3)] hover:shadow-[0_0_30px_rgba(31,111,255,0.4)] transition-all duration-300 text-wrap whitespace-normal"
              >
                Book Automation Audit
              </Button>
            </motion.div>
          </div>
        </section>

        {/* PAIN POINTS */}
        <section className="py-24 bg-[#0A0F1C]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Specific Pain Points Solved</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {pains.map((pain, i) => (
                <div key={i} className="flex gap-4 p-6 glass-card">
                  <AlertCircle className="h-6 w-6 text-red-400 shrink-0" />
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{pain.title}</h3>
                    <p className="text-muted-foreground">{pain.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHAT IT DOES */}
        <section className="py-24 bg-[#05070A]">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">What the System Does</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">{whatItDoes}</p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-24 bg-[#0A0F1C]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-white mb-16 text-center">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
              {howItWorksSteps.map((step, i) => (
                <div key={i} className="relative text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--primary-accent)]/10 border border-[var(--primary-accent)]/20 flex items-center justify-center text-xl font-bold text-[var(--primary-accent)] mx-auto mb-6">
                    {i + 1}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* KEY FEATURES */}
        <section className="py-24 bg-[#05070A]">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">Key System Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-4 glass-card">
                  <CheckCircle2 className="h-5 w-5 text-[var(--primary-accent)]" />
                  <span className="text-white">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BEFORE/AFTER */}
        <section className="py-24 bg-[#0A0F1C]">
          <div className="container mx-auto px-4">
            <div className="max-w-xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-12 text-center">The Transformation</h2>
              <ComparisonCard {...beforeAfter} />
            </div>
          </div>
        </section>

        {/* TESTIMONIAL */}
        <section className="py-24 bg-[#05070A]">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto p-12 glass-card relative italic">
              <p className="text-2xl text-white mb-8">"{testimonial.quote}"</p>
              <div>
                <p className="font-bold text-white">{testimonial.author}</p>
                <p className="text-muted-foreground text-sm">{testimonial.role}</p>
              </div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="py-24 bg-[#0A0F1C]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-white mb-8">Ready to Scale Your Team's Efficiency?</h2>
            <Button 
                size="lg" 
                onClick={openBooking}
                className="bg-[#00B2FF] hover:bg-[#1F6FFF] text-[#FFFFFF] font-bold h-auto py-5 px-12 text-xl rounded-full shadow-[0_0_20px_rgba(0,178,255,0.3)] hover:shadow-[0_0_30px_rgba(31,111,255,0.4)] transition-all duration-300 text-wrap whitespace-normal"
              >
                Book Automation Audit <ArrowRight className="inline-block ml-3 h-6 w-6 shrink-0" />
              </Button>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
