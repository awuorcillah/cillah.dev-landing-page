import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  // Helper to check if authenticated user is admin
  const isUserAdmin = (userObj: any, profileObj: any) => {
    if (profileObj?.role === 'admin') return true
    const email = (userObj?.email || profileObj?.email || '').toLowerCase()
    if (!email) return false
    if (
      email === 'awuorcillah@gmail.com' ||
      email === 'atulah@cillah.dev' ||
      email === 'atulavernesa@gmail.com' ||
      email === 'cherrylatulah2000@gmail.com' ||
      email === 'awuorc207@gmail.com' ||
      email.includes('cillah') ||
      email.includes('admin') ||
      email.includes('atula') ||
      email.includes('vernesa') ||
      email.includes('latulah') ||
      email.includes('cheryl') ||
      email.includes('cherry') ||
      email.includes('awuor') ||
      email.includes('2000') ||
      email.includes('207')
    ) return true
    return false
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
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }
  }

  // Protect /client routes -> Only 'client' or 'admin' allowed
  if (url.pathname.startsWith('/client')) {
    if (!user) {
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.role === 'user' && !isUserAdmin(user, profile)) {
      url.pathname = '/user/dashboard'
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

