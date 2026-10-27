import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Our Services | Custom Websites, AI Agents, CRM & B2B Cold Email Outreach | Cillah.dev",
  description:
    "Explore our 4-Pillar Digital Operating System: Custom Web Applications & Client Portals, 24/7 Autonomous AI Agents in Inboxes, Marketing CRM Automation Pipelines, and Direct-to-Decision-Maker LinkedIn & Cold Email Outreach.",
  alternates: {
    canonical: "https://cillah.dev/our-services",
  },
  openGraph: {
    title: "Our Services | Custom Websites, AI Agents, CRM & B2B Cold Email Outreach | Cillah.dev",
    description:
      "Explore our 4-Pillar Digital Operating System: Custom Web Applications & Client Portals, 24/7 Autonomous AI Agents in Inboxes, Marketing CRM Automation Pipelines, and Direct-to-Decision-Maker LinkedIn & Cold Email Outreach.",
    url: "https://cillah.dev/our-services",
    images: ["/images/cillah-emblem.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Services | Custom Websites, AI Agents, CRM & B2B Cold Email Outreach | Cillah.dev",
    description:
      "Explore our 4-Pillar Digital Operating System: Custom Web Applications & Client Portals, 24/7 Autonomous AI Agents in Inboxes, Marketing CRM Automation Pipelines, and Direct-to-Decision-Maker LinkedIn & Cold Email Outreach.",
    images: ["/images/cillah-emblem.png"],
  },
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children
}
