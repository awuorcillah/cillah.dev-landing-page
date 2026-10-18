import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Book a Consultation | Strategic Systems & AI Architecture | Cillah.dev",
  description:
    "Schedule a one-on-one consultation with Cillah.dev to map out custom web applications, autonomous WhatsApp/Instagram AI agents, and automated operations for your business.",
  alternates: {
    canonical: "https://cillah.dev/book-consultation",
  },
  openGraph: {
    title: "Book a Consultation | Strategic Systems & AI Architecture | Cillah.dev",
    description:
      "Schedule a one-on-one consultation with Cillah.dev to map out custom web applications, autonomous WhatsApp/Instagram AI agents, and automated operations.",
    url: "https://cillah.dev/book-consultation",
    images: ["/images/cillah-emblem.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Book a Consultation | Strategic Systems & AI Architecture | Cillah.dev",
    description:
      "Schedule a one-on-one consultation with Cillah.dev to map out custom web applications, autonomous WhatsApp/Instagram AI agents, and automated operations.",
    images: ["/images/cillah-emblem.png"],
  },
}

export default function BookConsultationLayout({ children }: { children: React.ReactNode }) {
  return children
}
