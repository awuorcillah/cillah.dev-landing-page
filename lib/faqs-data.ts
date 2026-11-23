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
  // SERVICE 4: B2B Cold Email Outreach
  // -------------------------------------------------------------
  {
    id: "outreach-1",
    serviceTag: "B2B Cold Email Outreach",
    category: "outreach",
    categoryLabel: "B2B Cold Email Outreach",
    question: "Is B2B cold email dead — do busy CEOs and founders actually reply anymore?",
    shortAnswer:
      "No — generic mass spam is dead, but researched, niche-targeted cold email still starts real conversations with CEOs and Managing Directors every week.",
    valueAnswer:
      "Busy decision-makers ignore vague pitches, but they read short emails that speak directly to a daily operational problem in their exact industry. Every campaign starts with real market research into your niche so the message speaks their language. In our own real estate campaign across Kenya, Dubai, and Singapore, verifying 468 decision-maker emails produced 10 real human replies — including 5 positive executive conversations and 3 active warm sales pipelines.",
  },
  {
    id: "outreach-2",
    serviceTag: "B2B Cold Email Outreach",
    category: "outreach",
    categoryLabel: "B2B Cold Email Outreach",
    question: "I've tried cold email (or paid an agency) before and got zero meetings — why would this be different?",
    shortAnswer:
      "Most failed campaigns blast generic templates to unverified lists with zero research and stop after one email. We combine niche research, verified decision-maker targeting, personalized messaging, and consistent multi-step follow-ups.",
    valueAnswer:
      "Outbound isn't about blasting strangers — it's about identifying your exact ideal buyers, verifying their direct corporate contacts, opening with relevant context, and following up politely with empathy and curiosity. In our own real-world campaigns, half of our executive replies came on Follow-Up #2 rather than the first email — proving that structured, patient follow-up is where real relationships begin.",
  },
  {
    id: "outreach-3",
    serviceTag: "B2B Cold Email Outreach",
    category: "outreach",
    categoryLabel: "B2B Cold Email Outreach",
    question: "What realistic reply rates and results should I expect — and how do you report them?",
    shortAnswer:
      "We don't sell fake '100 guaranteed meetings' hype. Based on real B2B benchmarks and our own live campaigns, expect roughly 2–5 real human replies and 1–2 warm executive conversations per 100 verified emails sent.",
    valueAnswer:
      "For every 100 verified decision-maker emails, typically 14–15 return automatic responses (out-of-office or unavailable), 2+ generate real human replies, and 1+ turn into genuine sales conversations — and those numbers compound across a 4-step sequence (Pitch + 3 Follow-Ups). Everything is tracked transparently in a live sheet and dashboard showing verified contacts, delivered emails, bounces, automatic replies, real human replies, and positive leads.",
  },
  {
    id: "outreach-4",
    serviceTag: "B2B Cold Email Outreach",
    category: "outreach",
    categoryLabel: "B2B Cold Email Outreach",
    question: "Will running cold email outreach ruin my main company domain or break our regular business emails?",
    shortAnswer:
      "No — we never send cold outreach from your main company domain. We isolate everything on dedicated secondary domains with strict authentication and gradual warm-up.",
    valueAnswer:
      "Your primary @yourcompany.com email stays 100% untouched. We configure dedicated outreach domains with full DNS authentication (SPF, DKIM, and DMARC), warm each inbox for at least 2 weeks, and cap daily sending at 10–30 emails per inbox so your brand's main email reputation is never put at risk.",
  },
  {
    id: "outreach-5",
    serviceTag: "B2B Cold Email Outreach",
    category: "outreach",
    categoryLabel: "B2B Cold Email Outreach",
    question: "How do you make sure our emails land in the primary inbox instead of Google or Microsoft's spam folder?",
    shortAnswer:
      "Through clean technical setup (SPF, DKIM, DMARC), 2-week inbox warm-up, low daily volume per inbox, plain-text human copy, and randomized sending intervals.",
    valueAnswer:
      "Spam filters flag accounts that fire 50 emails in 7 minutes or lack proper DNS authentication. Our automated workflows inject a randomized wait interval (such as 1–10 minutes) between every single email, send only 10–30 messages per inbox per day across multiple warmed addresses, avoid heavy links or attachments in first touches, and maintain strict bounce controls so emails land directly in the primary inbox.",
  },
  {
    id: "outreach-6",
    serviceTag: "B2B Cold Email Outreach",
    category: "outreach",
    categoryLabel: "B2B Cold Email Outreach",
    question: "How do you avoid bad, outdated, or bouncing emails from LinkedIn lists?",
    shortAnswer:
      "Every single corporate email is run through dedicated verification tools before a single campaign email is ever sent — keeping bounce rates under 2%.",
    valueAnswer:
      "Unverified databases often have 15–20% bounce rates that burn sending domains within weeks. We pull targeted decision-makers, enrich and verify each address so only active, deliverable corporate emails enter the sending queue (for example, filtering 1,500 raw contacts down to 468 verified decision-maker emails — keeping our live bounce rate under 2%).",
  },
  {
    id: "outreach-7",
    serviceTag: "B2B Cold Email Outreach",
    category: "outreach",
    categoryLabel: "B2B Cold Email Outreach",
    question: "Where do you get the decision-maker contacts, and why does fresh niche targeting beat recycled databases?",
    shortAnswer:
      "We build fresh, niche-specific decision-maker lists using targeted business filtering (such as LinkedIn Sales Navigator criteria by role, industry, and location) and verify direct corporate emails just before launch.",
    valueAnswer:
      "Generic bulk databases get downloaded and spammed by thousands of agencies at once, leading to dead emails and under-1% reply rates. By filtering specifically for exact decision-makers — CEOs, Founders, Managing Directors, or Heads of Marketing and Operations — in your target cities and verifying fresh addresses per campaign, you reach active executives who actually hold budget authority.",
  },
  {
    id: "outreach-8",
    serviceTag: "B2B Cold Email Outreach",
    category: "outreach",
    categoryLabel: "B2B Cold Email Outreach",
    question: "How do you make sure AI-assisted cold emails sound genuinely human and don't embarrass our brand in front of CEOs?",
    shortAnswer:
      "We use AI as a research assistant to personalize each opening line from real public company and executive context — never to blast robotic, self-centered templates.",
    valueAnswer:
      "Instead of sending copy-pasted pitches about how great your company is, our workflow researches each executive's role, company focus, and market context to draft a short, respectful, human-sounding opening line tied to a real business problem they care about. Every message sequence is reviewed and approved by you before going live.",
  },
  {
    id: "outreach-9",
    serviceTag: "B2B Cold Email Outreach",
    category: "outreach",
    categoryLabel: "B2B Cold Email Outreach",
    question: "Can skilled professionals or consultants also use this system to reach founders and hiring managers directly for contracts, retainers, or roles?",
    shortAnswer:
      "Yes — the exact same verified decision-maker outreach system helps specialists and consultants bypass crowded job portals and reach CEOs or hiring managers directly.",
    valueAnswer:
      "The secret is never sounding desperate or triggering spam filters on email #1. We send a short, plain-text introduction focused purely on your niche skillset and the specific problem you solve — with no resume attachments and no heavy links in the first email. Once the founder or hiring manager replies with interest, you follow up with your portfolio, case study, free sample value, or resume.",
  },
  {
    id: "outreach-10",
    serviceTag: "B2B Cold Email Outreach",
    category: "outreach",
    categoryLabel: "B2B Cold Email Outreach",
    question: "Is B2B cold email outreach legal (Kenya Data Protection Act, GDPR, CAN-SPAM)?",
    shortAnswer:
      "Yes — responsible B2B outreach to relevant corporate email addresses is legal when done transparently, with clear sender identity and instant opt-out compliance.",
    valueAnswer:
      "We only target relevant business decision-makers at corporate addresses (never personal consumer spam), keep data strictly minimized to professional contact details, clearly state who is reaching out and why it's relevant to their role, and immediately honor and suppress every unsubscribe or 'not interested' reply in line with B2B legitimate-interest standards under CAN-SPAM, GDPR, and Kenya's Data Protection Act.",
  },
  {
    id: "outreach-11",
    serviceTag: "B2B Cold Email Outreach",
    category: "outreach",
    categoryLabel: "B2B Cold Email Outreach",
    question: "How long does setup and warm-up take before emails start going out and replies come in?",
    shortAnswer:
      "Plan for 2 weeks of domain warm-up before live sending begins in Week 3, scaling safely from 10 to 30 emails per inbox per day.",
    valueAnswer:
      "Rushing volume on a brand-new domain destroys deliverability within weeks. During Weeks 1–2, we configure your secondary domains, DNS authentication, target niche research, verified lead list, and approved email copy while your inboxes warm up automatically. In Week 3, live outreach launches gradually across warmed inboxes — and scaling volume simply means adding additional warmed inboxes rather than overloading one.",
  },
  {
    id: "outreach-12",
    serviceTag: "B2B Cold Email Outreach",
    category: "outreach",
    categoryLabel: "B2B Cold Email Outreach",
    question: "What does B2B Cold Email Outreach actually cost, and who owns the domains, inboxes, lead lists, and copy if we stop?",
    shortAnswer:
      "Custom build and setup starts from $1,000 depending on scope, you pay your third-party tools directly in your own name, and you own 100% of every domain, inbox, verified lead list, workflow, and email sequence.",
    valueAnswer:
      "There are zero hidden markups or vendor lock-in. Typical third-party tools paid directly in your own accounts include LinkedIn Sales Navigator (~$120/mo or ~KES 16,000/mo), email finding & verification (e.g., Anymail Finder from $29/mo for 400 credits), lead enrichment tools (from ~$69/mo), workflow automation (n8n from ~$25/mo), AI personalization credits (OpenAI API starting from $5/mo), plus secondary domains (~$12/yr) and sending inboxes (~$6–$7/mo each). Everything stays yours permanently, and your verified contact list (excluding anyone who opted out) remains a reusable business asset.",
  },
]
