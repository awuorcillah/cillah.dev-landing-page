"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { 
  Check, 
  Cpu, 
  Globe, 
  Layers, 
  TrendingUp, 
  ChevronDown,
  Award
} from "lucide-react"

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const faqs = [
    {
      q: "Who owns the AI system?",
      a: "With the Build & Transfer model, your business owns 100% of the custom source code, configurations, and integrations once delivered. Under the Build & Host and AI Partner models, Cillah.dev owns and manages the underlying hosting infrastructure and proprietary engine code, while delivering the automated service directly to your business."
    },
    {
      q: "Can I move to another pricing model later?",
      a: "Yes. You can transition between models as your business scale changes. For example, you can start with Build & Host to avoid hosting complexities, and later purchase the source code to migrate to complete ownership (Build & Transfer)."
    },
    {
      q: "Can you work with our existing CRM?",
      a: "Absolutely. Our AI systems are built with unified integrations. We regularly sync inbound conversations and qualified leads with HubSpot, Salesforce, Zoho, ActiveCampaign, and custom database APIs."
    },
    {
      q: "What happens if usage increases?",
      a: "Platform usage costs (third-party APIs, language models, and cloud servers) scale with actual customer volume. We set up custom alerts and safety thresholds in your system so you have full control over your billing limits."
    },
    {
      q: "How long does implementation take?",
      a: "Most custom builds take between 2 to 4 weeks depending on the complexity of your workflow integrations. We provide a detailed project plan and timeline before kicking off any setup."
    },
    {
      q: "Can you customise the system later?",
      a: "Yes. If you choose Build & Transfer, you can customize it yourself or hire us on a project retainer. For AI Partners, system updates, new workflow requests, and optimization sessions are fully included in your monthly retainer."
    }
  ]

  const comparisonRows = [
    { label: "Initial Build", transfer: "Custom Build", host: "Custom Build", partner: "Continuous Dev" },
    { label: "Hosting Infrastructure", transfer: "Client owned", host: "Fully managed", partner: "Fully managed" },
    { label: "24/7 Monitoring", transfer: "Client managed", host: "Included", partner: "Included" },
    { label: "System Maintenance", transfer: "Client managed", host: "Managed by Cillah.dev", partner: "Managed by Cillah.dev" },
    { label: "Bug Fixes & Updates", transfer: "Optional retainer", host: "Included", partner: "Included" },
    { label: "Software Subscriptions", transfer: "Billed directly to client", host: "Billed directly to client", partner: "Billed directly to client" },
    { label: "Source Code Ownership", transfer: "Client owns code", host: "Cillah.dev owned", hostClass: "text-[#1E1E1E]/50", partner: "Cillah.dev owned", partnerClass: "text-[#1E1E1E]/50" },
    { label: "New Features & Agents", transfer: "New proposal basis", host: "New proposal basis", partner: "Fully included" },
    { label: "Strategy Sessions", transfer: "N/A", transferClass: "text-[#1E1E1E]/30", host: "Optional add-on", partner: "Included (Quarterly)" },
    { label: "Priority Retainer Support", transfer: "Retainer only", host: "Standard email", partner: "24/7 Priority support" }
  ]

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-gradient-to-b from-[#FBECE8] to-[#FFF9F6] text-[#1E1E1E] overflow-x-hidden font-sans font-light relative pb-12">
        {/* Style override to inject custom workflow keyframe in case it's needed */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes workflow-flow {
            from {
              stroke-dashoffset: 0;
            }
            to {
              stroke-dashoffset: -212.37;
            }
          }
        `}} />

        {/* Ambient background glows */}
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full bg-[#C9A66B]/8 blur-[150px] pointer-events-none -z-10 animate-pulse" />
        <div className="absolute top-[40%] right-1/4 w-[500px] h-[500px] rounded-full bg-[#E5A3AB]/10 blur-[130px] pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] rounded-full bg-[#C9A66B]/6 blur-[140px] pointer-events-none -z-10 animate-pulse" />

        {/* 1. HERO SECTION */}
        <section className="relative pt-48 pb-20 md:pt-56 md:pb-28 flex flex-col items-center justify-center">
          <div className="container mx-auto max-w-7xl px-6 md:px-12 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-4xl mx-auto"
            >
              {/* Luxury Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/40 border border-[#C9A66B]/30 mb-8 backdrop-blur-md">
                <Award className="h-4 w-4 text-[#C9A66B]" />
                <span className="text-[11px] font-semibold tracking-[0.25em] uppercase text-[#E5A3AB]">
                  Flexible Collaboration
                </span>
              </div>
              
              <h1 className="font-heading font-light text-[36px] sm:text-[44px] md:text-[56px] leading-tight text-[#1E1E1E] mb-8">
                Choose Your Partnership Model
              </h1>
              
              <p className="text-[16px] md:text-[18px] leading-relaxed text-[#1E1E1E]/80 max-w-3xl mx-auto font-light">
                Every business operates differently. Some want complete ownership. Others prefer a trusted technology partner who manages everything. Choose the engagement model that best fits your business.
              </p>
              
              {/* Subtle gold line divider */}
              <div className="w-24 h-[1px] bg-[#C9A66B]/30 mx-auto mt-16" />
            </motion.div>
          </div>
        </section>

        {/* 2. PRICING CARDS */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto max-w-7xl px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
              
              {/* Card 1: Build & Transfer (Light Card) */}
              <div className="p-8 rounded-[28px] bg-[#FFFDFB] border border-[#C9A66B]/25 hover:border-[#E5A3AB]/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(229,163,171,0.15)] flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-20 w-20 bg-[#C9A66B]/2 blur-xl rounded-full" />
                <div>
                  {/* Top Icon */}
                  <div className="p-3 bg-[#C9A66B]/5 border border-[#C9A66B]/20 rounded-2xl text-[#C9A66B] w-fit mb-6">
                    <Layers className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading font-medium text-[24px] text-[#1E1E1E]">Build & Transfer</h3>
                  <span className="text-[12px] font-heading font-semibold uppercase tracking-wider text-[#E5A3AB] block mt-1 mb-4">Complete Ownership</span>
                  <p className="text-[14px] text-[#1E1E1E]/70 leading-relaxed font-light mb-8">
                    We design, build and deploy your AI system. Once delivered, your business owns everything and manages the platform independently.
                  </p>

                  <div className="h-[1px] bg-[#C9A66B]/15 w-full my-6" />

                  {/* Bullet points */}
                  <ul className="space-y-3.5 mb-8">
                    {[
                      "Complete custom AI build",
                      "Source code ownership",
                      "Ownership of all integrations",
                      "Ownership of all software accounts",
                      "Direct control of software subscriptions",
                      "Deployment and documentation"
                    ].map((bullet, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-[13px] text-[#1E1E1E]/80 font-light">
                        <Check className="h-3.5 w-3.5 text-[#C9A66B] shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="h-[1px] bg-[#C9A66B]/15 w-full my-6" />

                  {/* Pricing Section */}
                  <div className="mb-6">
                    <span className="text-[11px] uppercase tracking-widest text-[#1E1E1E]/45 block font-semibold">Project Setup</span>
                    <span className="text-[11px] uppercase tracking-widest text-[#E5A3AB] block mt-0.5 font-semibold">Starting From</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="font-heading font-normal text-[28px] text-[#C9A66B]">KES XX,XXX</span>
                    </div>
                    <p className="text-[12px] text-[#1E1E1E]/55 mt-2 font-light">
                      Software subscriptions billed directly to you.
                    </p>
                  </div>

                  <div className="h-[1px] bg-[#C9A66B]/15 w-full my-6" />

                  {/* Retainer Note */}
                  <p className="text-[12px] text-[#1E1E1E]/60 leading-relaxed mb-6 font-light">
                    <strong className="text-[#C9A66B] font-semibold">Optional Support:</strong> Continue working with Cillah.dev through a monthly support retainer for updates, improvements and technical support.
                  </p>

                  <a
                    href="/book-consultation"
                    className="w-full inline-flex items-center justify-center bg-transparent text-[#C9A66B] border border-[#C9A66B]/40 hover:bg-[#C9A66B] hover:text-[#FFFDFB] hover:border-[#C9A66B] font-heading font-medium rounded-[14px] py-3.5 text-[14px] tracking-wide transition-all duration-300"
                  >
                    Request Proposal
                  </a>
                </div>
              </div>

              {/* Card 2: Build & Host (Dark High-Contrast Card - Featured) */}
              <div className="p-8 rounded-[32px] bg-[#16161A] border border-[#C9A66B]/70 hover:border-[#E5A3AB]/80 transition-all duration-500 hover:-translate-y-1.5 flex flex-col justify-between relative overflow-hidden group shadow-[0_15px_40px_rgba(201,166,107,0.15)] lg:scale-105 lg:z-10">
                {/* Champagne capsule */}
                <div className="absolute top-4 right-6">
                  <span className="text-[9px] font-heading font-semibold uppercase tracking-wider text-[#16161A] bg-[#C9A66B] px-3 py-1 rounded-full">
                    Preferred by Growing Businesses
                  </span>
                </div>
                
                <div>
                  {/* Top Icon */}
                  <div className="p-3 bg-[#C9A66B]/5 border border-[#C9A66B]/30 rounded-2xl text-[#C9A66B] w-fit mb-6 mt-2">
                    <Cpu className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading font-light text-[26px] text-[#F9F7F6]">Build & Host</h3>
                  <span className="text-[12px] font-heading font-medium uppercase tracking-wider text-[#E5A3AB] block mt-1 mb-4">We Handle Everything</span>
                  <p className="text-[14px] text-[#F9F7F6]/75 leading-relaxed font-light mb-8">
                    We build, host, monitor and continuously manage your AI systems while your team simply enjoys the results.
                  </p>

                  <div className="h-[1px] bg-white/10 w-full my-6" />

                  {/* Bullet points */}
                  <ul className="space-y-3.5 mb-8">
                    {[
                      "Custom AI system",
                      "Fully managed hosting",
                      "Monitoring",
                      "Security",
                      "Automatic backups",
                      "Bug fixes",
                      "Performance optimisation",
                      "Continuous monitoring"
                    ].map((bullet, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-[13px] text-[#F9F7F6]/85 font-light">
                        <Check className="h-3.5 w-3.5 text-[#C9A66B] shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="h-[1px] bg-white/10 w-full my-6" />

                  {/* Pricing Section */}
                  <div className="mb-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[11px] uppercase tracking-widest text-[#F9F7F6]/45 block font-semibold">Project Setup</span>
                        <span className="text-[11px] uppercase tracking-widest text-[#E5A3AB] block mt-0.5 font-semibold">Starting From</span>
                        <span className="font-heading font-normal text-[22px] text-[#C9A66B] block mt-1">KES XX,XXX</span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase tracking-widest text-[#F9F7F6]/45 block font-semibold">Monthly Costs</span>
                        <span className="text-[11px] uppercase tracking-widest text-[#E5A3AB] block mt-0.5 font-semibold">Platform Usage *</span>
                        <span className="font-heading font-normal text-[15px] text-[#F9F7F6] block mt-2 leading-tight">Management Fee</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-[#F9F7F6]/45 mt-4 font-light leading-relaxed">
                      * Platform usage depends on AI consumption, integrations and hosting requirements.
                    </p>
                  </div>

                  <a
                    href="/book-consultation"
                    className="w-full inline-flex items-center justify-center bg-[#C9A66B] text-[#16161A] hover:bg-[#C9A66B]/90 font-heading font-semibold rounded-[14px] py-3.5 text-[14px] tracking-wide transition-all duration-300 hover:shadow-[0_0_20px_rgba(201,166,107,0.4)]"
                  >
                    Book Consultation
                  </a>
                </div>
              </div>

              {/* Card 3: AI Partner (Light Card) */}
              <div className="p-8 rounded-[28px] bg-[#FFFDFB] border border-[#C9A66B]/25 hover:border-[#E5A3AB]/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_30px_rgba(229,163,171,0.15)] flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute top-0 right-0 h-20 w-20 bg-[#C9A66B]/2 blur-xl rounded-full" />
                <div>
                  {/* Top Icon */}
                  <div className="p-3 bg-[#C9A66B]/5 border border-[#C9A66B]/20 rounded-2xl text-[#C9A66B] w-fit mb-6">
                    <Award className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading font-medium text-[24px] text-[#1E1E1E]">AI Partner</h3>
                  <span className="text-[12px] font-heading font-semibold uppercase tracking-wider text-[#E5A3AB] block mt-1 mb-4">Your Outsourced AI Dept</span>
                  <p className="text-[14px] text-[#1E1E1E]/70 leading-relaxed font-light mb-8">
                    For businesses that want a long-term technology partner continuously improving their automation systems.
                  </p>

                  <div className="h-[1px] bg-[#C9A66B]/15 w-full my-6" />

                  {/* Bullet points */}
                  <ul className="space-y-3.5 mb-8">
                    {[
                      "Everything in Build & Host",
                      "Monthly optimisation",
                      "New workflow requests",
                      "New AI agents",
                      "New integrations",
                      "Priority support",
                      "Strategy sessions",
                      "Quarterly system reviews"
                    ].map((bullet, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-[13px] text-[#1E1E1E]/80 font-light">
                        <Check className="h-3.5 w-3.5 text-[#C9A66B] shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="h-[1px] bg-[#C9A66B]/15 w-full my-6" />

                  {/* Pricing Section */}
                  <div className="mb-6">
                    <span className="text-[11px] uppercase tracking-widest text-[#1E1E1E]/45 block font-semibold">Monthly Cost</span>
                    <span className="text-[11px] uppercase tracking-widest text-[#E5A3AB] block mt-0.5 font-semibold">Platform Usage *</span>
                    <div className="flex items-baseline gap-1 mt-2">
                      <span className="font-heading font-normal text-[22px] text-[#C9A66B]">+ Retainer Fee</span>
                    </div>
                    <p className="text-[12px] text-[#1E1E1E]/55 mt-2 font-light">
                      Your systems evolve as your business grows.
                    </p>
                  </div>

                  <div className="h-[1px] bg-[#C9A66B]/15 w-full my-6" />

                  <a
                    href="/book-consultation"
                    className="w-full inline-flex items-center justify-center bg-transparent text-[#C9A66B] border border-[#C9A66B]/40 hover:bg-[#C9A66B] hover:text-[#FFFDFB] hover:border-[#C9A66B] font-heading font-medium rounded-[14px] py-3.5 text-[14px] tracking-wide transition-all duration-300"
                  >
                    Become a Partner
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3. COMPARISON SECTION (Ivory Editorial Table) */}
        <section className="py-24 md:py-32 border-b border-[#C9A66B]/10 bg-transparent">
          <div className="container mx-auto max-w-7xl px-6 md:px-12">
            <div className="max-w-3xl mb-16">
              <span className="text-[11px] font-heading font-medium uppercase tracking-[0.25em] text-[#C9A66B] mb-3 block">
                Matrix Analysis
              </span>
              <h2 className="font-heading font-light text-[28px] md:text-[36px] text-[#1E1E1E]">
                Compare Partnership Models
              </h2>
            </div>

            {/* Comparison Table */}
            <div className="max-w-5xl mx-auto overflow-x-auto rounded-[20px] border border-[#C9A66B]/25 bg-[#FFFDFB]/60 backdrop-blur-md shadow-[0_4px_30px_rgba(201,166,107,0.03)]">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#C9A66B]/20 bg-[#FFFDFB]/90">
                    <th className="p-6 text-[12px] font-semibold uppercase tracking-wider text-[#1E1E1E]/55">Features</th>
                    <th className="p-6 text-[13px] font-semibold tracking-wider text-[#C9A66B] text-center w-1/4">Build & Transfer</th>
                    <th className="p-6 text-[13px] font-semibold tracking-wider text-[#C9A66B] text-center w-1/4">Build & Host</th>
                    <th className="p-6 text-[13px] font-semibold tracking-wider text-[#C9A66B] text-center w-1/4">AI Partner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C9A66B]/10 font-light text-[13px] sm:text-[14px]">
                  {comparisonRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FFFDFB] transition-colors">
                      <td className="p-5 font-medium text-[#1E1E1E]/85">{row.label}</td>
                      <td className={`p-5 text-center text-[#1E1E1E]/75 ${row.transferClass || ""}`}>{row.transfer}</td>
                      <td className={`p-5 text-center text-[#1E1E1E]/75 ${row.hostClass || ""}`}>{row.host}</td>
                      <td className={`p-5 text-center text-[#1E1E1E]/75 ${row.partnerClass || ""}`}>{row.partner}</td>
                    </tr>
                  ))}
                  {/* Ownership Row */}
                  <tr className="bg-[#FFFDFB]/40 font-sans font-light">
                    <td className="p-6 font-semibold text-[13px] text-[#E5A3AB] uppercase tracking-wider">Ownership Structure</td>
                    <td className="p-6 text-center text-xs leading-relaxed text-[#1E1E1E]/80 max-w-[200px]">
                      Client owns everything.
                    </td>
                    <td className="p-6 text-center text-xs leading-relaxed text-[#1E1E1E]/80 max-w-[200px]">
                      Cillah.dev owns and manages the infrastructure while delivering the agreed service.
                    </td>
                    <td className="p-6 text-center text-xs leading-relaxed text-[#1E1E1E]/80 max-w-[200px]">
                      Cillah.dev owns and continuously evolves the platform as your dedicated AI partner.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 4. COST TRANSPARENCY SECTION (Editorial Ivory Cards) */}
        <section className="py-24 md:py-32 border-b border-[#C9A66B]/10 bg-transparent">
          <div className="container mx-auto max-w-7xl px-6 md:px-12">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-[11px] font-heading font-medium uppercase tracking-[0.25em] text-[#C9A66B] mb-3 block">
                Direct Cost Allocation
              </span>
              <h2 className="font-heading font-light text-[28px] md:text-[36px] text-[#1E1E1E]">
                Understanding Your Investment
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Card One: Platform Usage */}
              <div className="p-8 rounded-[24px] bg-[#FFFDFB] border border-[#C9A66B]/20 hover:border-[#E5A3AB]/40 hover:shadow-[0_6px_25px_rgba(229,163,171,0.06)] transition-all duration-300">
                <h4 className="text-[14px] font-heading font-semibold uppercase tracking-wider text-[#E5A3AB] mb-4">
                  Platform Usage
                </h4>
                <p className="text-[15px] leading-relaxed text-[#1E1E1E]/70 font-light">
                  AI systems consume third-party services such as language models, messaging APIs, hosting and automation platforms. These costs scale according to actual business usage.
                </p>
              </div>

              {/* Card Two: Management & Innovation */}
              <div className="p-8 rounded-[24px] bg-[#FFFDFB] border border-[#C9A66B]/20 hover:border-[#E5A3AB]/40 hover:shadow-[0_6px_25px_rgba(229,163,171,0.06)] transition-all duration-300">
                <h4 className="text-[14px] font-heading font-semibold uppercase tracking-wider text-[#E5A3AB] mb-4">
                  Management & Innovation
                </h4>
                <p className="text-[15px] leading-relaxed text-[#1E1E1E]/70 font-light">
                  Cillah.dev's management fee covers monitoring, maintenance, bug fixes, updates, improvements and continuous optimisation to ensure the system keeps delivering results as the business evolves.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. FAQ SECTION Accordion */}
        <section className="py-24 md:py-32 border-b border-[#C9A66B]/10 bg-transparent">
          <div className="container mx-auto max-w-4xl px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-[11px] font-heading font-medium uppercase tracking-[0.25em] text-[#C9A66B] mb-3 block">
                Questions & Answers
              </span>
              <h2 className="font-heading font-light text-[28px] md:text-[36px] text-[#1E1E1E]">
                Frequently Asked Questions
              </h2>
            </div>

            {/* Accordion List */}
            <div className="space-y-4 max-w-3xl mx-auto">
              {faqs.map((faq, idx) => {
                const isOpen = openFaq === idx
                return (
                  <div 
                    key={idx}
                    className="rounded-[20px] border border-[#C9A66B]/20 bg-[#FFFDFB] overflow-hidden transition-all hover:border-[#E5A3AB]/40"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : idx)}
                      className="w-full p-6 flex items-center justify-between text-left font-heading font-medium text-[16px] text-[#1E1E1E] focus:outline-none focus:ring-0 focus-visible:ring-0"
                    >
                      <span>{faq.q}</span>
                      <span className={`p-1.5 rounded-full bg-[#C9A66B]/5 border border-[#C9A66B]/10 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}>
                        <ChevronDown className="h-4 w-4 text-[#C9A66B] shrink-0" />
                      </span>
                    </button>
                    
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                        >
                          <div className="p-6 pt-0 border-t border-[#1E1E1E]/5 font-sans font-light text-[14px] md:text-[15px] leading-relaxed text-[#1E1E1E]/70 bg-[#FFF9F6]/40">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 6. FINAL CTA SECTION (Luxury Blush Pink to Gold Gradient) */}
        <section className="py-24 md:py-32 bg-transparent">
          <div className="container mx-auto max-w-5xl px-6">
            <div className="rounded-[32px] bg-gradient-to-b from-[#FFF9F6] to-[#FBECE8] border border-[#C9A66B]/25 p-8 md:p-20 text-center relative overflow-hidden shadow-[0_4px_30px_rgba(201,166,107,0.03)]">
              {/* Soft glowing champagne and rose accents */}
              <div className="absolute inset-0 bg-[#E5A3AB]/2 opacity-5 pointer-events-none" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-[#E5A3AB]/8 blur-[90px] pointer-events-none -z-10 animate-pulse" />

              <h2 className="font-heading font-light text-[30px] md:text-[38px] text-[#1E1E1E] mb-6 leading-tight">
                Let's Build Your Competitive Advantage
              </h2>
              
              <p className="text-[15px] md:text-[16px] leading-relaxed text-[#1E1E1E]/75 max-w-2xl mx-auto mb-12 font-light">
                Whether you want complete ownership or a fully managed AI ecosystem, we'll help you choose the model that fits your business.
              </p>

              {/* Luxury Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
                <a
                  href="/book-consultation"
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-[#C9A66B] text-[#FFFDFB] hover:bg-[#C9A66B]/90 font-heading font-semibold rounded-[16px] px-8 py-4 text-[14px] tracking-wide transition-all duration-300 hover:shadow-[0_0_20px_rgba(201,166,107,0.35)]"
                >
                  Book a Consultation
                </a>
                <a
                  href="/book-consultation?ref=ai-specialist"
                  className="w-full sm:w-auto inline-flex items-center justify-center bg-[#FFFDFB] text-[#1E1E1E] border border-[#1E1E1E]/15 hover:border-[#E5A3AB] font-heading font-semibold rounded-[16px] px-8 py-4 text-[14px] tracking-wide transition-all duration-300 hover:bg-[#FFFDFB]/90"
                >
                  Talk to an AI Specialist
                </a>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}
