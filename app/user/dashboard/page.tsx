'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import CRMPipelineBoard from '@/components/crm/crm-pipeline-board'
import {
  parseAssignedWorkspaces,
  type UserWorkspaceRole,
} from '@/lib/auth-roles'
import {
  Sparkles,
  TrendingUp,
  Megaphone,
  LogOut,
  User,
  BarChart3,
  Share2,
  CalendarClock,
} from 'lucide-react'

export default function UserDashboardPage() {
  const supabase = createClient()
  const [currentUserEmail, setCurrentUserEmail] = useState<string>('')
  const [displayName, setDisplayName] = useState<string>('')
  const [assignedWorkspaces, setAssignedWorkspaces] = useState<UserWorkspaceRole[]>(['sales'])
  const [activeWorkspace, setActiveWorkspace] = useState<UserWorkspaceRole>('sales')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUserWorkspace() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      const email = (user.email || '').toLowerCase().trim()
      setCurrentUserEmail(email)

      const [{ data: profile }, { data: staff }] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', user.id)
          .maybeSingle(),
        supabase
          .from('staff_members')
          .select('full_name, role, status')
          .ilike('email', email)
          .maybeSingle(),
      ])

      const name =
        staff?.full_name ||
        profile?.full_name ||
        user.user_metadata?.full_name ||
        email.split('@')[0]
      setDisplayName(name)

      const workspaces = parseAssignedWorkspaces(staff?.role)
      setAssignedWorkspaces(workspaces)
      setActiveWorkspace(workspaces[0] || 'sales')
      setLoading(false)
    }

    loadUserWorkspace()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E131F] text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#C9A66B] font-medium">
          <Sparkles className="w-6 h-6 animate-spin" /> Loading Your Workspace...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0E131F] text-slate-100 flex flex-col">
      {/* Dedicated User Workspace Top Bar (Role Switcher based on assigned roles) */}
      <header className="sticky top-0 z-40 border-b border-slate-800/90 bg-slate-950/90 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand + User Info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-full overflow-hidden border border-[#C9A66B]/40 shrink-0">
              <img
                src="/images/cillah-emblem.png"
                alt="Cillah Logo"
                className="object-cover h-full w-full"
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-white leading-tight truncate">
                {displayName || 'Workspace'}
              </p>
              <p className="text-[11px] text-slate-400 leading-tight truncate">
                {currentUserEmail}
              </p>
            </div>
          </div>

          {/* Assigned Role Workspace Toggle (Sales / Marketing) */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
            {assignedWorkspaces.includes('sales') && (
              <button
                type="button"
                onClick={() => setActiveWorkspace('sales')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeWorkspace === 'sales'
                    ? 'bg-[#C9A66B] text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Sales</span>
              </button>
            )}

            {assignedWorkspaces.includes('marketing') && (
              <button
                type="button"
                onClick={() => setActiveWorkspace('marketing')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeWorkspace === 'marketing'
                    ? 'bg-[#C9A66B] text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                <span>Marketing</span>
              </button>
            )}
          </div>

          {/* Profile & Logout */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/user/profile"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              <User className="w-3.5 h-3.5 text-[#C9A66B]" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-300 hover:bg-red-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Active Role Workspace Body */}
      <main className="flex-1">
        {activeWorkspace === 'sales' && (
          <CRMPipelineBoard
            currentUserEmail={currentUserEmail}
            isStaffAdmin={false}
            forceUserOnly={true}
          />
        )}

        {activeWorkspace === 'marketing' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2.5">
                  <Megaphone className="w-6 h-6 text-[#C9A66B]" />
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Marketing Workspace
                  </h1>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  Assigned to <span className="text-slate-200 font-medium">{currentUserEmail}</span>
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 text-xs font-semibold uppercase tracking-wider self-start sm:self-auto">
                Marketing Role Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-white">Campaign Performance</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Track WhatsApp, Instagram, TikTok, and Facebook ad attribution and incoming lead conversion rates.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 flex items-center justify-center">
                  <Share2 className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-white">Content &amp; Social Channels</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Manage social media campaigns, UTM tracking links, and lead magnets connected to your CRM.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <h2 className="text-base font-bold text-white">Automated Follow-Ups</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Configure broadcast campaigns, newsletter sequences, and nurture flows for warm leads.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/60 border border-[#C9A66B]/25 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#C9A66B]">
                  Marketing tools are ready to be connected
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Switch back to Sales anytime using the role toggle at the top to manage your pipeline leads.
                </p>
              </div>
              {assignedWorkspaces.includes('sales') && (
                <button
                  type="button"
                  onClick={() => setActiveWorkspace('sales')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A66B] text-slate-950 font-bold text-xs hover:bg-[#d6b67d] transition-colors shrink-0 cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Open Sales Pipeline</span>
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
