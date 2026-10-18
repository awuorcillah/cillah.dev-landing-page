import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | Cillah.dev",
  description:
    "Terms of service, client agreements, and software licensing conditions for Cillah.dev (Cillah AI Automation, Nairobi, Kenya).",
  alternates: {
    canonical: "https://cillah.dev/terms",
  },
  openGraph: {
    title: "Terms of Service | Cillah.dev",
    description: "Terms of service and client agreements for Cillah.dev.",
    url: "https://cillah.dev/terms",
    images: ["/images/cillah-emblem.png"],
  },
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children
}
