import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up | Cillah.dev Client & Admin Portal',
  description: 'Create your Cillah.dev account to access autonomous AI inboxes, lead qualification workflows, and CRM pipeline automation.',
  alternates: {
    canonical: 'https://www.cillah.dev/signup',
  },
  openGraph: {
    title: 'Sign Up | Cillah.dev Client & Admin Portal',
    description: 'Create your Cillah.dev account to access autonomous AI inboxes, lead qualification workflows, and CRM pipeline automation.',
    url: 'https://www.cillah.dev/signup',
    images: ['/images/cillah-emblem.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sign Up | Cillah.dev Client & Admin Portal',
    description: 'Create your Cillah.dev account to access autonomous AI inboxes, lead qualification workflows, and CRM pipeline automation.',
    images: ['/images/cillah-emblem.png'],
  },
}

export default function SignUpLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
