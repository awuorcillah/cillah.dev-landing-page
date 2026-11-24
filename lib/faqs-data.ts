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
  // SERVICE 2: AI Inbox Automation
  // -------------------------------------------------------------
  {
    id: "ai-1",
    serviceTag: "AI Inbox Automation",
    category: "ai-agents",
    categoryLabel: "AI Inbox Automation",
    question: "Won't an AI chat assistant sound robotic and push away high-value buyers?",
    shortAnswer:
      "Badly built chatbots sound robotic and bombard people with 10 questions at once — ours are designed to reply warmly, concisely, and naturally like a helpful front-desk coordinator.",
    valueAnswer:
      "High-value buyers don't hate fast answers; they hate scripted menus and vague walls of text. We train your AI assistant on your brand tone so it answers what the buyer actually asked first, shares relevant details or photos upfront, and smoothly connects serious buyers to a real human agent without feeling pushy or mechanical.",
  },
  {
    id: "ai-2",
    serviceTag: "AI Inbox Automation",
    category: "ai-agents",
    categoryLabel: "AI Inbox Automation",
    question: "What if the AI quotes the wrong price, payment plan, or tells a buyer a sold property/item is still available?",
    shortAnswer:
      "It is locked strictly to your live inventory and approved business rules — it is never allowed to guess or make up prices, availability, or terms.",
    valueAnswer:
      "Whenever you update a price or mark a unit as sold in your back end, the AI sees that live data immediately. If a buyer asks anything outside your verified pricing or policies, the assistant politely holds off and hands the chat straight to a human team member rather than fabricating an answer.",
  },
  {
    id: "ai-3",
    serviceTag: "AI Inbox Automation",
    category: "ai-agents",
    categoryLabel: "AI Inbox Automation",
    question: "Will automating WhatsApp, Instagram, or Facebook DMs get our business account banned by Meta?",
    shortAnswer:
      "No — bans happen when people use unofficial scraping tools or blast repetitive spam replies. We build strictly on Meta's official APIs with safe rate limits and human-like guardrails.",
    valueAnswer:
      "We never use unauthorized browser hacks or mass-spam comment scripts that trigger Meta restrictions. Your automation responds to inbound enquiries naturally, varies replies properly, respects Meta's 24-hour messaging rules, and keeps your brand accounts compliant and safe.",
  },
  {
    id: "ai-4",
    serviceTag: "AI Inbox Automation",
    category: "ai-agents",
    categoryLabel: "AI Inbox Automation",
    question: "Can I keep my existing WhatsApp Business number — and what happens to my previous chats?",
    shortAnswer:
      "Yes, you can connect your existing number — and we walk you through the exact trade-offs transparently before touching anything so you never lose a chat by surprise.",
    valueAnswer:
      "Many platforms hide a critical detail: moving a number directly to the standard WhatsApp Cloud API can disconnect the classic WhatsApp Business phone app and doesn't automatically migrate old local chat history. Before setup, we back up your history and help you choose the cleanest setup for your agency (either keeping your current number on a supported coexistence/backup flow or running a dedicated official API line linked to your ads and website).",
  },
  {
    id: "ai-5",
    serviceTag: "AI Inbox Automation",
    category: "ai-agents",
    categoryLabel: "AI Inbox Automation",
    question: "Can the AI handle voice notes, property photos, mixed English/Swahili (or Sheng), and vague messages like 'sometime next week'?",
    shortAnswer:
      "Yes — we build specifically for how Kenyan and international buyers actually message on WhatsApp and Instagram, not just textbook English text.",
    valueAnswer:
      "Buyers routinely send voice notes, forward property screenshots, switch between English and Swahili, and say things like 'maybe next weekend.' Our AI transcribes voice notes, reads shared context, understands natural mixed language, and guides vague timing into a clear, confirmed calendar slot.",
  },
  {
    id: "ai-6",
    serviceTag: "AI Inbox Automation",
    category: "ai-agents",
    categoryLabel: "AI Inbox Automation",
    question: "What happens when a buyer asks a super-specific question or wants a real human — do they have to repeat everything?",
    shortAnswer:
      "No — the AI pauses immediately and hands the conversation to the assigned human sales rep along with the full chat history and a concise summary.",
    valueAnswer:
      "The moment a buyer asks to speak to an agent, raises a complex negotiation question, or finishes qualifying, your sales rep gets an instant notification with the buyer's name, budget, interest, and full transcript so they step in smoothly without making the client repeat a single word.",
  },
  {
    id: "ai-7",
    serviceTag: "AI Inbox Automation",
    category: "ai-agents",
    categoryLabel: "AI Inbox Automation",
    question: "How fast does it reply, and can it actually share real property photos, prices, and book viewings inside WhatsApp or Instagram?",
    shortAnswer:
      "Under 60 seconds, 24/7 — including evenings and weekends — sharing live photos, details, and direct booking/payment links right inside the chat.",
    valueAnswer:
      "Buyers frequently want to see photos and pricing before answering a dozen questions. The AI responds instantly while interest is hot, shares matching options from your live inventory, and guides ready buyers straight into a confirmed viewing or strategy call on your calendar.",
  },
  {
    id: "ai-8",
    serviceTag: "AI Inbox Automation",
    category: "ai-agents",
    categoryLabel: "AI Inbox Automation",
    question: "Why use AI Inbox Automation instead of just hiring a receptionist or social media assistant — doesn't it replace the human touch?",
    shortAnswer:
      "It doesn't replace your human team — it covers the evenings, weekends, and peak-hour rushes so serious buyers never wait 6 hours for a first reply and walk to a competitor.",
    valueAnswer:
      "High-ticket buyers still expect a real human advisor to negotiate and close the deal. Your AI assistant simply handles the instant first-60-second response, answers routine questions, and qualifies intent so your human team shows up fresh for the conversations that actually produce commissions.",
  },
  {
    id: "ai-9",
    serviceTag: "AI Inbox Automation",
    category: "ai-agents",
    categoryLabel: "AI Inbox Automation",
    question: "What are the real costs — including Meta's WhatsApp message fees — so we don't get surprise bills?",
    shortAnswer:
      "Custom setup starts from $1,000 depending on scope (40% upfront / 60% on completion and approval), plus transparent, direct pass-through costs for AI usage and Meta messaging with zero hidden markups.",
    valueAnswer:
      "We break down all three lines clearly before you start: (1) our build and optional monthly management fee, (2) direct AI usage credits (typically a few dollars a month depending on volume), and (3) Meta's official WhatsApp messaging charges (billed directly to your Meta Business account by message category and country, with budget alert caps so you never get blindsided).",
  },
  {
    id: "ai-10",
    serviceTag: "AI Inbox Automation",
    category: "ai-agents",
    categoryLabel: "AI Inbox Automation",
    question: "Who owns our chat history and leads, and how do we prove this actually books real viewings within 30 days?",
    shortAnswer:
      "You own 100% of every lead, contact, and transcript inside your own back end — with a clear 30-day dashboard showing leads captured, response speed, qualified buyers, and viewings booked.",
    valueAnswer:
      "We measure success on business outcomes, not vanity 'messages answered.' Your back end tracks every WhatsApp, Instagram, Facebook, and website enquiry from first message to human handover and booked viewing so you can see the exact return within the first 30 days.",
  },

  // -------------------------------------------------------------
  // SERVICE 3: AI Workflow Automation
  // -------------------------------------------------------------
  {
    id: "auto-1",
    serviceTag: "AI Workflow Automation",
    category: "automation",
    categoryLabel: "AI Workflow Automation",
    question: "Which daily business tasks give the fastest ROI when automated first — and where should AI stop and let humans decide?",
    shortAnswer:
      "Automate the repetitive admin that drains hours every day — capturing leads, syncing forms to your CRM, tracking invoices, and sending follow-ups — while keeping humans strictly in charge of high-stakes decisions.",
    valueAnswer:
      "We never pretend automation cuts your workday to one hour a day, and we never hand refunds, custom price quotes, legal matters, or deal negotiations over to autopilot. Automation handles the predictable busywork consistently, and routes sensitive or high-value decisions straight to a real person for approval.",
  },
  {
    id: "auto-2",
    serviceTag: "AI Workflow Automation",
    category: "automation",
    categoryLabel: "AI Workflow Automation",
    question: "Our current process and spreadsheets are messy — won't automation just automate chaos?",
    shortAnswer:
      "Yes, if you skip the audit — which is why we always map and clean up your workflow first before building a single automation.",
    valueAnswer:
      "Before writing code or connecting tools, we walk through how leads, bookings, and data actually move through your business, fix broken intake steps, define clear ownership, and start by automating one stable, high-impact workflow rather than rushing everything at once.",
  },
  {
    id: "auto-3",
    serviceTag: "AI Workflow Automation",
    category: "automation",
    categoryLabel: "AI Workflow Automation",
    question: "How do you stop paid ad leads, website forms, and Instagram/WhatsApp DMs from vanishing between tools?",
    shortAnswer:
      "Every channel feeds automatically into one central pipeline within seconds — with fallback storage and duplicate checks so zero enquiries slip through the cracks.",
    valueAnswer:
      "Instead of staff manually copying leads from Facebook Ads, Instagram DMs, WhatsApp, and website forms into spreadsheets (where up to half get missed or delayed), every incoming lead is captured, cleaned, routed to the right team member, and logged automatically in real time.",
  },
  {
    id: "auto-4",
    serviceTag: "AI Workflow Automation",
    category: "automation",
    categoryLabel: "AI Workflow Automation",
    question: "What happens if an automation silently breaks (an expired token, changed field, or permission error) — would anyone notice?",
    shortAnswer:
      "Nothing fails silently. Every critical workflow we build includes automatic retries, fallback lead storage, and instant failure alerts sent straight to WhatsApp or email.",
    valueAnswer:
      "A silent failure is worse than no automation at all. If a connected app expires a token or changes a field, our error-handling layer catches it immediately, preserves the raw incoming lead so nothing is lost, and alerts the right person the moment it happens instead of weeks later.",
  },
  {
    id: "auto-5",
    serviceTag: "AI Workflow Automation",
    category: "automation",
    categoryLabel: "AI Workflow Automation",
    question: "Why shouldn't we just duct-tape Zapier, Google Sheets scripts, and random tools ourselves?",
    shortAnswer:
      "DIY setups break easily, are hard to troubleshoot, and Zapier's per-task billing can spiral or pause your workflows right when business grows.",
    valueAnswer:
      "We build clean, documented systems on reliable infrastructure (like self-hosted n8n and custom APIs) with predictable monthly run costs — replacing fragile chains of random scripts with one unified system built around your actual operations.",
  },
  {
    id: "auto-6",
    serviceTag: "AI Workflow Automation",
    category: "automation",
    categoryLabel: "AI Workflow Automation",
    question: "Our CRM feels like a glorified spreadsheet — how does workflow automation stop reps from wasting 2+ hours a day on manual data entry and forgotten follow-ups?",
    shortAnswer:
      "Automation turns a passive CRM into an active engine that logs leads automatically, triggers timely reminders, and handles routine follow-ups without manual copy-pasting.",
    valueAnswer:
      "Sales reps shouldn't dread making calls because of two hours of boring CRM admin afterward. Incoming leads, booked consultations, notes, and follow-up schedules populate automatically so your team spends their day having real sales conversations and closing deals.",
  },
  {
    id: "auto-7",
    serviceTag: "AI Workflow Automation",
    category: "automation",
    categoryLabel: "AI Workflow Automation",
    question: "Can you automate workflows around the CRM and tools we already use (Salesforce, HubSpot, Zoho, Google Sheets, WhatsApp) without forcing us to switch?",
    shortAnswer:
      "Yes — we connect and automate around the tools your team already uses instead of forcing an expensive, disruptive CRM migration.",
    valueAnswer:
      "Whether you run on Salesforce, HubSpot, Zoho, Google Workspace, WhatsApp, or even legacy spreadsheets, we bridge your existing tools so data flows cleanly between them — and only recommend upgrading a tool if it is genuinely blocking your growth.",
  },
  {
    id: "auto-8",
    serviceTag: "AI Workflow Automation",
    category: "automation",
    categoryLabel: "AI Workflow Automation",
    question: "How do automated follow-ups and AI lead scoring filter out junk leads while still feeling human instead of robotic spam?",
    shortAnswer:
      "AI scores and filters every lead against your exact criteria behind the scenes, and follow-ups are written in short, natural language triggered by what the prospect actually asked for.",
    valueAnswer:
      "Your sales team stops wasting hours sifting through unqualified leads and focuses strictly on prospects who match your budget, location, and timeline. Follow-up messages feel like a helpful check-in tied to their specific enquiry — never spammy mass blasts.",
  },
  {
    id: "auto-9",
    serviceTag: "AI Workflow Automation",
    category: "automation",
    categoryLabel: "AI Workflow Automation",
    question: "My team struggles with new software — how do you make sure staff actually adopt the system without disrupting daily work?",
    shortAnswer:
      "Most of the automation runs invisibly behind the scenes, and we include plain-English SOPs, short walkthrough videos, and hands-on team onboarding.",
    valueAnswer:
      "We don't dump a complicated tool on your staff and disappear. We roll out in simple phases that remove manual work your team already hates, give each role clean access to only what they need, and train them in under an hour so adoption sticks from week one.",
  },
  {
    id: "auto-10",
    serviceTag: "AI Workflow Automation",
    category: "automation",
    categoryLabel: "AI Workflow Automation",
    question: "Who owns our workflows and customer data, is it compliant with data protection laws, and what does it cost?",
    shortAnswer:
      "Custom builds start from $1,000 depending on scope (with a 40% upfront / 60% upon completion and approval structure), third-party tools stay in your own name, and you own 100% of every workflow, credential, and record.",
    valueAnswer:
      "We never lock you into an agency account. All workflows, documentation, and customer data live under your business ownership with role-based access controls built in line with Kenya's Data Protection Act and GDPR best practices. You can start with one focused starter workflow, track real 30/60/90-day metrics (leads captured, response speed, hours saved, failed-run count), and scale only once you see it working.",
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
