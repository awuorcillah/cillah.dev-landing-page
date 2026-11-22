import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE, absoluteUrl } from "@/lib/site-config"

const pageUrl = absoluteUrl("/terms")

export const metadata: Metadata = {
  title: "Terms of Service | Cillah.dev",
  description:
    "Terms of service, client agreements, and software licensing conditions for Cillah.dev (Cillah AI Automation, Nairobi, Kenya).",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Terms of Service | Cillah.dev",
    description: "Terms of service and client agreements for Cillah.dev.",
    url: pageUrl,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Cillah.dev",
    description: "Terms of service and client agreements for Cillah.dev.",
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
