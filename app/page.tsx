import type { Metadata } from "next"
import { HomePageClient } from "@/components/home-page-client"
import { SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Cillah.dev | The Operating System Behind High-Performing Real Estate Agencies",
  description:
    "Cillah.dev is the luxury operating system behind high-performing real estate agencies. Streamline your operations, client services, and workflows with premium SaaS technology.",
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: "Cillah.dev | The Operating System Behind High-Performing Real Estate Agencies",
    description:
      "Cillah.dev is the luxury operating system behind high-performing real estate agencies. Streamline your operations, client services, and workflows.",
    url: SITE_URL,
    type: "website",
    locale: "en_US",
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cillah.dev | The Operating System Behind High-Performing Real Estate Agencies",
    description:
      "Cillah.dev is the luxury operating system behind high-performing real estate agencies. Streamline your operations, client services, and workflows.",
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function HomePage() {
  return <HomePageClient />
}
