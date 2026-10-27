import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Use Cases & Proven Deployments | Cillah.dev',
  description: 'See practical automation workflows: how modern businesses and real estate agencies use Cillah.dev to automate customer responses, qualify leads, and close sales.',
  alternates: {
    canonical: 'https://cillah.dev/use-cases',
  },
  openGraph: {
    title: 'Use Cases & Proven Deployments | Cillah.dev',
    description: 'See practical automation workflows: how modern businesses and real estate agencies use Cillah.dev to automate customer responses, qualify leads, and close sales.',
    url: 'https://cillah.dev/use-cases',
    images: ['/images/cillah-emblem.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Use Cases & Proven Deployments | Cillah.dev',
    description: 'See practical automation workflows: how modern businesses and real estate agencies use Cillah.dev to automate customer responses, qualify leads, and close sales.',
    images: ['/images/cillah-emblem.png'],
  },
}

export default function UseCasesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
