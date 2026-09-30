'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { CheckCircle, UserCheck, Sparkles } from 'lucide-react'

export default function UserProfile() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUserEmail(user.email || '')
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        if (error) throw error
        setProfile(data)
      } catch (e: any) {
        toast.error(e.message ?? 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const file = files[0]
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const filePath = `${user.id}/${Date.now()}_${file.name}`
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })
      if (uploadErr) throw uploadErr
      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
      const avatarUrl = publicData.publicUrl
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id)
      if (updateErr) throw updateErr
      setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl }))
      toast.success('Profile picture updated!')
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <div className="flex items-center gap-2 text-cyan-400">
          <Sparkles className="w-5 h-5 animate-spin" /> Loading profile…
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-12">
      <div className="max-w-2xl mx-auto bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl p-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <UserCheck className="h-6 w-6 text-[#C9A66B]" />
          <h1 className="text-2xl font-bold text-slate-100">Your Profile</h1>
        </div>

        {/* Avatar + Info */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
          <div className="relative">
            <img
              src={profile?.avatar_url || '/placeholder-avatar.png'}
              alt="Profile Avatar"
              className="h-28 w-28 rounded-full border-2 border-[#C9A66B]/40 object-cover shadow-lg"
            />
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-[#C9A66B] animate-spin" />
              </div>
            )}
          </div>
          <div className="text-center sm:text-left">
            <p className="text-xl font-semibold text-slate-100">{profile?.full_name || 'Unnamed User'}</p>
            <p className="text-sm text-slate-400 mt-1">{userEmail}</p>
            <p className="text-sm text-slate-400 mt-1">{profile?.company_name || ''}</p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#C9A66B]/10 text-[#C9A66B] border border-[#C9A66B]/30">
              {profile?.role ?? 'user'}
            </span>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Full Name</p>
            <p className="text-slate-100 font-medium">{profile?.full_name || '—'}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Email</p>
            <p className="text-slate-100 font-medium">{userEmail || '—'}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Phone</p>
            <p className="text-slate-100 font-medium">{profile?.phone_number || '—'}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Company</p>
            <p className="text-slate-100 font-medium">{profile?.company_name || '—'}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Role</p>
            <p className="text-slate-100 font-medium capitalize">{profile?.role || 'user'}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Member Since</p>
            <p className="text-slate-100 font-medium">
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
            </p>
          </div>
        </div>

        {/* Avatar Upload */}
        <div className="p-6 rounded-xl bg-slate-800/30 border border-slate-700 mb-6">
          <p className="text-sm font-semibold text-slate-300 mb-3">Update Profile Picture</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            disabled={uploading}
            className="block w-full text-sm text-slate-400
              file:mr-4 file:py-2 file:px-5 file:rounded-full file:border-0
              file:text-sm file:font-semibold file:cursor-pointer
              file:bg-[#C9A66B] file:text-[#1C1C1C]
              hover:file:bg-[#C9A66B]/80 transition-all"
          />
          {uploading && (
            <p className="text-xs text-[#C9A66B] mt-2 animate-pulse">Uploading your picture…</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#C9A66B] text-[#1C1C1C] font-semibold rounded-xl hover:bg-[#C9A66B]/90 transition-all"
          >
            <CheckCircle className="h-4 w-4" /> Back to Home
          </Link>
          <Link
            href="/user/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 text-slate-100 font-semibold rounded-xl border border-slate-700 hover:border-[#C9A66B]/40 hover:bg-white/10 transition-all"
          >
            Dashboard
          </Link>
        </div>

      </div>
    </div>
  )
}
