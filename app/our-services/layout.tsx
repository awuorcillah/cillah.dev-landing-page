import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE, absoluteUrl } from "@/lib/site-config"

const pageUrl = absoluteUrl("/our-services")

export const metadata: Metadata = {
  title: "Our Services | Custom Websites, AI Agents, CRM & B2B Cold Email Outreach | Cillah",
  description:
    "Explore our 4-Pillar Digital Operating System: Custom Web Applications & Client Portals, 24/7 Autonomous AI Agents in Inboxes, Marketing CRM Automation Pipelines, and Direct-to-Decision-Maker LinkedIn & Cold Email Outreach.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Our Services | Custom Websites, AI Agents, CRM & B2B Cold Email Outreach | Cillah",
    description:
      "Explore our 4-Pillar Digital Operating System: Custom Web Applications & Client Portals, 24/7 Autonomous AI Agents in Inboxes, Marketing CRM Automation Pipelines, and Direct-to-Decision-Maker LinkedIn & Cold Email Outreach.",
    url: pageUrl,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Services | Custom Websites, AI Agents, CRM & B2B Cold Email Outreach | Cillah",
    description:
      "Explore our 4-Pillar Digital Operating System: Custom Web Applications & Client Portals, 24/7 Autonomous AI Agents in Inboxes, Marketing CRM Automation Pipelines, and Direct-to-Decision-Maker LinkedIn & Cold Email Outreach.",
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children
}
