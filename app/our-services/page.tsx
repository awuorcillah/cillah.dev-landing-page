"use client"

import { motion } from "framer-motion"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { 
  Check, 
  Sparkles, 
  Cpu, 
  Globe, 
  Layers, 
  TrendingUp,
  ArrowRight
} from "lucide-react"

export default function ServicesPage() {
  const services = [
    {
      title: "AI Lead Capture, Qualification & Conversions",
      badge: "24/7",
      description: "Capture leads from WhatsApp, Instagram, Facebook, and your website, then qualify and route them automatically.",
      features: [
        "Instant responses",
        "Lead qualification",
        "Appointment booking",
        "items sold",
        "Automated follow-up"
      ],
      icon: <Cpu className="h-6 w-6" />
    },
    {
      title: "Websites and landing page",
      badge: "Mobile-first",
      description: "Professional, mobile-first websites designed to turn visitors into qualified inquiries.",
      features: [
        "Business websites",
        "Landing pages",
        "Lead capture forms",
        "SEO optimization"
      ],
      icon: <Globe className="h-6 w-6" />
    },
    {
      title: "Workflow Automation",
      badge: "Time-saving",
      description: "Automate repetitive tasks and create efficient business processes across your operations.",
      features: [
        "CRM updates",
        "Lead assignment",
        "Notifications",
        "Reporting dashboards"
      ],
      icon: <Layers className="h-6 w-6" />
    },
    {
      title: "Meta Ads & Conversion API",
      badge: "ROI tracking",
      description: "Connect advertising data to real business outcomes for better optimization and reporting.",
      features: [
        "Conversion API setup",
        "Lead tracking",
        "CRM integration",
        "Performance reporting"
      ],
      icon: <TrendingUp className="h-6 w-6" />
    }
  ]

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#121214] text-[#F9F7F6] overflow-x-hidden font-sans font-light relative pb-12">
        {/* Ambient background glows */}
        <div className="absolute top-0 right-1/4 w-[450px] h-[450px] rounded-full bg-[#F2B6C1]/2 blur-[130px] pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-[#C9A66B]/3 blur-[120px] pointer-events-none -z-10" />
        <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] rounded-full bg-[#F2B6C1]/2 blur-[130px] pointer-events-none -z-10" />

        {/* HERO SECTION */}
        <section className="relative pt-48 pb-20 md:pt-56 md:pb-28 flex flex-col items-center justify-center border-b border-white/5">
          <div className="container mx-auto max-w-7xl px-6 md:px-12 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-4xl mx-auto"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-8 backdrop-blur-md">
                <Sparkles className="h-4 w-4 text-[#C9A66B]" />
                <span className="text-[11px] font-medium tracking-[0.25em] uppercase text-[#F2B6C1]">
                  Smart Systems for Modern Businesses
                </span>
              </div>
              
              <h1 className="font-heading font-light text-[36px] sm:text-[44px] md:text-[54px] leading-tight text-[#F9F7F6] mb-6">
                Scale with confidence.
              </h1>
              
              <p className="text-[15px] md:text-[16px] leading-relaxed text-[#F9F7F6]/60 max-w-2xl mx-auto font-sans font-light">
                Intelligent systems designed to automate workflows, capture customer inquiries, and drive predictable revenue.
              </p>
            </motion.div>
          </div>
        </section>

        {/* 2x2 SERVICES GRID */}
        <section className="py-24 md:py-32">
          <div className="container mx-auto max-w-7xl px-6 md:px-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {services.map((service, idx) => (
                <div 
                  key={idx} 
                  className="p-8 md:p-10 rounded-[24px] bg-[#16161A]/80 border border-[#C9A66B]/20 backdrop-blur-md hover:border-[#F2B6C1]/50 hover:shadow-[0_0_30px_rgba(242,182,193,0.12)] transition-all duration-500 flex flex-col justify-between"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                      <div className="p-3 bg-[#C9A66B]/5 border border-[#C9A66B]/20 rounded-xl text-[#C9A66B]">
                        {service.icon}
                      </div>
                      <span className="text-[10px] font-heading font-medium uppercase tracking-wider text-[#F2B6C1] bg-[#F2B6C1]/5 border border-[#F2B6C1]/20 px-2.5 py-1 rounded-md">
                        {service.badge}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-heading font-light text-[22px] md:text-[25px] text-[#F9F7F6] mb-4">
                      {service.title}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-[14px] md:text-[15px] text-[#F9F7F6]/70 mb-8 leading-relaxed font-light">
                      {service.description}
                    </p>

                    {/* Bullet Points */}
                    <div className="pt-6 border-t border-white/5">
                      <h4 className="text-[11px] font-heading font-semibold uppercase tracking-wider text-[#C9A66B] mb-4">
                        Included Features
                      </h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                        {service.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-3 text-[13px] md:text-[14px] text-[#F9F7F6]/80 font-light">
                            <Check className="h-4 w-4 text-[#C9A66B] shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Action Button inside card */}
                  <a
                    href="/book-consultation"
                    className="w-full inline-flex items-center justify-center bg-transparent text-[#C9A66B] border border-[#C9A66B]/30 hover:bg-[#C9A66B] hover:text-[#07070B] hover:border-[#C9A66B] font-heading font-medium rounded-[14px] py-3.5 text-[14px] tracking-wide transition-all duration-300 mt-6"
                  >
                    Book a Consultation
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </>
  )
}
