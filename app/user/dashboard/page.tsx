'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  ArrowRight, 
  CheckCircle2, 
  Users, 
  Zap,
  BookmarkPlus
} from 'lucide-react'

export default function UserDashboard() {
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<any>(null)
  const [userEmail, setUserEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)

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
        } else if (data?.role === 'client') {
          window.location.href = '/client/dashboard'
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

  const upcomingEvents = [
    {
      id: 1,
      title: "Automating Real Estate Lead Conversions with AI",
      category: "Live Workshop",
      date: "Thursday, Oct 8, 2026",
      time: "2:00 PM - 3:30 PM EAT",
      speaker: "Cheryl Cilla Atulah",
      description: "Learn how top agencies capture, qualify, and route leads automatically from WhatsApp, Instagram, and web forms.",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    },
    {
      id: 2,
      title: "WhatsApp CRM Sync & M-Pesa Integration Masterclass",
      category: "Masterclass",
      date: "Tuesday, Oct 15, 2026",
      time: "4:00 PM - 5:30 PM EAT",
      speaker: "Cheryl Cilla Atulah",
      description: "Step-by-step walkthrough of automated M-Pesa STK push prompts for property booking deposits.",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    },
    {
      id: 3,
      title: "Ask Cheryl Anything: AI Agency OS & Operations",
      category: "Live Q&A Session",
      date: "Thursday, Oct 22, 2026",
      time: "5:00 PM - 6:00 PM EAT",
      speaker: "Cheryl Cilla Atulah",
      description: "Open floor Q&A session discussing custom AI workflow blueprints and system scaling for Kenya real estate.",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-2 text-cyan-400">
          <Sparkles className="w-5 h-5 animate-spin" /> Loading user portal...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* User Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur-xl shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-xl shadow-inner">
              {profile?.full_name?.charAt(0) || userEmail?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-extrabold text-slate-100">{profile?.full_name || 'Valued User'}</h1>
                <Badge className="bg-slate-800 text-slate-300 border-slate-700 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider">
                  User Portal
                </Badge>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{userEmail}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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

        {/* SECTION 1: Help Me Book a Session */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
              <Zap className="w-6 h-6 text-cyan-400" /> Book a Consultation Session
            </h2>
            <p className="text-sm text-slate-400">
              Schedule a 1-on-1 strategy call with Cheryl Cilla Atulah to analyze your agency operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Audit Session Card */}
            <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-xl hover:border-cyan-500/40 transition-all">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    100% FREE ($0)
                  </Badge>
                  <Clock className="w-5 h-5 text-slate-500" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-100 mt-2">
                  Free Automation Audit (30 Min)
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Discovery call to identify manual operational bottlenecks in your current lead & sales workflows.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Full CRM & Lead Audit
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" /> Custom Automation Roadmap
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  asChild
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  <Link href="/book-consultation">
                    Book Free Audit Now <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* Paid Strategy Session Card */}
            <Card className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-xl hover:border-purple-500/40 transition-all">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                    PAID SESSION (KES 5,000)
                  </Badge>
                  <Clock className="w-5 h-5 text-slate-500" />
                </div>
                <CardTitle className="text-lg font-bold text-slate-100 mt-2">
                  1-on-1 Strategy & Architecture Call (60 Min)
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs">
                  Deep-dive architecture session designing custom AI agents, WhatsApp CRM sync, and M-Pesa automation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" /> Technical Architecture Blueprint
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" /> M-Pesa STK Push Setup Guide
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  asChild
                  variant="outline"
                  className="w-full border-purple-500/40 text-purple-300 hover:bg-purple-500/10 hover:text-white font-bold"
                >
                  <Link href="/book-consultation">
                    Book 1-on-1 Strategy Call <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* SECTION 2: Upcoming Events, Live Masterclasses & Webinars */}
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-2">
              <Video className="w-6 h-6 text-purple-400" /> Live Webinars & Upcoming Events
            </h2>
            <p className="text-sm text-slate-400">
              Join exclusive live training sessions, automation masterclasses, and Q&A webinars with Cheryl.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {upcomingEvents.map((evt) => (
              <Card key={evt.id} className="bg-slate-900/80 border-slate-800 text-slate-100 shadow-xl flex flex-col justify-between">
                <CardHeader>
                  <div className="flex justify-between items-center mb-2">
                    <Badge className={evt.badgeColor}>{evt.category}</Badge>
                  </div>
                  <CardTitle className="text-base font-bold leading-snug text-slate-100">
                    {evt.title}
                  </CardTitle>
                  <CardDescription className="text-slate-400 text-xs mt-2 line-clamp-3">
                    {evt.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Calendar className="w-4 h-4 text-cyan-400" /> {evt.date}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock className="w-4 h-4 text-purple-400" /> {evt.time}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Users className="w-4 h-4 text-emerald-400" /> Speaker: {evt.speaker}
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success(`RSVP confirmed for "${evt.title}"! Reminder set.`, { position: 'top-left' })}
                    className="w-full border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <BookmarkPlus className="w-4 h-4 mr-2 text-cyan-400" /> RSVP for Event
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
