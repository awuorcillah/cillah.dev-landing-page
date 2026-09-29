// ============================================================
// All landing page content data
// ============================================================

export const SITE = {
  name: "AIRAPTOR FX",
  tagline: "The Real Estate Automation System",
  footerTagline: "High-End Automation Infrastructure for Real Estate Agencies",
  copyright: `\u00A9 ${new Date().getFullYear()} AIRAPTOR FX. All rights reserved.`,
  contactEmail: "info@airaptorfx.com",
  linkedIn:
    "https://www.linkedin.com/in/cheryl-cilla-atulah-7187103b1?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
  instagram:
    "https://www.instagram.com/awuor_cillah?igsh=MXhqZWZxbHppYWxmNA==",
  phone: "+254759442265",
  calendarUrl: "https://cal.com/airaptorfx/ai-automation-strategy-call",
  cta: "Book Automation Audit",
} as const

// ============================================================
// Hero
// ============================================================

export const HERO = {
  headline: "Captures, Routes, and Converts Every Inquiry — Automatically.",
  subheadline:
    "Deploy one connected system that responds instantly, qualifies leads, takes payment and gives your team complete visibility.",
  ctaPrimary: "Book Automation Audit",
  ctaSecondary: "Explore the System",
  cta: "Book Automation Audit", // Legacy support
} as const

// ============================================================
// Deliverables (The System)
// ============================================================

export const DELIVERABLES = [
  {
    id: "inbox-automation",
    title: "Inbox Automation",
    description: "Respond to every inquiry in seconds across WhatsApp, Instagram, Facebook, and Web.",
    link: "/inbox-automation",
    icon: "MessageSquare",
    bullets: [
      "24/7 instant response",
      "Multi-platform coverage",
      "AI-driven qualification"
    ]
  },
  {
    id: "lead-distribution",
    title: "Lead Distribution",
    description: "Automatically route each inquiry to the right agent based on the property or workflow.",
    link: "/lead-distribution",
    icon: "Users",
    bullets: [
      "Instant routing logic",
      "Property-based assignment",
      "Reduced response lag"
    ]
  },
  {
    id: "data-intelligence",
    title: "Lead Tracking & Data Intelligence",
    description: "Know exactly where your leads come from and what's working.",
    link: "/data-intelligence",
    icon: "Database",
    bullets: [
      "Source attribution",
      "Channel performance",
      "Inquiry timing data"
    ]
  },
  {
    id: "follow-up-automation",
    title: "Follow-Up Automation",
    description: "Automatically follow up with leads so interested buyers do not go cold.",
    link: "/follow-up-automation",
    icon: "Zap",
    bullets: [
      "Automated sequences",
      "Buyer retention",
      "Personalized touchpoints"
    ]
  },
  {
    id: "crm-pipeline",
    title: "CRM & Pipeline Control",
    description: "Move leads through clear stages from new lead to viewing booked and closed.",
    link: "/crm-pipeline",
    icon: "Filter",
    bullets: [
      "Structured lead flow",
      "Status tracking",
      "Simplified management"
    ]
  },
  {
    id: "reporting-decision",
    title: "Reporting & Decision System",
    description: "Give management visibility into response time, source, and team performance.",
    link: "/reporting-decision",
    icon: "BarChart3",
    bullets: [
      "Response time tracking",
      "Performance metrics",
      "Conversion insights"
    ]
  }
] as const

// ============================================================
// Problem Section
// ============================================================

export const PROBLEM = {
  headline: "Your Marketing May Be Working. Your Response System May Not Be.",
  points: [
    {
      title: "Leads waiting too long for replies",
      description: "Delayed responses mean lost opportunities.",
      icon: "Clock"
    },
    {
      title: "Missed after-hours and weekend inquiries",
      description: "Leads don't wait for business hours.",
      icon: "CalendarOff"
    },
    {
      title: "Manual lead assignment delays",
      description: "Slow routing kills conversion chances.",
      icon: "ListX"
    },
    {
      title: "No structured qualification or tracking",
      description: "Flying blind on ROI and performance.",
      icon: "Filter"
    }
  ]
} as const

