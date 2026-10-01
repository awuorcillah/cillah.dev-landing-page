'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
  CheckCircle,
  UserCheck,
  Sparkles,
  Save,
  Phone,
  MapPin,
  User,
} from 'lucide-react'

const PHONE_PREFIXES = [
  { code: '+254', label: '🇰🇪 +254' },
  { code: '+1',   label: '🇺🇸 +1' },
  { code: '+44',  label: '🇬🇧 +44' },
  { code: '+27',  label: '🇿🇦 +27' },
  { code: '+233', label: '🇬🇭 +233' },
  { code: '+234', label: '🇳🇬 +234' },
  { code: '+255', label: '🇹🇿 +255' },
  { code: '+256', label: '🇺🇬 +256' },
  { code: '+49',  label: '🇩🇪 +49' },
  { code: '+33',  label: '🇫🇷 +33' },
]

export default function UserProfile() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [userEmail, setUserEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone_prefix: '+254',
    phone_number: '',
    address_line1: '',
    address_line2: '',
    city: '',
    county: '',
    post_code: '',
    country: 'Kenya',
    company_name: '',
  })

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
        setForm({
          first_name:    data.first_name    || '',
          last_name:     data.last_name     || '',
          phone_prefix:  data.phone_prefix  || '+254',
          phone_number:  data.phone_number  || '',
          address_line1: data.address_line1 || '',
          address_line2: data.address_line2 || '',
          city:          data.city          || '',
          county:        data.county        || '',
          post_code:     data.post_code     || '',
          country:       data.country       || 'Kenya',
          company_name:  data.company_name  || '',
        })
      } catch (e: any) {
        toast.error(e.message ?? 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const full_name = `${form.first_name} ${form.last_name}`.trim()
      const { error } = await supabase
        .from('profiles')
        .update({ ...form, full_name })
        .eq('id', user.id)
      if (error) throw error
      setProfile((prev: any) => ({ ...prev, ...form, full_name }))
      toast.success('Profile updated successfully!')
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

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

  const inputCls = 'w-full px-3 py-2.5 rounded-lg bg-slate-800/60 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]/60 focus:ring-1 focus:ring-[#C9A66B]/30 transition-all text-sm'
  const labelCls = 'text-xs text-slate-400 uppercase tracking-wider font-medium'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-100">
        <div className="flex items-center gap-2 text-cyan-400">
          <Sparkles className="w-5 h-5 animate-spin" /> Loading profile…
        </div>
      </div>
    )
  }

  const displayName = profile?.full_name || `${form.first_name} ${form.last_name}`.trim() || 'Unnamed User'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex items-center gap-3">
          <UserCheck className="h-6 w-6 text-[#C9A66B]" />
          <h1 className="text-2xl font-bold text-slate-100">Your Profile</h1>
          <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full capitalize">
            {profile?.role ?? 'user'}
          </span>
        </div>

        {/* Avatar Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative shrink-0">
            <img
              src={profile?.avatar_url || '/placeholder-avatar.png'}
              alt="Profile Avatar"
              className="h-24 w-24 rounded-full border-2 border-[#C9A66B]/40 object-cover shadow-lg"
            />
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-[#C9A66B] animate-spin" />
              </div>
            )}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-xl font-semibold text-slate-100">{displayName}</p>
            <p className="text-sm text-slate-400 mt-1">{userEmail}</p>
            {form.company_name && <p className="text-sm text-slate-400">{form.company_name}</p>}
          </div>
          <div className="shrink-0">
            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-[#C9A66B]/10 border border-[#C9A66B]/30 text-[#C9A66B] text-sm font-medium rounded-lg hover:bg-[#C9A66B]/20 transition-all">
                {uploading ? 'Uploading…' : 'Change Photo'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl divide-y divide-slate-800">

          {/* Personal Info Section */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-[#C9A66B]" />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Personal Information</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>First Name</label>
                <input id="first_name" type="text" placeholder="Cheryl" value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Last Name</label>
                <input id="last_name" type="text" placeholder="Cilla" value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Company / Organisation</label>
                <input id="company_name" type="text" placeholder="Acme Real Estate" value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Email (read-only)</label>
                <input type="email" disabled value={userEmail}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-800/30 border border-slate-700/50 text-slate-500 text-sm cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Phone Section */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Phone className="h-4 w-4 text-[#C9A66B]" />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Phone Number</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Country Code</label>
                <select value={form.phone_prefix}
                  onChange={(e) => setForm({ ...form, phone_prefix: e.target.value })}
                  className={inputCls}>
                  {PHONE_PREFIXES.map((p) => (
                    <option key={p.code} value={p.code} className="bg-slate-900">{p.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <label className={labelCls}>Phone Number</label>
                <input id="phone_number" type="tel" placeholder="712 345 678" value={form.phone_number}
                  onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                  className={inputCls} />
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="h-4 w-4 text-[#C9A66B]" />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Address</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Address Line 1</label>
                <input id="address_line1" type="text" placeholder="123 Westlands Road" value={form.address_line1}
                  onChange={(e) => setForm({ ...form, address_line1: e.target.value })}
                  className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Address Line 2 (Optional)</label>
                <input id="address_line2" type="text" placeholder="Suite 4B, ABC Plaza" value={form.address_line2}
                  onChange={(e) => setForm({ ...form, address_line2: e.target.value })}
                  className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>City</label>
                <input id="city" type="text" placeholder="Nairobi" value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>County / State</label>
                <input id="county" type="text" placeholder="Nairobi County" value={form.county}
                  onChange={(e) => setForm({ ...form, county: e.target.value })}
                  className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className={labelCls}>Post Code</label>
                <input id="post_code" type="text" placeholder="00100" value={form.post_code}
                  onChange={(e) => setForm({ ...form, post_code: e.target.value })}
                  className={inputCls} />
              </div>
              <div className="space-y-1.5">
                <label className={labelCls}>Country</label>
                <input id="country" type="text" placeholder="Kenya" value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  className={inputCls} />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="p-6 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#C9A66B] text-[#1C1C1C] font-semibold rounded-xl hover:bg-[#C9A66B]/90 transition-all disabled:opacity-60"
            >
              {saving ? <Sparkles className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <Link
              href="/user/dashboard"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 text-slate-100 font-semibold rounded-xl border border-slate-700 hover:border-[#C9A66B]/40 hover:bg-white/10 transition-all"
            >
              Dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white/5 text-slate-100 font-semibold rounded-xl border border-slate-700 hover:border-[#C9A66B]/40 hover:bg-white/10 transition-all"
            >
              <CheckCircle className="h-4 w-4" /> Back to Home
            </Link>
          </div>

        </form>
      </div>
    </div>
  )
}
