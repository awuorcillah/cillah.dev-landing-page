import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Investment & Pricing | Software Solutions & AI Automation | Cillah.dev",
  description:
    "Transparent investment tiers for custom web applications, autonomous inbox agents, and enterprise workflow ecosystems.",
  alternates: {
    canonical: "https://cillah.dev/pricing",
  },
  openGraph: {
    title: "Investment & Pricing | Software Solutions & AI Automation | Cillah.dev",
    description:
      "Transparent investment tiers for custom web applications, autonomous inbox agents, and enterprise workflow ecosystems.",
    url: "https://cillah.dev/pricing",
    images: ["/images/cillah-emblem.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Investment & Pricing | Software Solutions & AI Automation | Cillah.dev",
    description:
      "Transparent investment tiers for custom web applications, autonomous inbox agents, and enterprise workflow ecosystems.",
    images: ["/images/cillah-emblem.png"],
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
