import type { Metadata } from "next"
import { DEFAULT_OG_IMAGE, absoluteUrl } from "@/lib/site-config"

const pageUrl = absoluteUrl("/client-portal")

export const metadata: Metadata = {
  title: "Client Portal | Cillah",
  description:
    "Access your Cillah client workspace to view your sales pipeline, incoming leads, AI assistants, and automation dashboard.",
  alternates: {
    canonical: pageUrl,
  },
  openGraph: {
    title: "Client Portal | Cillah",
    description:
      "Access your Cillah client workspace to view your sales pipeline, incoming leads, AI assistants, and automation dashboard.",
    url: pageUrl,
    images: [DEFAULT_OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Client Portal | Cillah",
    description:
      "Access your Cillah client workspace to view your sales pipeline, incoming leads, AI assistants, and automation dashboard.",
    images: [DEFAULT_OG_IMAGE],
  },
}

export default function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
