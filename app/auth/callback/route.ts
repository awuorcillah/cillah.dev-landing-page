import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '')
      .replace(/\/rest\/v1\/?$/, '')
      .replace(/\/$/, '')

    // Accumulate all set-cookie directives during OAuth code exchange
    const cookiesToSetInResponse: Array<{ name: string; value: string; options: any }> = []

    const supabase = createServerClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookieHeader = request.headers.get('cookie') || ''
            return cookieHeader.split('; ').filter(Boolean).map(c => {
              const [name, ...val] = c.split('=')
              return { name, value: val.join('=') }
            })
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(cookie => {
              cookiesToSetInResponse.push(cookie)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user
      const email = user.email?.toLowerCase() || ''
      const isAdmin = email.includes('cillah') || email.includes('admin') || email === 'awuorcillah@gmail.com'

      // Create a session-aware Supabase client to perform profile lookup and creation
      const sessionSupabase = createServerClient(
        supabaseUrl,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              const cookieMap = new Map<string, string>()
              const cookieHeader = request.headers.get('cookie') || ''
              cookieHeader.split('; ').filter(Boolean).forEach(c => {
                const [name, ...val] = c.split('=')
                cookieMap.set(name, val.join('='))
              })
              cookiesToSetInResponse.forEach(({ name, value }) => {
                cookieMap.set(name, value)
              })
              return Array.from(cookieMap.entries()).map(([name, value]) => ({ name, value }))
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(cookie => cookiesToSetInResponse.push(cookie))
            },
          },
        }
      )

      let role = isAdmin ? 'admin' : 'user'
      try {
        const { data: profile } = await sessionSupabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profile?.role) {
          role = profile.role
        }

        const fullName: string = user.user_metadata?.full_name || user.user_metadata?.name || ''
        const nameParts = fullName.trim().split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        const avatarUrl: string = user.user_metadata?.avatar_url || user.user_metadata?.picture || ''

        if (!profile) {
          await sessionSupabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: fullName || user.email?.split('@')[0],
            first_name: firstName,
            last_name: lastName,
            avatar_url: avatarUrl,
            role: isAdmin ? 'admin' : 'user',
            status: 'active',
            updated_at: new Date().toISOString()
          })
        }
      } catch (err) {
        console.error('Profile sync error in OAuth callback:', err)
      }

      let redirectPath = '/user/dashboard'
      if (isAdmin || role === 'admin') {
        redirectPath = '/admin/dashboard'
      } else if (role === 'client') {
        redirectPath = '/client/dashboard'
      }

      // Build redirect response and attach all session cookies with root path '/'
      const response = NextResponse.redirect(`${origin}${redirectPath}`)
      cookiesToSetInResponse.forEach(({ name, value, options }) => {
        response.cookies.set(name, value, {
          path: '/',
          ...options,
        })
      })

      return response
    }
  }

  // Auth failed — redirect to login with error parameter
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}



