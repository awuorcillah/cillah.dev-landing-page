"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { 
  Check, 
  Server, 
  ShieldCheck, 
  ArrowRight, 
  Sparkles,
  Layers,
  Lock,
  Building2,
  Users
} from "lucide-react"

export default function PricingPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-[#FBECE8] via-[#FFF9F6] to-[#FBECE8] text-[#1E1E1E] overflow-x-hidden font-sans font-light relative pt-32 sm:pt-40 md:pt-48 pb-20">
        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-[#C9A66B]/8 blur-[160px] pointer-events-none -z-10" />
        <div className="absolute top-[40%] right-10 w-[500px] h-[500px] rounded-full bg-[#E5A3AB]/10 blur-[140px] pointer-events-none -z-10" />

        {/* 1. HERO HEADER */}
        <section className="container mx-auto max-w-5xl px-6 md:px-12 text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C9A66B]/10 border border-[#C9A66B]/25 text-[#C9A66B] mb-6 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase">
              Deployment Models & Pricing
            </span>
          </div>
          
          <h1 className="font-heading font-light text-[36px] sm:text-[46px] md:text-[56px] leading-[1.15] text-[#1E1E1E] mb-6">
            Transparent Pricing Built Around Your Strategy
          </h1>
          
          <p className="text-base sm:text-lg text-[#1E1E1E]/70 max-w-3xl mx-auto font-light leading-relaxed">
            Choose how your AI automation infrastructure is deployed. Whether fully managed on our high-speed servers or integrated directly into your own company infrastructure, we deliver solutions tailored strictly to your scope of work.
          </p>

          <div className="w-20 h-[1px] bg-[#C9A66B]/30 mx-auto mt-10" />
        </section>

        {/* 2. PRICING TIERS GRID */}
        <section className="container mx-auto max-w-6xl px-4 sm:px-6 md:px-12 mb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-5xl mx-auto">
            
            {/* TIER 1: Managed & Hosted Infrastructure */}
            <div className="rounded-[28px] p-8 sm:p-10 bg-[#FFFDFB] border border-[#C9A66B]/30 hover:border-[#C9A66B]/60 transition-all duration-300 shadow-[0_10px_35px_rgba(201,166,107,0.08)] flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A66B]/5 blur-2xl rounded-full" />
              
              <div>
                {/* Header Badge & Icon */}
                <div className="flex items-center justify-between gap-2 mb-6">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[#C9A66B]/15 text-[#C9A66B] border border-[#C9A66B]/30">
                    Tier 1: Managed & Hosted
                  </span>
                  <Server className="h-5 w-5 text-[#C9A66B]" />
                </div>

                <h2 className="font-heading font-normal text-[26px] sm:text-[30px] text-[#1E1E1E] mb-3 leading-snug">
                  Hosted Infrastructure (SaaS)
                </h2>

                <p className="text-xs sm:text-sm text-[#1E1E1E]/70 leading-relaxed font-light mb-6">
                  We build, host, and maintain all code and AI workflows on our secure cloud servers. Your team logs in directly through <strong className="font-medium text-[#1E1E1E]">cillah.dev</strong> to access client details, leads, and operational workflows.
                </p>

                {/* Ownership & Control Pill */}
                <div className="p-4 rounded-2xl bg-[#C9A66B]/5 border border-[#C9A66B]/20 mb-8 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#C9A66B]">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>Code Ownership & Access Controls</span>
                  </div>
                  <p className="text-[12px] text-[#1E1E1E]/75 leading-relaxed font-light">
                    • <strong>Code Ownership:</strong> We own and manage the underlying engine code, server hosting, and automation workflows.<br/>
                    • <strong>Role Permissions:</strong> Granular multi-tiered dashboard control for <strong>Admin</strong>, <strong>Sales</strong>, and <strong>Marketing</strong> teams.
                  </p>
                </div>

                {/* Pricing Structure */}
                <div className="space-y-3 pb-6 border-b border-black/5">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase font-semibold text-black/50 tracking-wider">One-Time Build Cost</span>
                    <span className="font-heading font-semibold text-sm text-[#1E1E1E]">Custom (Based on Scope)</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase font-semibold text-[#C9A66B] tracking-wider">Monthly Retainer Fee</span>
                    <span className="font-heading font-bold text-base text-[#C9A66B]">Hosting + Retainer Cost</span>
                  </div>
                </div>

                {/* Features Bullet List */}
                <ul className="space-y-3 my-6">
                  {[
                    "Custom AI workflow & agent development",
                    "Full hosting on high-speed cloud infrastructure",
                    "Direct portal login via cillah.dev",
                    "Multi-tier control (Admin, Sales & Marketing roles)",
                    "Continuous automated server monitoring & backups",
                    "Bug fixes, security updates & workflow health checks"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1E1E1E]/80 font-light">
                      <Check className="h-4 w-4 text-[#C9A66B] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-black/5">
                <a
                  href="/book-consultation"
                  className="w-full py-4 px-6 rounded-[16px] bg-[#C9A66B] text-white hover:bg-[#b59357] font-heading font-semibold text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(201,166,107,0.3)] hover:shadow-lg"
                >
                  Book a Consultation
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* TIER 2: Enterprise Self-Hosted */}
            <div className="rounded-[28px] p-8 sm:p-10 bg-[#16161A] text-white border border-[#C9A66B]/50 hover:border-[#C9A66B] transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.18)] flex flex-col justify-between relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#C9A66B]/10 blur-2xl rounded-full" />
              
              <div>
                {/* Header Badge & Icon */}
                <div className="flex items-center justify-between gap-2 mb-6">
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[#C9A66B] text-[#16161A] font-bold">
                    Tier 2: Enterprise Self-Hosted
                  </span>
                  <Building2 className="h-5 w-5 text-[#C9A66B]" />
                </div>

                <h2 className="font-heading font-normal text-[26px] sm:text-[30px] text-white mb-3 leading-snug">
                  Enterprise On-Premises
                </h2>

                <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-light mb-6">
                  We build and deploy everything directly on your company&apos;s server and website infrastructure. Your business owns 100% of the code, with ongoing maintenance handled via a dedicated monthly retainer.
                </p>

                {/* Ownership Pill */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-8 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#C9A66B]">
                    <ShieldCheck className="h-4 w-4 shrink-0" />
                    <span>Complete Code & Server Ownership</span>
                  </div>
                  <p className="text-[12px] text-white/75 leading-relaxed font-light">
                    • <strong>Code Ownership:</strong> Your company owns all custom source code, database architectures, and workflows completely.<br/>
                    • <strong>Deployment:</strong> Hosted directly on your website and enterprise servers.
                  </p>
                </div>

                {/* Pricing Structure */}
                <div className="space-y-3 pb-6 border-b border-white/10">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase font-semibold text-white/50 tracking-wider">One-Time Build Cost</span>
                    <span className="font-heading font-semibold text-sm text-white">Custom (Based on Scope)</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase font-semibold text-[#C9A66B] tracking-wider">Monthly Maintenance Retainer</span>
                    <span className="font-heading font-bold text-base text-[#C9A66B]">Ongoing Maintenance Cost</span>
                  </div>
                </div>

                {/* Features Bullet List */}
                <ul className="space-y-3 my-6">
                  {[
                    "Deployed directly on your company website & server stack",
                    "100% complete source code & workflow ownership",
                    "Seamless integration into existing corporate databases & CRMs",
                    "Custom admin, sales & marketing role configurations",
                    "Monthly retainer for ongoing maintenance & performance updates",
                    "Dedicated technical support & infrastructure health checks"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-white/80 font-light">
                      <Check className="h-4 w-4 text-[#C9A66B] shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 border-t border-white/10">
                <a
                  href="/book-consultation"
                  className="w-full py-4 px-6 rounded-[16px] bg-[#C9A66B] text-[#16161A] hover:bg-[#d6b478] font-heading font-semibold text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(201,166,107,0.3)] hover:shadow-lg"
                >
                  Book a Consultation
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </div>

          </div>
        </section>

        {/* 3. SCOPE NOTE SECTION */}
        <section className="container mx-auto max-w-4xl px-6 md:px-12 mb-20">
          <div className="p-8 rounded-[24px] bg-[#FFFDFB] border border-[#C9A66B]/20 text-center shadow-[0_4px_20px_rgba(201,166,107,0.05)]">
            <h3 className="font-heading font-medium text-lg text-[#1E1E1E] mb-2">
              Scope of Work & Pricing Customization
            </h3>
            <p className="text-xs sm:text-sm text-[#1E1E1E]/70 max-w-2xl mx-auto leading-relaxed font-light">
              Because every real estate agency and enterprise operates with unique databases, workflows, and integrations, initial build costs depend on your exact scope of work. We outline all deliverables transparently during your initial consultation.
            </p>
          </div>
        </section>

        {/* 4. FINAL CTA SECTION */}
        <section className="container mx-auto max-w-4xl px-6 md:px-12 text-center">
          <div className="rounded-[32px] bg-gradient-to-b from-[#FFFDFB] to-[#FBECE8] border border-[#C9A66B]/30 p-10 sm:p-16 relative overflow-hidden shadow-[0_10px_40px_rgba(201,166,107,0.1)]">
            <div className="max-w-2xl mx-auto">
              <h2 className="font-heading font-light text-[28px] sm:text-[36px] text-[#1E1E1E] mb-4 leading-snug">
                Ready to Automate Your Business Operations?
              </h2>
              <p className="text-xs sm:text-sm text-[#1E1E1E]/70 mb-8 font-light leading-relaxed">
                Schedule a consultation today to review your operational requirements, define your project scope, and select the optimal deployment tier for your team.
              </p>
              
              <a
                href="/book-consultation"
                className="inline-flex items-center justify-center py-4 px-8 rounded-[16px] bg-[#C9A66B] text-white hover:bg-[#b59357] font-heading font-semibold text-xs tracking-wider uppercase transition-all duration-300 shadow-[0_6px_25px_rgba(201,166,107,0.35)] hover:shadow-xl gap-2"
              >
                Book a Consultation
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}