// ============================================================
// Transformation (Before vs After)
// ============================================================

export const TRANSFORMATION = [
  {
    category: "Response Time",
    before: "4-6 hour average",
    after: "Under 5 seconds"
  },
  {
    category: "Lead Handling",
    before: "Manual DM conversations",
    after: "Customized conversational chats"
  },
  {
    category: "Lead Assignment",
    before: "Shared manually",
    after: "Routed instantly"
  },
  {
    category: "Booking",
    before: "Back-and-forth scheduling",
    after: "Automated booking flow"
  },
  {
    category: "Management Visibility",
    before: "Assumptions and scattered data",
    after: "Clear metrics and tracking"
  }
] as const

// ============================================================
// Pricing
// ============================================================

export const PRICING = {
  headline: "Investment Options",
  note: "All plans include system monitoring and maintenance.", // Legacy support
  tiers: [
    {
      name: "Starter",
      label: "Lead Capture System",
      price: "Starting at $500",
      features: ["1 platform", "Basic qualification", "Lead logging"]
    },
    {
      name: "Growth",
      label: "Booking Automation System",
      price: "Custom Quote",
      badge: "Most Popular",
      features: ["Multi-platform", "Smart routing", "Calendar sync", "CRM integration"]
    },
    {
      name: "Scale",
      label: "Full Automation Infrastructure",
      price: "Custom Quote",
      features: ["Everything in Growth", "API workflows", "Custom reporting", "Priority support"]
    }
  ]
} as const

// ============================================================
// FAQ
// ============================================================

export const FAQ_DATA = [
  {
    question: "How is this different from a basic chatbot?",
    answer: "This system is more like an intelligent conversational assistant. It understands human intent, uses the information and business context you give it, can pull from relevant sources, and responds based on what the customer is actually trying to achieve — not just pre-set button flows. The experience is closer to asking a smart assistant a question and getting the exact help you need, rather than interacting with a rigid basic chatbot."
  },
  {
    question: "Will this replace my agents?",
    answer: "No. It handles the repetitive front-end work so your agents can focus on high-value conversations and closings."
  },
  {
    question: "Does it work with multiple properties?",
    answer: "Yes. The system is built to handle your entire property portfolio across all platforms."
  },
  {
    question: "What platforms does it work on?",
    answer: "Instagram, Facebook, WhatsApp, TikTok, and your website. Email (coming soon). All are connected to the same central system."
  },
  {
    question: "How long does setup take?",
    answer: "Most systems are fully deployed within 5-10 business days."
  },
  {
    question: "Does it integrate with our CRM?",
    answer: "Yes. We connect with all popular CRMs via API or standard integrations."
  }
] as const

// ============================================================
// Legacy / Preserved Page Constants
// ============================================================

export const FINAL_CTA = {
  headline: "Ready to Transform Your Real Estate Business?",
  cta: SITE.cta,
} as const

export const FAQ = {
  headline: "Frequently Asked Questions",
  subtext: "Everything you need to know about our automation system.",
  core: [
    {
      question: "How does the AI assistant handle property inquiries?",
      answer: "The assistant uses your property data to provide instant, accurate answers to buyer questions across all platforms."
    },
    {
      question: "Does it integrate with my existing CRM?",
      answer: "Yes, we integrate with all major real estate CRMs to ensure your leads are logged and tracked automatically."
    }
  ],
  concerns: [
    {
      question: "Is my data secure?",
      answer: "We use enterprise-grade security to ensure your agency and client data is always protected."
    }
  ]
} as const

export const CHAT_MESSAGES = [
  {
    sender: "user",
    text: "I'm interested in the 4-bedroom villa on 5th Ave."
  },
  {
    sender: "assistant",
    text: "Instantly captured. I see that property is currently available. Would you like to schedule a viewing for this Thursday or Friday?"
  },
  {
    sender: "user",
    text: "Friday afternoon works."
  },
  {
    sender: "assistant",
    text: "Perfect. I've notified the lead agent and added this to the Friday schedule. You'll receive a confirmation via WhatsApp in 60 seconds."
  }
] as const

