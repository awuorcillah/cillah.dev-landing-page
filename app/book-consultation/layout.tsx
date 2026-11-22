import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE, absoluteUrl } from "@/lib/site-config"

const pageUrl = absoluteUrl("/book-consultation")

export const metadata: Metadata = {
  title: "Book a Consultation | Strategic Systems & AI Architecture | Cillah.dev",
  description:
    "Schedule a one-on-one consultation with Cillah.dev to map out custom web applications, autonomous WhatsApp/Instagram AI agents, and automated operations for your business.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Book a Consultation | Strategic Systems & AI Architecture | Cillah.dev",
    description:
      "Schedule a one-on-one consultation with Cillah.dev to map out custom web applications, autonomous WhatsApp/Instagram AI agents, and automated operations.",
    url: pageUrl,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Book a Consultation | Strategic Systems & AI Architecture | Cillah.dev",
    description:
      "Schedule a one-on-one consultation with Cillah.dev to map out custom web applications, autonomous WhatsApp/Instagram AI agents, and automated operations.",
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function BookConsultationLayout({ children }: { children: React.ReactNode }) {
  return children
}
