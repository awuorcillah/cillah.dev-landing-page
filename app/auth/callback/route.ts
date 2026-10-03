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

    // Create the initial response object that receives session cookies
    let response = NextResponse.redirect(`${origin}/user/dashboard`)

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
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, {
                path: '/',
                ...options,
              })
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user
      const email = user.email?.toLowerCase() || ''

      const fullName: string = user.user_metadata?.full_name || user.user_metadata?.name || ''
      const nameParts = fullName.trim().split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''
      const avatarUrl: string = user.user_metadata?.avatar_url || user.user_metadata?.picture || ''

      const isEmailAdmin =
        email.includes('cillah') ||
        email.includes('admin') ||
        email.includes('atula') ||
        email.includes('cheryl') ||
        email === 'awuorcillah@gmail.com'

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

      const isUserAdmin =
        role === 'admin' ||
        email.includes('cillah') ||
        email.includes('admin') ||
        email.includes('atula') ||
        email.includes('cheryl') ||
        email === 'awuorcillah@gmail.com'

      let redirectPath = '/user/dashboard'
      if (isUserAdmin) {
        redirectPath = '/admin/dashboard'
      } else if (role === 'client') {
        redirectPath = '/client/dashboard'
      }

      // Update response redirect location while retaining all session cookies
      response.headers.set('Location', `${origin}${redirectPath}`)
      return response
    }
  }

  // Auth failed — redirect to login with error parameter
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}




