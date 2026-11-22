import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminAccount } from '@/lib/auth-roles'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              path: '/',
              ...options,
            })
          )
        },
      },
    }
  )

  let user: any = null
  try {
    const authResult = await Promise.race([
      supabase.auth.getUser(),
      new Promise<{ data: { user: null } }>((resolve) =>
        setTimeout(() => resolve({ data: { user: null } }), 5000)
      ),
    ])
    user = authResult?.data?.user ?? null
  } catch {
    user = null
  }

  const url = request.nextUrl.clone()

  // Helper to check if authenticated user is admin (strictly DB role or Super Admin)
  const isUserAdmin = (userObj: any, profileObj: any) => {
    return isAdminAccount(userObj?.email || profileObj?.email, profileObj?.role)
  }

  // Protect /admin routes -> Only 'admin' role or admin email allowed
  if (url.pathname.startsWith('/admin')) {
    if (!user) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (!isUserAdmin(user, profile)) {
      url.pathname = '/user/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Protect /client routes (never /client-portal) -> Any authenticated client, user or admin allowed
  if (url.pathname === '/client' || url.pathname.startsWith('/client/')) {
    if (!user) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Protect /dashboard routes -> Any authenticated user
  if (url.pathname === '/dashboard' || url.pathname.startsWith('/dashboard/')) {
    if (!user) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  // Protect /user routes -> Any authenticated user
  if (url.pathname.startsWith('/user')) {
    if (!user) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

