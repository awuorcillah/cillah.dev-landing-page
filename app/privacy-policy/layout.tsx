import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | Cillah.dev",
  description:
    "Privacy policy and data protection standards for Cillah.dev, operated by Cillah AI Automation (Nairobi, Kenya).",
  alternates: {
    canonical: "https://cillah.dev/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | Cillah.dev",
    description: "Privacy policy and data protection standards for Cillah.dev.",
    url: "https://cillah.dev/privacy-policy",
    images: ["/images/cillah-emblem.png"],
  },
}

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return children
}
