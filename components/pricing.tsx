"use client"

import { motion } from "framer-motion"
import { Check, Settings, ShieldCheck, Zap } from "lucide-react"

interface PricingProps {
  onOpenBooking?: () => void
}

const pricingData = [
  {
    name: "Build & Handover",
    tagline: "We build your system. Your team takes full control.",
    priceLabel: "Customized based on scope",
    description: "We design and build your automation system based on your workflow, then hand it over fully set up and ready to run.",
    includes: [
      "Full system build",
      "Workflow design",
      "Platform integrations (WhatsApp, Instagram, Facebook, Website)",
      "Testing and deployment",
      "Initial setup guidance"
    ],
    bestFor: "Teams that want ownership and internal control.",
    recommended: false,
    icon: Settings
  },
  {
    name: "Build & Support",
    tagline: "We build it and keep it running.",
    priceLabel: "Customized based on scope and support level",
    description: "We build your system and stay involved to ensure it continues running smoothly, adapts to your needs, and performs consistently.",
    includes: [
      "Everything in Build & Handover",
      "Ongoing monitoring",
      "Updates and adjustments",
      "Bug fixes",
      "Workflow improvements"
    ],
    bestFor: "Teams that want reliability without managing everything internally.",
    recommended: false,
    icon: ShieldCheck
  },
  {
    name: "Fully Managed System",
    tagline: "We build, run, and manage everything for you.",
    priceLabel: "Customized based on system complexity",
    description: "We handle the entire system — from build to hosting to continuous optimization — so your team focuses only on closing deals.",
    includes: [
      "Full system build",
      "Hosting and infrastructure",
      "Automation management",
      "Continuous optimization",
      "Monitoring and support"
    ],
    bestFor: "Teams that want zero technical involvement and maximum performance.",
    recommended: true,
    icon: Zap
  }
]

export function Pricing({ onOpenBooking }: PricingProps) {
  return (
    <section id="pricing" className="bg-[#05070A] py-24 md:py-32 border-b border-white/5 relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#00B2FF]/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-[#00B2FF]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        
        {/* HERO */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight tracking-tight">
            Flexible Engagement Options Based on Your Business Needs
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed font-medium">
            Every real estate business operates differently. Our systems are customized to your workflow, which means scope and investment are defined based on your exact requirements.
          </p>
        </div>

        {/* PRICING STRUCTURE (3 CARDS) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-20">
          {pricingData.map((tier, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.6, ease: "easeOut" }}
              className={`relative bg-[#0A0D14]/80 backdrop-blur-xl rounded-[2rem] p-8 md:p-10 flex flex-col border transition-all duration-300 ${
                tier.recommended 
                  ? "border-[#00B2FF]/50 shadow-[0_10px_40px_-10px_rgba(0,178,255,0.2)] lg:-mt-6 z-10" 
                  : "border-white/10 hover:border-white/20 hover:bg-[#0A0D14]"
              }`}
            >
              {tier.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00B2FF] text-white text-xs font-bold uppercase tracking-widest py-2 px-6 rounded-full shadow-[0_0_20px_rgba(0,178,255,0.5)]">
                  Recommended
                </div>
              )}

              <div className="mb-8 mt-2">
                <tier.icon className={`h-10 w-10 mb-6 ${tier.recommended ? 'text-[#00B2FF] drop-shadow-[0_0_8px_rgba(0,178,255,0.6)]' : 'text-white/60'}`} />
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-3 tracking-tight">{tier.name}</h3>
                <p className="text-[#00B2FF] font-medium leading-relaxed mb-6 h-[48px]">{tier.tagline}</p>
                
                <div className="bg-white/5 border border-white/5 rounded-xl p-4 mb-6">
                  <p className="text-sm font-semibold text-white/90">
                    {tier.priceLabel}
                  </p>
                </div>
                
                <p className="text-muted-foreground text-sm leading-relaxed min-h-[80px]">
                  {tier.description}
                </p>
              </div>

              <div className="flex-1 mb-8">
                <p className="text-xs font-bold tracking-widest text-[#00B2FF]/60 uppercase mb-4">Includes</p>
                <ul className="space-y-4">
                  {tier.includes.map((item, i) => (
                    <li key={i} className="flex items-start text-sm text-white/80 font-medium">
                      <Check className={`h-4 w-4 mr-3 mt-0.5 shrink-0 ${tier.recommended ? 'text-[#00B2FF]' : 'text-[#00B2FF]/60'}`} />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">Best For</p>
                <p className="text-sm text-white/80 italic font-medium leading-relaxed min-h-[40px]">{tier.bestFor}</p>
              </div>

            </motion.div>
          ))}
        </div>

        {/* SUPPORTING SECTION */}
        <div className="max-w-4xl mx-auto bg-white/[0.02] border border-white/10 rounded-3xl p-8 md:p-12 mb-20 text-center shadow-lg relative overflow-hidden">
          <div className="absolute -right-20 -top-20 w-40 h-40 bg-white/5 blur-3xl rounded-full" />
          <h3 className="text-2xl font-bold text-white mb-4">Additional Tools and Infrastructure</h3>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Most systems rely on third-party tools such as messaging APIs, automation platforms, and hosting providers. These are billed separately depending on your setup.
          </p>
        </div>

        {/* DECISION SECTION */}
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">Not Sure Which Option Fits?</h3>
          <p className="text-xl text-muted-foreground leading-relaxed mb-10 max-w-2xl mx-auto">
            Start with the automation audit. We’ll understand your workflow and recommend the right setup based on your business goals.
          </p>
          <a 
            href="https://cal.com/airaptorfx/ai-automation-strategy-call" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-10 py-5 text-white font-bold text-xl bg-[#00B2FF] hover:bg-[#33C2FF] rounded-2xl shadow-[0_4px_14px_0_rgba(0,178,255,0.39)] hover:shadow-[0_6px_20px_rgba(0,178,255,0.5)] hover:-translate-y-0.5 transition-all duration-200"
          >
            Book Automation Audit
          </a>
        </div>

      </div>
    </section>
  )
}
