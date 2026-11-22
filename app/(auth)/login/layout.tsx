import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE, absoluteUrl } from "@/lib/site-config"

const pageUrl = absoluteUrl("/login")

export const metadata: Metadata = {
  title: "Log In | Cillah Client & Admin Portal",
  description:
    "Log in to your Cillah account to access your CRM pipeline, sales dashboard, AI agents, and client management system.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Log In | Cillah Client & Admin Portal",
    description:
      "Log in to your Cillah account to access your CRM pipeline, sales dashboard, AI agents, and client management system.",
    url: pageUrl,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Log In | Cillah Client & Admin Portal",
    description:
      "Log in to your Cillah account to access your CRM pipeline, sales dashboard, AI agents, and client management system.",
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
