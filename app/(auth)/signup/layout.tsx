import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE, absoluteUrl } from "@/lib/site-config"

const pageUrl = absoluteUrl("/signup")

export const metadata: Metadata = {
  title: "Sign Up | Cillah Client & Admin Portal",
  description:
    "Create your Cillah account to access autonomous AI inboxes, lead qualification workflows, and CRM pipeline automation.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Sign Up | Cillah Client & Admin Portal",
    description:
      "Create your Cillah account to access autonomous AI inboxes, lead qualification workflows, and CRM pipeline automation.",
    url: pageUrl,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sign Up | Cillah Client & Admin Portal",
    description:
      "Create your Cillah account to access autonomous AI inboxes, lead qualification workflows, and CRM pipeline automation.",
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