export const FOUNDER = {
  sectionTitle: "Meet the Founder",
  name: "Cheryl Cilla Atulah",
  title: "Founder & Lead Automation Architect",
  bio: [
    "Specialist in real estate workflow automation",
    "Expert in AI-driven lead qualification systems",
    "Helping agencies scale with dedicated automation infrastructure"
  ]
} as const

export const SOLUTION = {
  headline: "A Complete Automation Infrastructure",
  features: [
    {
      title: "Instant Qualification",
      description: "Every lead is qualified automatically before reaching your team.",
      icon: "Zap"
    },
    {
      title: "Smart Routing",
      description: "Leads are sent to the right agent based on property assignment.",
      icon: "Filter"
    },
    {
      title: "Automated Booking",
      description: "Viewing appointments are scheduled directly on your calendar.",
      icon: "CalendarCheck"
    },
    {
      title: "24/7 Presence",
      description: "The system monitors your inbox day and night, including weekends.",
      icon: "BellRing"
    }
  ]
} as const

export const SOCIAL_PROOF = {
  headline: "Real Results. Real Growth.",
  subtext: "How AIRAPTOR FX transforms agency operations.",
  label: "Proven Performance",
  metrics: [
    { title: "Response Time", before: "4+ Hours", after: "Instant" },
    { title: "Lead Retention", before: "60% Lost", after: "95% Captured" },
    { title: "Manual Work", before: "20 hrs/week", after: "2 hrs/week" }
  ],
  testimonials: [
    {
      name: "Sarah W.",
      role: "Sales Director",
      quote: "The system has completely changed how we handle new inquiries. No more missed leads."
    },
    {
      name: "James M.",
      role: "Agency Owner",
      quote: "Finally, a system that actually understands real estate workflows."
    },
    {
      name: "Michael R.",
      role: "Lead Agent",
      quote: "I only talk to qualified buyers now. My closing rate has doubled."
    }
  ],
  stories: [
    {
      type: "Commercial Agency",
      problem: "Manual lead sorting taking too long.",
      automation: "Implemented multi-stage qualification.",
      result: "30% increase in qualified viewings."
    },
    {
      type: "Residential Boutique",
      problem: "Missing weekend inquiries.",
      automation: "24/7 inbox automation deployed.",
      result: "Captured $2M in potential deal value over one weekend."
    }
  ]
} as const

export const PROGRAM_FEATURES = {
  headline: "System Features",
  features: [
    {
      title: "Inbox Control",
      icon: "Globe",
      bullets: ["WhatsApp Integration", "Instagram DM Automation", "Facebook Messenger Sync", "Website Chat Widget"]
    },
    {
      title: "Lead Intelligence",
      icon: "Filter",
      bullets: ["Auto-qualification", "Source Tracking", "Data Attribution", "Intent Analysis"]
    },
    {
      title: "Workflow Automation",
      icon: "Workflow",
      bullets: ["Agent Routing", "CRM Sync", "Follow-up Sequences", "Viewing Scheduling"]
    }
  ]
} as const

export const HOW_IT_WORKS = {
  headline: "Three Steps to Full Automation",
  steps: [
    {
      title: "Inquiry Captured",
      description: "Lead reaches out on any platform and is captured by the system.",
      icon: "Megaphone"
    },
    {
      title: "AI Qualification",
      description: "System qualifies the lead based on your specific requirements.",
      icon: "Bot"
    },
    {
      title: "Agent Transfer",
      description: "Qualified leads are routed instantly to the right agent.",
      icon: "UserCheck"
    }
  ]
} as const

export const GUARANTEE = {
  headline: "Our System Guarantee",
  copy: "We guarantee that our system will capture and respond to every single inquiry received on your integrated platforms within 10 seconds, or we'll work for free until it does."
} as const
