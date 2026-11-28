import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // If OAuth ever returns to /?code=..., redirect immediately at the edge before the homepage renders
  if (
    request.nextUrl.pathname === '/' &&
    (request.nextUrl.searchParams.has('code') || request.nextUrl.searchParams.has('error'))
  ) {
    const callbackUrl = request.nextUrl.clone()
    callbackUrl.pathname = '/auth/callback'
    return NextResponse.redirect(callbackUrl)
  }

  // Never block normal public homepage visits on Supabase auth calls
  if (request.nextUrl.pathname === '/') {
    return NextResponse.next()
  }

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/',
    '/admin/:path*',
    '/user/:path*',
    '/client/:path*',
    '/dashboard/:path*',
  ],
}
