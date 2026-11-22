import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE, absoluteUrl } from "@/lib/site-config"

const pageUrl = absoluteUrl("/pricing")

export const metadata: Metadata = {
  title: "Pricing & Investment | Cillah",
  description:
    "Transparent investment tiers for custom web applications, autonomous inbox agents, and enterprise workflow ecosystems.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Pricing & Investment | Cillah",
    description:
      "Transparent investment tiers for custom web applications, autonomous inbox agents, and enterprise workflow ecosystems.",
    url: pageUrl,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing & Investment | Cillah",
    description:
      "Transparent investment tiers for custom web applications, autonomous inbox agents, and enterprise workflow ecosystems.",
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children
}
