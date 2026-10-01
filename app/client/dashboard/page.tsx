'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { 
  User, 
  LogOut, 
  Calendar, 
  Video, 
  Clock, 
  Sparkles, 
  Building, 
  Phone, 
  PlusCircle, 
  FileDownload, 
  XCircle, 
  RefreshCw, 
  CheckCircle2, 
  VideoIcon, 
  Download,
  AlertTriangle,
  MapPin
} from 'lucide-react'

export default function ClientDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [bookedSession, setBookedSession] = useState<any>({
    slug: 'BK-102938',
    title: '1-on-1 Strategy & Architecture Call',
    scheduled_at: 'Thursday, Oct 8, 2026 at 2:00 PM EAT',
    location: 'Google Meet (Link activated 10 min prior)',
    video_url: 'https://meet.google.com/abc-defg-hij',
    status: 'confirmed',
    payment_status: 'paid',
  })

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          window.location.href = '/login'
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

        if (data?.role === 'admin') {
          window.location.href = '/admin/dashboard'
          return
        }
      } catch (err: any) {
        toast.error('Failed to load user profile', { position: 'top-left' })
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router, supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out successfully', { position: 'top-left' })
    window.location.href = '/login'
  }

  const handleCancelSession = () => {
    if (!cancelReason.trim()) {
      toast.error('Please enter a cancellation reason', { position: 'top-left' })
      return
    }

    setBookedSession({ ...bookedSession, status: 'cancelled' })
    setCancelModalOpen(false)
    toast.success('Session cancellation submitted', { position: 'top-left' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-2 text-purple-400">
          <Sparkles className="w-5 h-5 animate-spin" /> Loading client portal...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Client Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold text-xl shadow-inner">
              {profile?.full_name?.charAt(0) || userEmail?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-3">
            <p className="text-xl font-extrabold text-slate-100">
              {profile?.full_name || [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'VIP Client'}
            </p>
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider">
                  Client Portal
                </Badge>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              asChild
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold"
            >
              <Link href="/book-consultation">
                <PlusCircle className="w-4 h-4 mr-2" /> Book New Session
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" /> Log Out
            </Button>
          </div>
        </div>

        {/* Profile Info Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <User className="w-5 h-5 text-purple-400" /> Your Profile Summary
            </h2>
            <Button asChild size="sm" variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
              <Link href="/user/profile">Edit Profile</Link>
            </Button>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">First Name</p>
              <p className="text-slate-200 font-medium">{profile?.first_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Last Name</p>
              <p className="text-slate-200 font-medium">{profile?.last_name || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Phone</p>
              <p className="text-slate-200 font-medium">
                {profile?.phone_prefix || profile?.phone_number
                  ? `${profile?.phone_prefix || ''} ${profile?.phone_number || ''}`.trim()
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Address Line 1</p>
              <p className="text-slate-200 font-medium">{profile?.address_line1 || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Address Line 2</p>
              <p className="text-slate-200 font-medium">{profile?.address_line2 || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">City</p>
              <p className="text-slate-200 font-medium">{profile?.city || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">County / State</p>
              <p className="text-slate-200 font-medium">{profile?.county || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Post Code</p>
              <p className="text-slate-200 font-medium">{profile?.post_code || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Country</p>
              <p className="text-slate-200 font-medium">{profile?.country || '—'}</p>
            </div>
          </div>
        </div>

        {/* SECTION 1: Upcoming Booked Session */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
            <Calendar className="w-6 h-6 text-purple-400" /> Upcoming Booked Session
          </h2>

          <Card className="bg-slate-900/90 border-slate-800 text-slate-100 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/40 font-mono text-xs">
                    Ref: {bookedSession.slug}
                  </Badge>
                  <Badge className={bookedSession.status === 'confirmed' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : "bg-red-500/20 text-red-400 border-red-500/40"}>
                    {bookedSession.status.toUpperCase()}
                  </Badge>
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    PAYMENT: {bookedSession.payment_status.toUpperCase()}
                  </Badge>
                </div>
                <CardTitle className="text-xl font-extrabold text-slate-100">
                  {bookedSession.title}
                </CardTitle>
                <CardDescription className="text-slate-400 text-sm mt-1">
                  Scheduled with Cheryl Cilla Atulah
                </CardDescription>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.info("Reschedule request initiated. Select a new slot on calendar.", { position: 'top-left' })}
                  className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <RefreshCw className="w-4 h-4 mr-2 text-purple-400" /> Reschedule Session
                </Button>

                <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Cancel Session
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
                    <DialogHeader>
                      <DialogTitle className="text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> Cancel Booked Session
                      </DialogTitle>
                      <DialogDescription className="text-slate-400">
                        Please provide a reason for cancelling your session ({bookedSession.slug}).
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Textarea
                        placeholder="e.g. Schedule conflict, need to postpone..."
                        className="bg-slate-950 border-slate-800 text-slate-100 focus:border-red-500"
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="ghost" onClick={() => setCancelModalOpen(false)}>
                        Keep Session
                      </Button>
                      <Button variant="destructive" onClick={handleCancelSession}>
                        Confirm Cancellation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent className="grid sm:grid-cols-2 gap-4 text-sm text-slate-300 pt-2 border-t border-slate-800/80">
              <div className="space-y-1">
                <span className="text-xs text-slate-400">Scheduled Date & Time:</span>
                <p className="font-semibold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" /> {bookedSession.scheduled_at}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-slate-400">Video Conference Location:</span>
                <a
                  href={bookedSession.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-purple-400 hover:underline flex items-center gap-2"
                >
                  <VideoIcon className="w-4 h-4 text-purple-400" /> Open Meeting Video Room
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SECTION 2: Client Shared Deliverables & Assets */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
            <Download className="w-6 h-6 text-cyan-400" /> Shared Deliverables & Strategy Documents
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-100">
                  AI Automation Audit Report (PDF)
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Full workflow analysis detailing WhatsApp CRM sync & lead scoring roadmap.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.success("Downloading AI Audit Report PDF...", { position: 'top-left' })}
                  className="w-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <Download className="w-4 h-4 mr-2 text-cyan-400" /> Download PDF Report
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold text-slate-100">
                  Technical Architecture Blueprint
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Mermaid diagram & Supabase PostgreSQL database schema specification.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toast.success("Downloading Technical Blueprint...", { position: 'top-left' })}
                  className="w-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                >
                  <Download className="w-4 h-4 mr-2 text-purple-400" /> Download Blueprint Assets
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

      </div>
    </div>
  )
}
