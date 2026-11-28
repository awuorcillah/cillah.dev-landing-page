import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isAdminAccount, isSuperAdminEmail } from '@/lib/auth-roles'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? ''
  const errorParam = requestUrl.searchParams.get('error')
  const errorDesc = requestUrl.searchParams.get('error_description')

  // Resolve proper origin behind load balancers / Vercel
  const forwardedHost = request.headers.get('x-forwarded-host')
  const origin =
    process.env.NODE_ENV === 'production' && forwardedHost
      ? `https://${forwardedHost}`
      : requestUrl.origin

  if (errorParam) {
    console.error('[OAuth Provider Error]:', errorParam, errorDesc)
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorParam)}&error_description=${encodeURIComponent(errorDesc || '')}`
    )
  }

  if (code) {
    const cookieStore = await cookies()
    const pendingCookies: Array<{ name: string; value: string; options: CookieOptions }> = []

    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
      .replace(/\/rest\/v1\/?$/, '')
      .replace(/\/$/, '')

    const supabase = createServerClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const mergedOptions: CookieOptions = {
                path: '/',
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                ...options,
              }
              pendingCookies.push({ name, value, options: mergedOptions })
              try {
                cookieStore.set(name, value, mergedOptions)
              } catch {
                // Cookie will be stamped explicitly on the redirect NextResponse below
              }
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[OAuth Callback Error]:', error.message || error)
      return NextResponse.redirect(
        `${origin}/login?error=exchange_failed&error_description=${encodeURIComponent(error.message)}`
      )
    }

    if (data?.user) {
      const user = data.user
      const email = user.email?.toLowerCase() || ''

      const fullName: string = user.user_metadata?.full_name || user.user_metadata?.name || ''
      const nameParts = fullName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      const avatarUrl: string = user.user_metadata?.avatar_url || user.user_metadata?.picture || ''

      let role = isSuperAdminEmail(email) ? 'admin' : 'user'

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profile?.role) {
          role = profile.role
        } else {
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: fullName || user.email?.split('@')[0],
            first_name: firstName,
            last_name: lastName,
            avatar_url: avatarUrl,
            role,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
        }
      } catch (err) {
        console.error('Profile sync error in auth callback:', err)
      }

      const isUserAdmin = isAdminAccount(email, role)
      const safeNext = next && next.startsWith('/') && next !== '/' ? next : ''
      const redirectPath = safeNext || (isUserAdmin ? '/admin' : '/user/dashboard')

      // Stamp every Supabase auth cookie directly on the redirect response so the very first
      // request to /admin or /user/dashboard is already authenticated (zero bounce back to /login!)
      const response = NextResponse.redirect(`${origin}${redirectPath}`)
      for (const cookie of pendingCookies) {
        response.cookies.set(cookie.name, cookie.value, cookie.options)
      }
      return response
    }
  }

  return NextResponse.redirect(
    `${origin}/login?error=missing_code&error_description=No+authorization+code+provided`
  )
}
