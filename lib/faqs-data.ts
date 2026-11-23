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
    question: "Do I really need a website if I already get enquiries from Instagram, TikTok, Facebook, and WhatsApp?",
    shortAnswer:
      "Yes — think of your website in two parts: the front end (what buyers see on Google and AI search) and the back end (your team's private online office).",
    valueAnswer:
      "Social media brings attention, but leads get buried in DMs and you don't control platform algorithms or account restrictions. Your website's front end helps buyers find your properties when they search Google or AI tools — just like searching Google for a supermarket in a new city. Meanwhile, your website's back end acts as your online office where inquiries and insights from Instagram, TikTok, Facebook, and WhatsApp all land in one place so your Sales and Marketing teams can collaborate without losing a single buyer.",
  },
  {
    id: "web-2",
    serviceTag: "Custom Websites & Web Applications",
    category: "web-apps",
    categoryLabel: "Web & Backend",
    question: "My listings are already on Property24, Jiji, and other portals — why would I pay for my own website?",
    shortAnswer:
      "Portals are great for discovery, but you are renting space right next to competing agencies. Your website is your own portfolio and digital headquarters.",
    valueAnswer:
      "On third-party portals, a buyer looking at your property is one click away from 20 other agents. On your own website, you control the entire brand experience and own every contact who enquires. Better yet, you don't have to choose one or the other: portals like Property24 and Jiji can feed their enquiries straight into your website's back end, so every channel collides in one headquarters you control.",
  },
  {
    id: "web-3",
    serviceTag: "Custom Websites & Web Applications",
    category: "web-apps",
    categoryLabel: "Web & Backend",
    question: "Why shouldn't I just build a cheap DIY website myself or pay KES 15,000–25,000 for a basic one?",
    shortAnswer:
      "A KES 15,000–25,000 site gives you a static online brochure. We build a customized lead-and-operations system tailored to how your business actually closes deals.",
    valueAnswer:
      "Cheap templates rarely include a private team back end, lead tracking, WhatsApp and AI qualification, viewing bookings, or payment verification. They look identical to every other agency, load slowly on phones, and leave your sales team copying phone numbers into spreadsheets. You pay once for a custom system built around your workflow so it actively brings in and converts buyers instead of sitting idle.",
  },
  {
    id: "web-4",
    serviceTag: "Custom Websites & Web Applications",
    category: "web-apps",
    categoryLabel: "Web & Backend",
    question: "Will a website actually bring me WhatsApp enquiries, calls, and viewings — or will it just sit there like a brochure?",
    shortAnswer:
      "Yes — when your website is connected directly to WhatsApp, phone calls, your calendar, and your marketing channels, it becomes the central engine that books viewings.",
    valueAnswer:
      "A website only sits like a brochure when it has no clear next step or no connection to how buyers actually communicate. We connect your property pages directly to WhatsApp, calls, and automated viewing booking — so when buyers find you through Google, social media links, or ads, every click flows straight into your central sales pipeline for immediate follow-up.",
  },
  {
    id: "web-5",
    serviceTag: "Custom Websites & Web Applications",
    category: "web-apps",
    categoryLabel: "Web & Backend",
    question: "How do I stop getting spam, tyre-kickers, and unqualified leads from my website?",
    shortAnswer:
      "Every enquiry passes through a structured qualification form and a trained AI assistant before it ever reaches your sales team.",
    valueAnswer:
      "Instead of dumping every random message onto your agents, your website and AI assistant politely check the essentials first — budget range, preferred neighborhood, property type, and buying timeline. Serious, qualified buyers are routed immediately to the right sales rep with a full summary, while window shoppers are filtered out before wasting your team's time.",
  },
  {
    id: "web-6",
    serviceTag: "Custom Websites & Web Applications",
    category: "web-apps",
    categoryLabel: "Web & Backend",
    question: "How will I know the website is actually working after 30, 60, and 90 days?",
    shortAnswer:
      "We build a clean, real-numbers ROI dashboard directly inside your website's back end — customized around every channel feeding into your business.",
    valueAnswer:
      "You never have to guess whether your website is paying for itself. At any time, you can log in and see real figures: property listing views, WhatsApp clicks, total enquiries, qualified leads, booked viewings, and exactly which channel (Google, Instagram, TikTok, portals, or paid ads) generated each serious buyer.",
  },
  {
    id: "web-7",
    serviceTag: "Custom Websites & Web Applications",
    category: "web-apps",
    categoryLabel: "Web & Backend",
    question: "How much does a real estate website actually cost, and what are the ongoing costs after launch?",
    shortAnswer:
      "Custom systems start from $1,000 depending on scope, with transparent third-party tool costs and optional monthly maintenance starting from $500/month.",
    valueAnswer:
      "Every project is quoted clearly upfront based on what you actually need — whether that's a focused front-end site or a full website with a team CRM, WhatsApp AI qualification, and payment collection. After launch, your domain and third-party hosting/tools are billed directly in your own name with zero hidden markups. If you want ongoing engineering support, updates, monitoring, and optimization, our monthly maintenance retainer starts from $500/month depending on scope.",
  },
  {
    id: "web-8",
    serviceTag: "Custom Websites & Web Applications",
    category: "web-apps",
    categoryLabel: "Web & Backend",
    question: "Who owns my website, domain, listings, and client leads if I ever stop working with you?",
    shortAnswer:
      "You do — 100%. Think of it like building your own digital house: you pay us to build it, and you own the house and all the keys.",
    valueAnswer:
      "Your domain, source code, property listings, media, and full customer lead database belong strictly to your business in your own name. There is zero vendor lock-in — your data is exportable anytime, and you keep complete control even if you ever decide to manage things internally.",
  },
  {
    id: "web-9",
    serviceTag: "Custom Websites & Web Applications",
    category: "web-apps",
    categoryLabel: "Web & Backend",
    question: "I've paid for websites, ads, or lead services before and got nothing — why should I trust this?",
    shortAnswer:
      "We don't promise magic overnight leads — we de-risk your investment with a small starter scope and a 40% / 60% milestone payment structure.",
    valueAnswer:
      "Honestly, leads on any website come from two real engines: organic visibility (Google/AI search & social links) and paid ads. Because we know many agencies have been burned before, you don't have to commit to a massive project on day one. You can start with a small, focused scope — for example, your website back end receiving AI-qualified leads straight from WhatsApp — pay 40% upfront to begin, watch the live system work on your real business, and only pay the remaining 60% upon completion and your approval before full code handover.",
  },
  {
    id: "web-10",
    serviceTag: "Custom Websites & Web Applications",
    category: "web-apps",
    categoryLabel: "Web & Backend",
    question: "Can my team upload, edit, and remove listings ourselves without calling a developer — and how do we keep listings accurate?",
    shortAnswer:
      "Yes — your team logs into a simple, user-friendly back end where adding or updating a property takes minutes, protected by email-based access levels.",
    valueAnswer:
      "Just log in, upload photos, videos, descriptions, and prices, and hit publish — no developer needed. To prevent fake, duplicate, or outdated listings, permissions are controlled strictly by authorized staff email accounts (for example, letting agents submit listings while only approved managers can publish or edit live properties).",
  },
  {
    id: "web-11",
    serviceTag: "Custom Websites & Web Applications",
    category: "web-apps",
    categoryLabel: "Web & Backend",
    question: "Should my real estate website show property prices publicly, or ask buyers to enquire for the price?",
    shortAnswer:
      "Yes — showing prices (or clear price ranges per area) helps buyers immediately see what fits their budget and pre-qualifies them before they message your team.",
    valueAnswer:
      "Serious buyers want a realistic feel for your inventory by neighborhood and market range. Displaying transparent prices or 'From KES...' ranges keeps qualified buyers engaged longer on your pages — which also boosts your search visibility on Google — while filtering out people outside your price band. You can still reserve 'Price on Request' strictly for ultra-luxury or off-market properties.",
  },
  {
    id: "web-12",
    serviceTag: "Custom Websites & Web Applications",
    category: "web-apps",
    categoryLabel: "Web & Backend",
    question: "How long does it take to launch, and will it work smoothly for Kenyan buyers on mobile data — without distracting my team?",
    shortAnswer:
      "1–2 weeks for a core listings front end, and 3–4 weeks for a full system (website + CRM back end + WhatsApp AI + M-Pesa) — built mobile-first for Kenyan buyers.",
    valueAnswer:
      "As a Kenyan-based engineering team, we build for real local conditions: compressed images and fast-loading mobile pages that open smoothly on cellular data and everyday smartphones. We handle the entire build end-to-end so your sales team stays focused on closing deals, requiring only brief check-ins and a quick onboarding session at launch so your staff can use the online office immediately.",
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
