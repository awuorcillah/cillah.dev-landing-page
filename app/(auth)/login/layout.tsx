import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Log In | Cillah.dev Client & Admin Portal',
  description: 'Log in to your Cillah.dev account to access your CRM pipeline, sales dashboard, AI agents, and client management system.',
  alternates: {
    canonical: 'https://cillah.dev/login',
  },
  openGraph: {
    title: 'Log In | Cillah.dev Client & Admin Portal',
    description: 'Log in to your Cillah.dev account to access your CRM pipeline, sales dashboard, AI agents, and client management system.',
    url: 'https://cillah.dev/login',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
