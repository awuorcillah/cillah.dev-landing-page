import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE, absoluteUrl } from "@/lib/site-config"

const pageUrl = absoluteUrl("/privacy-policy")

export const metadata: Metadata = {
  title: "Privacy Policy | Cillah",
  description:
    "Privacy policy and data protection standards for Cillah, operated by Cillah AI Automation (Nairobi, Kenya).",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Privacy Policy | Cillah",
    description: "Privacy policy and data protection standards for Cillah.",
    url: pageUrl,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Cillah",
    description: "Privacy policy and data protection standards for Cillah.",
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children
}
