import type { Metadata } from "next"
import { HomePageClient } from "@/components/home-page-client"
import { SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Cillah | AI & Automation for Real Estate Agencies in Kenya",
  description:
    "Cillah builds websites, AI assistants and automation for Kenyan real estate agencies, so no lead is lost to slow, manual follow-up.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Cillah | AI & Automation for Real Estate Agencies in Kenya",
    description:
      "Cillah builds websites, AI assistants and automation for Kenyan real estate agencies, so no lead is lost to slow, manual follow-up.",
    url: SITE_URL,
    type: "website",
    locale: "en_US",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cillah | AI & Automation for Real Estate Agencies in Kenya",
    description:
      "Cillah builds websites, AI assistants and automation for Kenyan real estate agencies, so no lead is lost to slow, manual follow-up.",
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function HomePage() {
  return <HomePageClient />
}
