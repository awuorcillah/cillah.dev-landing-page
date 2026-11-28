import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { isAdminAccount } from '@/lib/auth-roles'

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl

  // 1. If OAuth ever returns to /?code=..., redirect immediately at the edge before the homepage renders
  if (pathname === '/' && (searchParams.has('code') || searchParams.has('error'))) {
    const callbackUrl = request.nextUrl.clone()
    callbackUrl.pathname = '/auth/callback'
    return NextResponse.redirect(callbackUrl)
  }

  // 2. For logged-in team members / admins with department access, ALWAYS make the backend dashboard
  //    their resting page when visiting `/` until they explicitly Log Out.
  //    Logged-out visitors have no `sb-*-auth-token` cookie so they bypass Supabase in 0ms!
  if (pathname === '/') {
    const hasAuthCookie = request.cookies
      .getAll()
      .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'))

    if (!hasAuthCookie) {
      return NextResponse.next()
    }

    try {
      const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
        .replace(/\/rest\/v1\/?$/, '')
        .replace(/\/$/, '')

      const supabase = createServerClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll() {
              // Read-only session check on /
            },
          },
        }
      )

      const authResult = await Promise.race([
        supabase.auth.getUser(),
        new Promise<{ data: { user: null } }>((resolve) =>
          setTimeout(() => resolve({ data: { user: null } }), 3500)
        ),
      ])

      const user = authResult?.data?.user ?? null
      if (user) {
        const email = (user.email || '').toLowerCase().trim()

        // Fast path for Super Admin (CEO / Chief Developer)
        if (isAdminAccount(email, null)) {
          const dest = request.nextUrl.clone()
          dest.pathname = '/admin'
          dest.search = ''
          return NextResponse.redirect(dest)
        }

        // Check if user is an Org Admin or active department staff member
        const [{ data: profile }, { data: staff }] = await Promise.all([
          supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
          supabase
            .from('staff_members')
            .select('status, role, is_active')
            .ilike('email', email)
            .eq('is_active', true)
            .maybeSingle(),
        ])

        const isAdmin =
          isAdminAccount(email, profile?.role) ||
          String(staff?.status || '').toLowerCase() === 'admin'

        if (isAdmin) {
          const dest = request.nextUrl.clone()
          dest.pathname = '/admin'
          dest.search = ''
          return NextResponse.redirect(dest)
        }

        if (staff) {
          const dest = request.nextUrl.clone()
          dest.pathname = '/user/dashboard'
          dest.search = ''
          return NextResponse.redirect(dest)
        }
      }
    } catch {
      // Fall through cleanly to public homepage on transient errors
    }

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
