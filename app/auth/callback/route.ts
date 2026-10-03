import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      const user = data.user

      // Check if this is a new Google OAuth user — pre-populate profile fields
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, first_name, last_name, avatar_url')
        .eq('id', user.id)
        .single()

      // If first_name is empty (first Google login), populate from Google metadata
      if (profile && !profile.first_name) {
        const fullName: string = user.user_metadata?.full_name || user.user_metadata?.name || ''
        const nameParts = fullName.trim().split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        const avatarUrl: string = user.user_metadata?.avatar_url || user.user_metadata?.picture || ''

        await supabase
          .from('profiles')
          .update({
            first_name: firstName,
            last_name: lastName,
            full_name: fullName || profile.first_name,
            ...(avatarUrl && !profile.avatar_url ? { avatar_url: avatarUrl } : {}),
          })
          .eq('id', user.id)
      }

      // Smart role-based routing with admin email detection
      const email = user.email?.toLowerCase() || ''
      const role = profile?.role || 'user'
      const isAdmin = role === 'admin' || email.includes('cillah') || email.includes('admin') || email === 'awuorcillah@gmail.com'

      let redirectPath = '/user/dashboard'
      if (isAdmin) redirectPath = '/admin/dashboard'
      else if (role === 'client') redirectPath = '/client/dashboard'

      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Auth failed — redirect to login with error param
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`)
}

