"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { 
  ArrowRight, 
  Sparkles, 
  Instagram, 
  Facebook, 
  Globe, 
  Database, 
  Calendar, 
  Phone, 
  MessageCircle, 
  Layers, 
  Bell,
  CheckCircle,
  TrendingUp,
  Cpu,
  ArrowUpRight
} from "lucide-react"

export default function HomePage() {
  const clientPortalUrl = "https://cillah.convocore.ai/"

  const scrollToHowItWorks = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })
  }

  const integrations = [
    { name: "WhatsApp", icon: <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" /> },
    { name: "Instagram", icon: <Instagram className="h-5 w-5 sm:h-6 sm:w-6" /> },
    { name: "Facebook", icon: <Facebook className="h-5 w-5 sm:h-6 sm:w-6" /> },
    { name: "TikTok", icon: <Layers className="h-5 w-5 sm:h-6 sm:w-6" /> },
    { name: "Website", icon: <Globe className="h-5 w-5 sm:h-6 sm:w-6" /> },
    { name: "CRM", icon: <Database className="h-5 w-5 sm:h-6 sm:w-6" /> },
    { name: "Calendar", icon: <Calendar className="h-5 w-5 sm:h-6 sm:w-6" /> },
    { name: "Phone Calls", icon: <Phone className="h-5 w-5 sm:h-6 sm:w-6" /> },
  ]

  const problems = [
    {
      num: "01",
      title: "Slow response times",
      desc: "Buyers wait hours for a reply because you are busy with other clients, sleeping, or tired from answering the same question repeatedly. As a result, potential customers move to another business.",
    },
    {
      num: "02",
      title: "Missed Inquiries",
      desc: "Messages from WhatsApp, Instagram, Facebook, TikTok, website chat, SMS, and email become scattered across different inboxes. Every missed response is a potential customer choosing a competitor who replied faster.",
    },
    {
      num: "03",
      title: "Manual Lead Distribution",
      desc: "Staff manually qualify leads, assign salespeople, update the CRM, confirm availability, payments, and route orders. This creates delays and causes qualified prospects to lose momentum before a sales conversation even begins.",
    },
    {
      num: "04",
      title: "Unfollowed CRM Leads",
      desc: "A lead that enters your CRM but receives no follow-up is a missed revenue opportunity. Cillah.dev keeps every lead active automatically with product updates, restock alerts, business insights, promotions, and personalized follow-up messages.",
    },
  ]

  const metrics = [
    { label: "Response Time", val: "Under 30 sec", note: "Instead of hours", category: "Speed" },
    { label: "Lead Qualification", val: "Automatic", note: "Budget, location & intent", category: "AI" },
    { label: "Lead Distribution", val: "Automatic", note: "Assigned to the right sales agent", category: "Smart" },
    { label: "Viewings", val: "more sales", note: "Without manual coordination", category: "Growth" }
  ]

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#07070B] text-[#F9F7F6] overflow-x-hidden font-sans font-light relative">
        {/* Style tag for keyframes circular path animation */}
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
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-[#C9A66B]/5 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] rounded-full bg-[#F2B6C1]/3 blur-[150px] pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-[#C9A66B]/3 blur-[120px] pointer-events-none -z-10" />

        {/* 1. HERO SECTION */}
        <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 flex flex-col items-center justify-center border-b border-white/5">
          <div className="container mx-auto max-w-5xl px-6 md:px-12 relative z-10 text-center flex flex-col items-center">
            
            {/* 1. Top 4 Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-12"
            >
              <a
                href="/login"
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-[14px] bg-white/5 border border-white/15 text-[#F9F7F6] hover:bg-white/10 hover:border-[#C9A66B]/50 font-heading font-medium text-[13px] sm:text-[14px] tracking-wide transition-all duration-300 backdrop-blur-md hover:shadow-[0_0_15px_rgba(201,166,107,0.2)]"
              >
                Login
              </a>
              <a
                href="/signup"
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-[14px] bg-[#C9A66B] text-[#07070B] hover:bg-[#C9A66B]/90 font-heading font-semibold text-[13px] sm:text-[14px] tracking-wide transition-all duration-300 hover:shadow-[0_0_20px_rgba(201,166,107,0.4)]"
              >
                Sign Up
              </a>
              <a
                href="/book-consultation"
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-[14px] bg-white/5 border border-[#C9A66B]/40 text-[#C9A66B] hover:bg-[#C9A66B]/10 hover:border-[#C9A66B] font-heading font-medium text-[13px] sm:text-[14px] tracking-wide transition-all duration-300 backdrop-blur-md hover:shadow-[0_0_20px_rgba(201,166,107,0.25)]"
              >
                Book a Consultation
              </a>
              <a
                href="/our-services"
                className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-[14px] bg-white/5 border border-white/15 text-[#F9F7F6] hover:bg-white/10 hover:border-[#F2B6C1]/50 font-heading font-medium text-[13px] sm:text-[14px] tracking-wide transition-all duration-300 backdrop-blur-md hover:shadow-[0_0_15px_rgba(242,182,193,0.2)]"
              >
                Our Services
              </a>
            </motion.div>

            {/* 2. Headline & Subtexts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
              className="max-w-4xl mx-auto flex flex-col items-center text-center mb-16"
            >
              {/* Luxury Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-[#C9A66B]" />
                <span className="text-[11px] font-medium tracking-[0.25em] uppercase text-[#F2B6C1]">
                  Ultra-Premium AI Systems
                </span>
              </div>

              {/* Luxury Headline */}
              <h1 className="font-heading font-light text-[34px] sm:text-[44px] md:text-[56px] leading-[1.12] text-[#F9F7F6] mb-8 text-balance">
                The business owner who values <br className="hidden md:inline" />
                <span className="text-[#C9A66B] font-normal italic">speed and control</span>.
              </h1>

              {/* Luxury Subtexts */}
              <div className="space-y-6 max-w-3xl mx-auto">
                <p className="text-[16px] md:text-[18px] leading-relaxed text-[#F9F7F6]/85">
                  While human agents are asleep, busy, or answering the same questions repeatedly, potential buyers are moving to competitors who respond first. Social media and the internet create more inquiries than any manual team can consistently handle.
                </p>
                <p className="text-[15px] md:text-[16px] leading-relaxed text-[#F9F7F6]/65 font-light">
                  Cillah.dev gives your business a system that responds instantly, qualifies buyers automatically, follows up continuously, and keeps converting opportunities — even when your team is offline.
                </p>
              </div>
            </motion.div>

            {/* 3. Image Below Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="w-full max-w-4xl mx-auto relative"
            >
              {/* Glowing background */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#C9A66B]/10 to-transparent rounded-[28px] blur-3xl pointer-events-none" />
              
              {/* Frame Container */}
              <div className="w-full rounded-[20px] sm:rounded-[28px] overflow-hidden border border-[#C9A66B]/25 p-2 sm:p-3.5 bg-white/5 backdrop-blur-md shadow-[0_15px_50px_rgba(0,0,0,0.4)] hover:border-[#F2B6C1]/40 transition-colors duration-500">
                <img
                  src="/ChatGPT Image Aug 4, 2026, 01_06_29 PM.png"
                  alt="Cillah Luxury AI Agent Interface"
                  className="w-full h-auto rounded-[12px] sm:rounded-[20px] object-contain block"
                  loading="eager"
                />
              </div>
            </motion.div>

          </div>
        </section>

        {/* MISSION STATEMENT SECTION — Blush Pink */}
        <section className="relative overflow-hidden py-20 md:py-28" style={{ background: "linear-gradient(135deg, #FDE8EC 0%, #FAD4DC 40%, #F9C8D4 70%, #FDE8EC 100%)" }}>
          {/* Subtle gold border lines top and bottom */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#C9A66B]/40 to-transparent" />
          <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#C9A66B]/40 to-transparent" />
          {/* Ambient glows */}
          <div className="absolute top-8 right-16 w-40 h-40 rounded-full bg-[#C9A66B]/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-8 left-16 w-56 h-56 rounded-full bg-[#F2B6C1]/25 blur-3xl pointer-events-none" />

          <div className="container mx-auto max-w-4xl px-6 md:px-12 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center"
            >
              {/* Gold accent divider */}
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#C9A66B]" />
                <Sparkles className="h-5 w-5 text-[#C9A66B]" />
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#C9A66B]" />
              </div>

              {/* Main headline */}
              <p className="font-heading font-semibold text-[22px] sm:text-[26px] md:text-[30px] leading-[1.35] text-[#2A1A1F] mb-6 text-balance">
                Cillah.dev is a Software Solutions Company that builds modern digital operating systems for businesses.
              </p>

              {/* Supporting paragraph */}
              <p className="text-[15px] md:text-[17px] leading-relaxed text-[#4A2D35]/85 max-w-3xl mx-auto font-light">
                We integrate websites, AI agents, CRM systems, social media platforms, and business software into one seamless ecosystem. Every solution is tailored to your operations, enabling you to automate workflows, track every customer interaction, centralize business data, eliminate manual work, and help your business acquire, manage, and retain customers in a&nbsp;24/7 online market.
              </p>

              {/* Bottom gold dots */}
              <div className="flex items-center justify-center gap-2 mt-10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A66B]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#C9A66B]/60" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#C9A66B]" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* 2. SEAMLESS ECOSYSTEM INTEGRATIONS */}
        <section className="py-24 md:py-32 border-b border-white/5 overflow-hidden">
          <div className="container mx-auto max-w-7xl px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Left Column: Descriptive Text */}
              <div className="max-w-xl">
                <span className="text-[11px] font-heading font-medium uppercase tracking-[0.25em] text-[#C9A66B] mb-3 block">
                  Seamless Ecosystem Integrations
                </span>
                <h2 className="font-heading font-light text-[30px] md:text-[38px] text-[#F9F7F6] mb-6 leading-tight">
                  Unify your communication, calendars, and databases.
                </h2>
                <p className="text-[15px] md:text-[16px] leading-relaxed text-[#F9F7F6]/70 mb-8 font-light">
                  We automatically synchronize inbound data from all key consumer channels directly into your CRM.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {integrations.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:border-[#F2B6C1]/20 transition-all">
                      <span className="text-[#C9A66B]">{item.icon}</span>
                      <span className="text-xs font-semibold text-[#F9F7F6]/80">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Sleek High-tech Video Player */}
              <div className="relative w-full aspect-video lg:aspect-square max-w-lg mx-auto flex items-center justify-center">
                {/* Glowing borders & backdrop rotating glow */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-[#C9A66B]/10 to-[#F2B6C1]/10 rounded-[24px] blur-3xl animate-[spin_40s_linear_infinite]" />
                
                {/* Frame Container */}
                <div className="w-full h-full rounded-[24px] overflow-hidden border border-[#C9A66B]/20 p-3 bg-white/5 backdrop-blur-lg shadow-[0_0_50px_rgba(201,166,107,0.1)] hover:border-[#F2B6C1]/40 transition-colors duration-500 flex items-center justify-center">
                  <div className="w-full h-full rounded-[16px] overflow-hidden relative bg-[#07070B]">
                    <video
                      src="/ecosystem-demo.mp4"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {/* Dark overlay to match luxury theme */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07070B]/40 via-transparent to-[#07070B]/10 pointer-events-none" />
                    {/* Sleek scanline or high-tech overlay badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#07070B]/70 border border-[#C9A66B]/30 backdrop-blur-md z-10">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#F2B6C1] animate-ping" />
                      <span className="text-[10px] font-semibold text-[#F9F7F6]/80 uppercase tracking-widest font-mono">Ecosystem Sync</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. THE FRICTION */}
        <section id="the-friction" className="py-24 md:py-32 border-b border-white/5">
          <div className="container mx-auto max-w-7xl px-6 md:px-12">
            <div className="max-w-3xl mb-16">
              <span className="text-[11px] font-heading font-medium uppercase tracking-[0.25em] text-[#C9A66B] mb-3 block">
                The Friction
              </span>
              <h2 className="font-heading font-light text-[28px] md:text-[36px] text-[#F9F7F6]">
                Why Traditional Business Sales Pipelines Leak Opportunities
              </h2>
            </div>

            {/* Premium glass cards with gold borders and blush pink hover */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {problems.map((problem, idx) => (
                <div 
                  key={idx} 
                  className="p-8 rounded-[20px] bg-white/[0.01] border border-[#C9A66B]/15 hover:border-[#F2B6C1]/40 backdrop-blur-md transition-all duration-500 hover:shadow-[0_0_30px_rgba(242,182,193,0.05)] relative overflow-hidden group flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-[#C9A66B]/5 to-transparent pointer-events-none" />
                  
                  <div>
                    {/* Header with index */}
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-heading font-medium text-[20px] md:text-[22px] text-[#F9F7F6]">
                        {problem.title}
                      </h3>
                      <span className="text-sm font-semibold tracking-wider font-mono text-[#F2B6C1]/60 group-hover:text-[#F2B6C1] transition-colors duration-300">
                        {problem.num}
                      </span>
                    </div>
                    
                    <p className="text-[15px] md:text-[16px] leading-relaxed text-[#F9F7F6]/75 font-light">
                      {problem.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. THE WORKFLOW */}
        <section id="how-it-works" className="py-24 md:py-32 border-b border-white/5">
          <div className="container mx-auto max-w-7xl px-6 md:px-12 text-center">
            <div className="max-w-3xl mx-auto mb-16">
              <span className="text-[11px] font-heading font-medium uppercase tracking-[0.25em] text-[#C9A66B] mb-3 block">
                The Workflow
              </span>
              <h2 className="font-heading font-light text-[28px] md:text-[36px] text-[#F9F7F6]">
                4 Steps to Complete Operational Autonomy
              </h2>
            </div>

            {/* Centered circular workflow image with animated flow path overlay */}
            <div className="relative max-w-xl mx-auto rounded-[24px] overflow-hidden border border-[#C9A66B]/20 p-4 bg-white/5 backdrop-blur-lg shadow-[0_0_50px_rgba(201,166,107,0.1)] group hover:border-[#F2B6C1]/40 transition-colors duration-500 flex items-center justify-center">
              
              {/* Rotating background glow */}
              <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-[#C9A66B]/15 to-[#F2B6C1]/15 rounded-[24px] blur-3xl animate-[spin_40s_linear_infinite]" />
              
              <div className="relative w-full h-full flex items-center justify-center">
                {/* PNG image */}
                <img 
                  src="/workflow-cycle.png" 
                  alt="Capture, Qualify, Convert, Close Circular Cycle" 
                  className="w-full h-auto rounded-[16px] object-contain relative z-0" 
                />
                
                {/* SVG Clockwise animated stroke flow overlay */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none z-10" 
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="33.8"
                    fill="none"
                    stroke="url(#glowGradient)"
                    strokeWidth="1.2"
                    strokeDasharray="45 167.37"
                    className="animate-[workflow-flow_7s_linear_infinite]"
                    strokeLinecap="round"
                    style={{
                      filter: "drop-shadow(0 0 6px rgba(242, 182, 193, 0.5)) drop-shadow(0 0 2px rgba(201, 166, 107, 0.3))"
                    }}
                  />
                  <defs>
                    <linearGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#F2B6C1" stopOpacity="1" />
                      <stop offset="50%" stopColor="#C9A66B" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#C9A66B" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* 5. THE SOLUTIONS (REBUILT WARM IVORY EDITORIAL SECTION) */}
        <section id="the-solutions" className="py-24 md:py-32 bg-gradient-to-b from-[#FFFCF8] to-[#FFF7F1] text-[#171717] border-b border-[#C9A66B]/10">
          <div className="container mx-auto max-w-4xl px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-[11px] font-heading font-medium uppercase tracking-[0.25em] text-[#C9A66B] mb-4 block">
                THE SOLUTION
              </span>
              <h2 className="font-heading font-light text-[28px] sm:text-[34px] md:text-[42px] leading-tight text-[#171717] mb-6">
                Move a Customer From Inquiry to Consistent Revenue
              </h2>
              <p className="text-[15px] md:text-[17px] leading-relaxed text-[#171717]/70 font-light max-w-2xl mx-auto">
                A connected AI workflow that captures interest, qualifies buyers, closes transactions, and converts customers into repeat business.
              </p>
            </div>

            {/* Vertical Stack of Luxury Editorial Cards */}
            <div className="flex flex-col gap-8">
              
              {/* Card 1 - Capture */}
              <div className="p-8 md:p-10 rounded-[24px] bg-[#FFF9F4] border border-[#C9A66B]/25 transition-all duration-500 hover:border-[#F2B6C1]/50 hover:shadow-[0_0_35px_rgba(242,182,193,0.25)] flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                <span className="font-heading font-light text-[56px] md:text-[64px] text-[#C9A66B] leading-none select-none shrink-0">01</span>
                <div>
                  <h3 className="font-heading font-medium text-[22px] md:text-[24px] text-[#171717] mb-1">Capture</h3>
                  <span className="font-sans font-semibold text-[15px] md:text-[16px] text-[#171717]/95 mb-4 block">
                    An AI agent is present the moment a buyer raises their hand.
                  </span>
                  <p className="font-sans font-light text-[14px] md:text-[15px] text-[#171717]/70 leading-relaxed">
                    Whether someone leaves a comment, sends a DM, fills a form in your website, or whatsapp your business, the AI responds instantly in your brand's tone of voice. It answers questions, guides the conversation, and moves the customer toward a clear next step instead of letting the inquiry sit unanswered for hours.
                  </p>
                </div>
              </div>

              {/* Card 2 - Qualify */}
              <div className="p-8 md:p-10 rounded-[24px] bg-[#FFF9F4] border border-[#C9A66B]/25 transition-all duration-500 hover:border-[#F2B6C1]/50 hover:shadow-[0_0_35px_rgba(242,182,193,0.25)] flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                <span className="font-heading font-light text-[56px] md:text-[64px] text-[#C9A66B] leading-none select-none shrink-0">02</span>
                <div>
                  <h3 className="font-heading font-medium text-[22px] md:text-[24px] text-[#171717] mb-1">Qualify</h3>
                  <span className="font-sans font-semibold text-[15px] md:text-[16px] text-[#171717]/95 mb-4 block">
                    The AI gathers the right information before your team gets involved.
                  </span>
                  <p className="font-sans font-light text-[14px] md:text-[15px] text-[#171717]/70 leading-relaxed">
                    For service businesses, it can ask qualifying questions, understand the customer's challenge, and check whether the request matches your offer. Leads are then categorized as spam, cold, warm, or hot, helping your team avoid wasting time on internet spam and unqualified inquiries.
                  </p>
                </div>
              </div>

              {/* Card 3 - Close */}
              <div className="p-8 md:p-10 rounded-[24px] bg-[#FFF9F4] border border-[#C9A66B]/25 transition-all duration-500 hover:border-[#F2B6C1]/50 hover:shadow-[0_0_35px_rgba(242,182,193,0.25)] flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                <span className="font-heading font-light text-[56px] md:text-[64px] text-[#C9A66B] leading-none select-none shrink-0">03</span>
                <div>
                  <h3 className="font-heading font-medium text-[22px] md:text-[24px] text-[#171717] mb-1">Close</h3>
                  <span className="font-sans font-semibold text-[15px] md:text-[16px] text-[#171717]/95 mb-4 block">
                    The AI helps complete the transaction.
                  </span>
                  <p className="font-sans font-light text-[14px] md:text-[15px] text-[#171717]/70 leading-relaxed">
                    For consultants, the goal might be collecting a consultation fee and booking a date. For product businesses, the AI can check inventory, confirm availability, verify preferences such as size or color, add the item to cart, and direct the customer to payment. In some cases, payment can be completed directly inside the conversation.
                  </p>
                </div>
              </div>

              {/* Card 4 - Convert */}
              <div className="p-8 md:p-10 rounded-[24px] bg-[#FFF9F4] border border-[#C9A66B]/25 transition-all duration-500 hover:border-[#F2B6C1]/50 hover:shadow-[0_0_35px_rgba(242,182,193,0.25)] flex flex-col md:flex-row gap-6 md:gap-10 items-start">
                <span className="font-heading font-light text-[56px] md:text-[64px] text-[#C9A66B] leading-none select-none shrink-0">04</span>
                <div>
                  <h3 className="font-heading font-medium text-[22px] md:text-[24px] text-[#171717] mb-1">Convert</h3>
                  <span className="font-sans font-semibold text-[15px] md:text-[16px] text-[#171717]/95 mb-4 block">
                    Turn first-time buyers into repeat customers.
                  </span>
                  <p className="font-sans font-light text-[14px] md:text-[15px] text-[#171717]/70 leading-relaxed">
                    Every customer is added to your CRM or database with their preferences and purchase history. When you launch new products, offers, or services, the AI can broadcast personalized messages to the right people automatically. Strong follow-up is often the difference between a one-time sale and a long-term customer.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 6. THE INTERFACE & ROSY REALTORS DASHBOARD */}
        <section className="py-24 md:py-32 border-b border-white/5 bg-[#07070B]">
          <div className="container mx-auto max-w-7xl px-6 md:px-12">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-[11px] font-heading font-medium uppercase tracking-[0.25em] text-[#C9A66B] mb-3 block">
                The Interface
              </span>
              <h2 className="font-heading font-light text-[28px] md:text-[36px] text-[#F9F7F6] mb-6">
                Complete Dashboard Visibility
              </h2>
              <p className="text-[15px] md:text-[16px] text-[#F9F7F6]/60 max-w-2xl mx-auto font-light">
                See real-time leads captured from WhatsApp, Instagram, Facebook, and Website forms — auto-qualified with buyer preferences and instantly routed to your sales team.
              </p>
            </div>

            {/* Dashboard Mockup - Customized for Rosy Realtors Nairobi */}
            <div className="max-w-6xl mx-auto rounded-[24px] bg-white/[0.01] border border-white/10 p-6 md:p-8 hover:border-[#C9A66B]/35 transition-all duration-500 shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 right-0 h-48 w-48 bg-gradient-to-bl from-[#C9A66B]/5 to-transparent pointer-events-none" />
              
              {/* Dashboard Header Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-full overflow-hidden border border-[#C9A66B]/40 bg-[#C9A66B]/10 flex items-center justify-center text-[#C9A66B] font-heading font-bold text-sm">
                    RR
                  </div>
                  <div>
                    <h4 className="font-heading font-medium text-[#F9F7F6] text-base flex items-center gap-2">
                      Rosy Realtors Nairobi
                      <span className="text-[10px] font-mono uppercase bg-[#C9A66B]/15 text-[#C9A66B] border border-[#C9A66B]/30 px-2 py-0.5 rounded-full font-semibold">
                        Real Estate CRM
                      </span>
                    </h4>
                    <p className="text-[11px] text-[#F9F7F6]/50 uppercase tracking-widest font-sans font-light">
                      Active Client Pipeline &bull; Live Auto-Routing
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-medium text-emerald-400 font-sans">AI Auto-Assign Active</span>
                </div>
              </div>

              {/* 4 Multi-Channel Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
                {/* WhatsApp */}
                <div className="p-5 rounded-[16px] border border-white/10 bg-white/[0.02] hover:border-[#25D366]/40 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-[#F9F7F6]/60 font-medium tracking-wider uppercase">WhatsApp</span>
                    <div className="p-1.5 rounded-lg bg-[#25D366]/10 text-[#25D366]">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="font-heading font-light text-[30px] md:text-[34px] text-[#F9F7F6]">142</h3>
                  <p className="text-[11px] text-[#25D366] mt-1 font-light">Inquiries &bull; 98% Qualified</p>
                </div>

                {/* Instagram */}
                <div className="p-5 rounded-[16px] border border-white/10 bg-white/[0.02] hover:border-[#E1306C]/40 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-[#F9F7F6]/60 font-medium tracking-wider uppercase">Instagram</span>
                    <div className="p-1.5 rounded-lg bg-[#E1306C]/10 text-[#E1306C]">
                      <Instagram className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="font-heading font-light text-[30px] md:text-[34px] text-[#F9F7F6]">68</h3>
                  <p className="text-[11px] text-[#E1306C] mt-1 font-light">DMs &bull; Property Inquiries</p>
                </div>

                {/* Facebook */}
                <div className="p-5 rounded-[16px] border border-white/10 bg-white/[0.02] hover:border-[#1877F2]/40 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-[#F9F7F6]/60 font-medium tracking-wider uppercase">Facebook</span>
                    <div className="p-1.5 rounded-lg bg-[#1877F2]/10 text-[#1877F2]">
                      <Facebook className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="font-heading font-light text-[30px] md:text-[34px] text-[#F9F7F6]">45</h3>
                  <p className="text-[11px] text-[#1877F2] mt-1 font-light">Ad Forms &bull; Lead Gen</p>
                </div>

                {/* Website */}
                <div className="p-5 rounded-[16px] border border-[#C9A66B]/30 bg-[#C9A66B]/5 hover:border-[#C9A66B]/60 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-[#C9A66B] font-semibold tracking-wider uppercase">Website</span>
                    <div className="p-1.5 rounded-lg bg-[#C9A66B]/15 text-[#C9A66B]">
                      <Globe className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="font-heading font-semibold text-[30px] md:text-[34px] text-[#C9A66B]">89</h3>
                  <p className="text-[11px] text-[#C9A66B]/90 mt-1 font-medium">Direct Site &bull; Live Chat</p>
                </div>
              </div>

              {/* Real-time Lead Event Banner */}
              <div className="border border-[#C9A66B]/20 rounded-[14px] bg-[#C9A66B]/5 p-4 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
                    <Bell className="h-4 w-4" />
                  </div>
                  <div>
                    <h5 className="text-[13px] font-semibold text-[#F9F7F6] mb-0.5">Live Lead Event &bull; Rosy Realtors Nairobi</h5>
                    <p className="text-[12px] text-[#F9F7F6]/70 font-sans font-light">
                      &quot;New Lead: Mary Wanjiku (+254 794 357 912) &bull; Looking for 2-Bed Luxury Apt in Kilimani &bull; Buying Immediately &bull; Assigned to Sarah M.&quot;
                    </p>
                  </div>
                </div>
                <span className="text-[11px] text-[#C9A66B] bg-[#C9A66B]/10 border border-[#C9A66B]/30 px-3 py-1 rounded-full font-medium tracking-wide shrink-0">
                  Auto-Assigned in 3s
                </span>
              </div>

              {/* Leads Table Section */}
              <div className="border border-white/10 rounded-[18px] bg-white/[0.01] overflow-hidden">
                <div className="p-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white/[0.02]">
                  <div>
                    <h4 className="font-heading font-medium text-[#F9F7F6] text-base">Assigned Leads Table</h4>
                    <p className="text-xs text-[#F9F7F6]/50 font-light">Live stream of captured inquiries with buyer interest, timeline, & assigned sales agent.</p>
                  </div>
                  <div className="text-xs text-[#C9A66B] bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg font-mono">
                    Total Assigned: 344 Leads
                  </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/[0.03] text-[#F9F7F6]/50 uppercase tracking-wider text-[10px] font-medium">
                        <th className="py-3.5 px-4">Lead Name</th>
                        <th className="py-3.5 px-4">Phone Number</th>
                        <th className="py-3.5 px-4">Source</th>
                        <th className="py-3.5 px-4">Property Interest</th>
                        <th className="py-3.5 px-4">Timeline</th>
                        <th className="py-3.5 px-4">Sales Agent Assigned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[#F9F7F6]/85">
                      
                      {/* Row 1 */}
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 font-medium text-[#F9F7F6]">
                          Mary Wanjiku
                        </td>
                        <td className="py-4 px-4 font-mono text-[#F9F7F6]/70">
                          +254 794 357 912
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 text-[11px] font-medium">
                            <MessageCircle className="h-3 w-3" /> WhatsApp
                          </span>
                        </td>
                        <td className="py-4 px-4 font-light text-[#F9F7F6]/90">
                          <span className="text-[#C9A66B] font-medium">Residential</span> &bull; 2-Bed Luxury Apt, Kilimani
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider">
                            Immediately
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-[#F9F7F6]/90">
                          Sarah M. <span className="text-[10px] text-[#F9F7F6]/40 font-normal">(Senior Realtor)</span>
                        </td>
                      </tr>

                      {/* Row 2 */}
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 font-medium text-[#F9F7F6]">
                          James Omondi
                        </td>
                        <td className="py-4 px-4 font-mono text-[#F9F7F6]/70">
                          +254 712 684 201
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C9A66B]/10 text-[#C9A66B] border border-[#C9A66B]/20 text-[11px] font-medium">
                            <Globe className="h-3 w-3" /> Website
                          </span>
                        </td>
                        <td className="py-4 px-4 font-light text-[#F9F7F6]/90">
                          <span className="text-[#F2B6C1] font-medium">Commercial</span> &bull; 250 sqft Office, Westlands
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-semibold uppercase tracking-wider">
                            3 Months
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-[#F9F7F6]/90">
                          David K. <span className="text-[10px] text-[#F9F7F6]/40 font-normal">(Commercial Lead)</span>
                        </td>
                      </tr>

                      {/* Row 3 */}
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 font-medium text-[#F9F7F6]">
                          Caroline Njuguna
                        </td>
                        <td className="py-4 px-4 font-mono text-[#F9F7F6]/70">
                          +254 722 913 450
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E1306C]/10 text-[#E1306C] border border-[#E1306C]/20 text-[11px] font-medium">
                            <Instagram className="h-3 w-3" /> Instagram
                          </span>
                        </td>
                        <td className="py-4 px-4 font-light text-[#F9F7F6]/90">
                          <span className="text-[#C9A66B] font-medium">Residential</span> &bull; 4-Bed Villa, Runda
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold uppercase tracking-wider">
                            Immediately
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-[#F9F7F6]/90">
                          Alex O. <span className="text-[10px] text-[#F9F7F6]/40 font-normal">(Luxury Estates)</span>
                        </td>
                      </tr>

                      {/* Row 4 */}
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 font-medium text-[#F9F7F6]">
                          Kelvin Mutua
                        </td>
                        <td className="py-4 px-4 font-mono text-[#F9F7F6]/70">
                          +254 733 820 194
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#1877F2]/10 text-[#1877F2] border border-[#1877F2]/20 text-[11px] font-medium">
                            <Facebook className="h-3 w-3" /> Facebook
                          </span>
                        </td>
                        <td className="py-4 px-4 font-light text-[#F9F7F6]/90">
                          <span className="text-[#C9A66B] font-medium">Residential</span> &bull; 0.5 Acre Plot, Karen
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-semibold uppercase tracking-wider">
                            6 Months
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-[#F9F7F6]/90">
                          Faith N. <span className="text-[10px] text-[#F9F7F6]/40 font-normal">(Land Specialist)</span>
                        </td>
                      </tr>

                      {/* Row 5 */}
                      <tr className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4 font-medium text-[#F9F7F6]">
                          Amina Hassan
                        </td>
                        <td className="py-4 px-4 font-mono text-[#F9F7F6]/70">
                          +254 701 472 839
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/20 text-[11px] font-medium">
                            <MessageCircle className="h-3 w-3" /> WhatsApp
                          </span>
                        </td>
                        <td className="py-4 px-4 font-light text-[#F9F7F6]/90">
                          <span className="text-[#F2B6C1] font-medium">Commercial</span> &bull; Retail Storefront, Lavington
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-semibold uppercase tracking-wider">
                            Just Browsing
                          </span>
                        </td>
                        <td className="py-4 px-4 font-medium text-[#F9F7F6]/90">
                          Brian K. <span className="text-[10px] text-[#F9F7F6]/40 font-normal">(Commercial Agent)</span>
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. THE PERFORMANCE */}
        <section className="py-24 md:py-32 border-b border-white/5 bg-[#07070B]">
          <div className="container mx-auto max-w-7xl px-6 md:px-12">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-[11px] font-heading font-medium uppercase tracking-[0.25em] text-[#C9A66B] mb-3 block">
                The Performance
              </span>
              <h2 className="font-heading font-light text-[28px] md:text-[36px] text-[#F9F7F6]">
                Operational Metrics That Transform Businesses
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {metrics.map((item, idx) => (
                <div key={idx} className="p-8 rounded-[20px] bg-white/[0.01] border border-white/10 text-center flex flex-col justify-between hover:border-[#F2B6C1]/30 transition-all duration-300 bg-[#07070B]">
                  <div>
                    <span className="text-[10px] font-heading font-medium uppercase tracking-wider text-[#F2B6C1] mb-4 block">
                      {item.category}
                    </span>
                    <h4 className="text-[13px] font-heading font-medium uppercase tracking-widest text-[#F9F7F6]/45 mb-4">
                      {item.label}
                    </h4>
                    <h3 className="font-heading font-normal text-[30px] md:text-[36px] text-[#C9A66B] mb-2 leading-none">
                      {item.val}
                    </h3>
                  </div>
                  <p className="text-[14px] text-[#F9F7F6]/60 pt-4 border-t border-white/5 font-light">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. FINAL CTA BUTTONS */}
        <section className="py-24 bg-[#07070B]">
          <div className="container mx-auto max-w-5xl px-6 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <a
                href="/book-consultation"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-[#C9A66B] text-[#07070B] hover:bg-[#C9A66B]/90 font-heading font-semibold rounded-[16px] px-8 py-4 text-[14px] tracking-wide transition-all duration-300 hover:shadow-[0_0_20px_rgba(201,166,107,0.35)]"
              >
                Book a Consultation
              </a>
              <a
                href="/our-services"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-white/5 text-[#F9F7F6] border border-white/10 hover:border-[#F2B6C1]/40 font-heading font-semibold rounded-[16px] px-8 py-4 text-[14px] tracking-wide transition-all duration-300 hover:bg-white/[0.08]"
              >
                Our Services
              </a>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}
