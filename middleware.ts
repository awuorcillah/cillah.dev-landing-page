import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

// Run auth middleware ONLY on protected private routes so public marketing pages
// (/, /our-services, /use-cases, /articles, /pricing, /book-consultation, /client-portal)
// serve directly from Vercel's edge cache without blocking on Supabase auth calls.
export const config = {
  matcher: [
    '/admin/:path*',
    '/user/:path*',
    '/client/:path*',
    '/dashboard/:path*',
  ],
}
