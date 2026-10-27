export interface FAQItem {
  id: string
  serviceTag: string
  category: "web-apps" | "ai-agents" | "automation" | "outreach"
  categoryLabel: string
  question: string
  shortAnswer: string
  valueAnswer: string
}

export const FAQS_BY_SERVICE: FAQItem[] = [
  // -------------------------------------------------------------
  // SERVICE 1: Custom Websites & Web Applications
  // -------------------------------------------------------------
  {
    id: "web-1",
    serviceTag: "Custom Websites & Web Applications",
    category: "web-apps",
    categoryLabel: "Web & Backend",
    question: "Why do we need a custom web application instead of just using WordPress, Wix, or Shopify?",
    shortAnswer:
      "Template builders are static digital brochures that slow down, break with plugin updates, and force you to manage operations manually across spreadsheets. A custom web application is a proprietary business asset tailored to your exact workflows—unifying your customer-facing experience with a private operational backend.",
    valueAnswer:
      "You get sub-second load times that rank higher on search engines, complete immunity to third-party plugin vulnerabilities, custom customer portals, and a system you own 100% with zero recurring platform tax or vendor lock-in.",
  },
  {
    id: "web-2",
    serviceTag: "Custom Websites & Web Applications",
    category: "web-apps",
    categoryLabel: "Web & Backend",
    question: "How does the backend command dashboard help my staff, and is it hard for non-technical employees to use?",
    shortAnswer:
      "The backend command dashboard acts as your company's central operating cockpit, replacing chaotic WhatsApp groups, sticky notes, and scattered spreadsheets with an intuitive visual workspace.",
    valueAnswer:
      "If your team can use WhatsApp or Gmail, they can use our dashboard. Employees log in with role-based permissions (admin, manager, sales agent) to view incoming inquiries, manage listings or orders, track client status, and update tasks in real time without touching any code.",
  },
  {
    id: "web-3",
    serviceTag: "Custom Websites & Web Applications",
    category: "web-apps",
    categoryLabel: "Web & Backend",
    question: "Can our website accept automated payments (M-Pesa STK Push, credit cards, bank transfer) and issue instant receipts?",
    shortAnswer:
      "Yes. We integrate direct checkout and deposit workflows with instant verification, including M-Pesa STK push (prompting the customer's phone for their PIN immediately), Stripe, credit cards, and bank wire transfers.",
    valueAnswer:
      "You eliminate the 'send payment screenshot' bottleneck. Transactions reconcile automatically, booking dates lock in real time, and both your customer and accounting team receive automated confirmation receipts and calendar invites instantly.",
  },
  {
    id: "web-4",
    serviceTag: "Custom Websites & Web Applications",
    category: "web-apps",
    categoryLabel: "Web & Backend",
    question: "Who actually owns the code, intellectual property, and customer data once the project is finished?",
    shortAnswer:
      "You own 100% of your code, designs, and proprietary customer database upon launch.",
    valueAnswer:
      "Unlike SaaS platforms that hold your customer list hostage if you cancel your subscription, our systems are built on open modern infrastructure (Next.js, Supabase, PostgreSQL). You receive full administrative access to all repositories, databases, and assets.",
  },
  {
    id: "web-5",
    serviceTag: "Custom Websites & Web Applications",
    category: "web-apps",
    categoryLabel: "Web & Backend",
    question: "Will our web application be optimized for mobile devices and modern AI search engines?",
    shortAnswer:
      "Yes. Every application is built mobile-first—optimized for the 80%+ of consumers who browse on their smartphones—and pre-configured with Answer Engine Optimization (AEO) and Schema.org structured data.",
    valueAnswer:
      "Your site loads in under 1 second on cellular networks, passes all Google Core Web Vitals, and provides structured semantic answers that enable AI engines like SearchGPT, Perplexity, and Google AI Overviews to recommend your business directly.",
  },

  // -------------------------------------------------------------
  // SERVICE 2: Autonomous AI Agents in Inboxes
  // -------------------------------------------------------------
  {
    id: "ai-1",
    serviceTag: "Autonomous AI Agents in Inboxes",
    category: "ai-agents",
    categoryLabel: "AI Inboxes",
    question: "Will this AI replace me, my sales team, or our support staff in our workspace?",
    shortAnswer:
      "No. AI does not replace high-performing humans—it eliminates the repetitive, low-leverage busywork that drains their working hours.",
    valueAnswer:
      "The AI takes over the exhausting front-end 80%: answering repetitive FAQs at 2:00 AM, verifying buyer budgets, confirming location preferences, and collecting phone numbers. Your human team is freed up to do what AI cannot: build high-trust relationships, negotiate terms, and close high-value sales. Your team isn't replaced; they're given superpowers.",
  },
  {
    id: "ai-2",
    serviceTag: "Autonomous AI Agents in Inboxes",
    category: "ai-agents",
    categoryLabel: "AI Inboxes",
    question: "What happens if a customer asks a complex, sensitive, or unusual question the AI doesn't know?",
    shortAnswer:
      "The AI never hallucinates or guesses. If an inquiry falls outside its trained business parameters, it gracefully pauses and immediately hands off the conversation to a human team member.",
    valueAnswer:
      "The system sends an instant notification (via WhatsApp, SMS, or dashboard alert) to the assigned sales agent with a complete summary of the conversation so far. The human agent can jump in seamlessly without the customer ever feeling frustrated.",
  },
  {
    id: "ai-3",
    serviceTag: "Autonomous AI Agents in Inboxes",
    category: "ai-agents",
    categoryLabel: "AI Inboxes",
    question: "How does the AI know our specific product pricing, inventory availability, and company rules?",
    shortAnswer:
      "The AI agent is trained exclusively on your verified business knowledge base and connected directly to your live product or listing database.",
    valueAnswer:
      "It checks real-time availability before confirming a viewing or order, quotes exact pricing according to your guidelines, and speaks in your brand's tone of voice. If you update a price or mark an item as sold in your dashboard, the AI updates its knowledge instantly.",
  },
  {
    id: "ai-4",
    serviceTag: "Autonomous AI Agents in Inboxes",
    category: "ai-agents",
    categoryLabel: "AI Inboxes",
    question: "Can the AI filter out window shoppers, spam, and tire-kickers so our sales reps don't waste time?",
    shortAnswer:
      "Yes. Autonomous qualification is one of the AI's primary roles.",
    valueAnswer:
      "Before any inquiry reaches your senior sales staff, the AI politely asks qualifying questions (e.g., budget range, purchase timeline, preferred location, decision-making authority). Inquiries are tagged as Hot, Warm, Cold, or Unqualified, ensuring your expensive sales reps only spend time on serious buyers ready to transact.",
  },
  {
    id: "ai-5",
    serviceTag: "Autonomous AI Agents in Inboxes",
    category: "ai-agents",
    categoryLabel: "AI Inboxes",
    question: "Is there any risk of our official WhatsApp Business or Instagram accounts getting blocked or banned?",
    shortAnswer:
      "None. We build exclusively on official Meta Cloud APIs and WhatsApp Business Platform integrations—not unauthorized scraping tools or risky browser extensions.",
    valueAnswer:
      "Your business operates with verified green badge eligibility, 100% compliance with Meta's Terms of Service, end-to-end data security, and uninterrupted 24/7 uptime.",
  },

  // -------------------------------------------------------------
  // SERVICE 3: Marketing-to-Operations Workflow Automation
  // -------------------------------------------------------------
  {
    id: "auto-1",
    serviceTag: "Marketing-to-Operations Workflow Automation",
    category: "automation",
    categoryLabel: "Workflow Automation",
    question: "How does workflow automation prevent leads from falling through the cracks when we run marketing ads?",
    shortAnswer:
      "Leads generated from Meta Ads, TikTok Ads, Google Search, or website forms are captured and processed within 3 seconds, triggering instant multi-channel actions.",
    valueAnswer:
      "Instead of waiting hours for a marketer to download a CSV file, the lead is automatically created in your CRM, qualified by AI, assigned to the right sales rep, and greeted with an automated personalized WhatsApp message while their buying intent is at its highest.",
  },
  {
    id: "auto-2",
    serviceTag: "Marketing-to-Operations Workflow Automation",
    category: "automation",
    categoryLabel: "Workflow Automation",
    question: "Can this integrate with our existing CRM, Google Calendar, and internal software?",
    shortAnswer:
      "Yes. We build custom API bridges and webhooks to synchronize your current software stack (HubSpot, Salesforce, Zoho, Google Workspace, Airtable, or custom SQL databases).",
    valueAnswer:
      "You don't have to throw away tools your team already likes. We connect the missing links so data flows freely between your advertising channels, messaging inboxes, calendars, and customer records without manual copy-pasting.",
  },
  {
    id: "auto-3",
    serviceTag: "Marketing-to-Operations Workflow Automation",
    category: "automation",
    categoryLabel: "Workflow Automation",
    question: "How does automated lead distribution and smart sales routing work across multiple agents?",
    shortAnswer:
      "The system routes leads using customized business logic—such as round-robin distribution, geographical territory, property/service category, or agent availability.",
    valueAnswer:
      "This prevents internal disputes among sales reps, eliminates response lag, and ensures high-priority VIP leads are automatically directed to your most experienced closers.",
  },
  {
    id: "auto-4",
    serviceTag: "Marketing-to-Operations Workflow Automation",
    category: "automation",
    categoryLabel: "Workflow Automation",
    question: "What happens to past inquiries and cold leads who never bought months ago?",
    shortAnswer:
      "The automation engine runs scheduled re-activation workflows that re-engage dormant contacts with relevant updates.",
    valueAnswer:
      "When you launch a new listing, drop a price, or release a seasonal offer, the system segments past inquiries based on their recorded preferences and sends tailored re-engagement messages. This routinely generates fresh sales from leads you already paid to acquire.",
  },
  {
    id: "auto-5",
    serviceTag: "Marketing-to-Operations Workflow Automation",
    category: "automation",
    categoryLabel: "Workflow Automation",
    question: "How does management track team response speed and conversion performance?",
    shortAnswer:
      "The system records time-stamped metrics for every customer interaction, feeding a centralized executive dashboard.",
    valueAnswer:
      "Business owners can see average first-response times, lead-to-booking conversion rates, and revenue performance per sales agent. You replace guesswork and assumptions with verifiable operational data.",
  },

  // -------------------------------------------------------------
  // SERVICE 4: LinkedIn & Cold Email Outreach
  // -------------------------------------------------------------
  {
    id: "outreach-1",
    serviceTag: "LinkedIn & Cold Email Outreach",
    category: "outreach",
    categoryLabel: "Cold Outreach",
    question: "Will cold emailing damage our primary company email address or get our main domain blacklisted?",
    shortAnswer:
      "Absolutely not. We enforce strict domain isolation by purchasing and setting up dedicated secondary outreach domains that mirror your brand.",
    valueAnswer:
      "We configure full technical authentication—SPF, DKIM, DMARC, and custom tracking domains—and run a 21-day gradual warm-up protocol before sending a single email. Your primary corporate email (yourname@yourcompany.com) remains 100% protected and untouched by outreach volume.",
  },
  {
    id: "outreach-2",
    serviceTag: "LinkedIn & Cold Email Outreach",
    category: "outreach",
    categoryLabel: "Cold Outreach",
    question: "How do you identify and verify the decision-makers on LinkedIn to ensure they match our target market?",
    shortAnswer:
      "We build your custom Ideal Customer Profile (ICP) using multi-point filtering across LinkedIn's verified corporate databases, targeting exact job titles, company headcount, industry, and geography.",
    valueAnswer:
      "We don't buy stale, outdated email lists. Every prospective decision-maker (CEO, Head of Marketing, VP of Operations) is verified in real time for employment status and corporate email deliverability, guaranteeing bounce rates below 2%.",
  },
  {
    id: "outreach-3",
    serviceTag: "LinkedIn & Cold Email Outreach",
    category: "outreach",
    categoryLabel: "Cold Outreach",
    question: "Do we have to write the emails, build lead lists, or manage the technical software ourselves?",
    shortAnswer:
      "No. This is a 100% Done-For-You customer acquisition engine.",
    valueAnswer:
      "We handle targeting calibration, list building, inbox deliverability infrastructure, persuasive copywriting, A/B testing, and automated follow-ups. Your internal sales team has only one job: open their calendar, join the scheduled call, and pitch their offer.",
  },
  {
    id: "outreach-4",
    serviceTag: "LinkedIn & Cold Email Outreach",
    category: "outreach",
    categoryLabel: "Cold Outreach",
    question: "How many qualified meetings or sales conversations can a typical B2B business expect per month?",
    shortAnswer:
      "Most B2B clients with a validated offer and clear target market generate 10 to 25+ pre-qualified sales meetings per month.",
    valueAnswer:
      "Cold outreach shifts client acquisition from 'hoping someone refers us' to a predictable mathematical formula. You know exactly how many prospects are contacted, how many positive responses are received, and the predictable cost per booked sales call.",
  },
  {
    id: "outreach-5",
    serviceTag: "LinkedIn & Cold Email Outreach",
    category: "outreach",
    categoryLabel: "Cold Outreach",
    question: "How is this different from generic lead gen agencies that send spammy, robotic pitch emails?",
    shortAnswer:
      "We focus on value-led, hyper-personalized messaging that speaks directly to the specific operational challenges of that executive's industry.",
    valueAnswer:
      "We never send generic 'blast' emails asking for '15 minutes of your time' on email one. Every message is crafted around relevant industry insights, case studies, and clear commercial outcomes, positioning your business as a senior peer and trusted partner rather than a nuisance.",
  },
]
