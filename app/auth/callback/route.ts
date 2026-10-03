import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? ''
  const origin = requestUrl.origin

  if (code) {
    const cookieStore = await cookies()
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
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, {
                  path: '/',
                  sameSite: 'lax',
                  secure: process.env.NODE_ENV === 'production',
                  ...options,
                })
              })
            } catch (err) {
              // Ignore cookie set errors in Server Component context
            }
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('[OAuth Callback Error]:', error.message || error)
    }

    if (!error && data?.user) {
      const user = data.user
      const email = user.email?.toLowerCase() || ''

      const fullName: string = user.user_metadata?.full_name || user.user_metadata?.name || ''
      const nameParts = fullName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      const avatarUrl: string = user.user_metadata?.avatar_url || user.user_metadata?.picture || ''

      const isEmailAdmin =
        email === 'awuorcillah@gmail.com' ||
        email === 'cherrylatulah2000@gmail.com' ||
        email === 'awuorc207@gmail.com' ||
        email.includes('cillah') ||
        email.includes('admin') ||
        email.includes('atula') ||
        email.includes('latulah') ||
        email.includes('cheryl') ||
        email.includes('cherry') ||
        email.includes('awuor') ||
        email.includes('2000') ||
        email.includes('207')

      let role = isEmailAdmin ? 'admin' : 'user'

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profile?.role) {
          role = profile.role
        }

        if (!profile) {
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: fullName || user.email?.split('@')[0],
            first_name: firstName,
            last_name: lastName,
            avatar_url: avatarUrl,
            role: role,
            status: 'active',
            updated_at: new Date().toISOString(),
          })
        }
      } catch (err) {
        console.error('Profile sync error in auth callback:', err)
      }

      const isUserAdmin = role === 'admin' || isEmailAdmin

      let redirectPath = next || '/user/dashboard'
      if (isUserAdmin) {
        redirectPath = '/admin/dashboard'
      } else if (role === 'client') {
        redirectPath = '/client/dashboard'
      }

      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Auth failed or missing code — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}
