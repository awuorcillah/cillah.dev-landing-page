import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Our Services | Custom Websites, AI Agents & CRM Automation | Cillah.dev",
  description:
    "Explore our 3-Pillar Digital Operating System: Custom Web Applications & Client Portals, 24/7 Autonomous AI Agents in Inboxes, and Marketing-to-CRM Automation Pipelines.",
  alternates: {
    canonical: "https://cillah.dev/our-services",
  },
  openGraph: {
    title: "Our Services | Custom Websites, AI Agents & CRM Automation | Cillah.dev",
    description:
      "Explore our 3-Pillar Digital Operating System: Custom Web Applications & Client Portals, 24/7 Autonomous AI Agents in Inboxes, and Marketing-to-CRM Automation Pipelines.",
    url: "https://cillah.dev/our-services",
    images: ["/images/cillah-emblem.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Services | Custom Websites, AI Agents & CRM Automation | Cillah.dev",
    description:
      "Explore our 3-Pillar Digital Operating System: Custom Web Applications & Client Portals, 24/7 Autonomous AI Agents in Inboxes, and Marketing-to-CRM Automation Pipelines.",
    images: ["/images/cillah-emblem.png"],
  },
}

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return children
}
