'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { toast } from 'sonner'
import {
  Link2,
  Unlink,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  Globe,
  ShieldCheck,
  RefreshCw,
  MessageCircle,
  Loader2,
  Lock,
} from 'lucide-react'
import type { RoleTierPermissions } from '@/lib/marketing-config'

export interface SanitizedSocialConnection {
  id: string
  organization_slug: string
  provider: 'meta' | 'linkedin' | 'youtube' | 'tiktok' | 'whatsapp'
  channel: 'instagram' | 'facebook' | 'linkedin' | 'youtube' | 'tiktok' | 'whatsapp_status'
  account_id: string
  account_name: string
  account_handle?: string | null
  account_avatar_url?: string | null
  token_expires_at?: string | null
  scopes?: string[]
  connected_by: string
  status: string
  last_error?: string | null
  updated_at?: string
}

export interface ProviderReadinessMap {
  meta?: { configured: boolean; callbackUrl: string; requiredEnv: string[]; portalUrl: string }
  linkedin?: { configured: boolean; callbackUrl: string; requiredEnv: string[]; portalUrl: string }
  youtube?: { configured: boolean; callbackUrl: string; requiredEnv: string[]; portalUrl: string }
  tiktok?: { configured: boolean; callbackUrl: string; requiredEnv: string[]; portalUrl: string }
}

interface MarketingConnectionsViewProps {
  organizationSlug: string
  organizationName: string
  permissions: RoleTierPermissions
  connections: SanitizedSocialConnection[]
  providerConfig: ProviderReadinessMap
  schemaPending: boolean
  loading: boolean
  isSuperAdminView?: boolean
  onRefresh: () => void
}

const OAUTH_PROVIDERS = [
  {
    id: 'meta' as const,
    name: 'Meta (Instagram & Facebook)',
    channels: ['instagram', 'facebook'],
    accent: '#E1306C',
    badgeClass: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    description:
      'One login connects both your Facebook Pages and linked Instagram Business/Creator accounts for feed, photo, and Reels publishing.',
    scopesSummary:
      'pages_show_list, pages_manage_posts, pages_read_engagement, instagram_basic, instagram_content_publish, instagram_manage_insights',
    portalLabel: 'Meta for Developers',
  },
  {
    id: 'linkedin' as const,
    name: 'LinkedIn',
    channels: ['linkedin'],
    accent: '#0A66C2',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    description:
      'Connect LinkedIn via OAuth to publish B2B updates, insights, and article links directly from your Marketing Hub.',
    scopesSummary: 'openid, profile, email, w_member_social',
    portalLabel: 'LinkedIn Developer Portal',
  },
  {
    id: 'youtube' as const,
    name: 'YouTube (Videos & Shorts)',
    channels: ['youtube'],
    accent: '#FF0000',
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
    description:
      'Upload Videos & YouTube Shorts directly from your device with automatic OAuth refresh tokens via Google Cloud.',
    scopesSummary: 'youtube.upload, youtube.readonly, yt-analytics.readonly',
    portalLabel: 'Google Cloud Console',
  },
  {
    id: 'tiktok' as const,
    name: 'TikTok (Content Posting API)',
    channels: ['tiktok'],
    accent: '#25F4EE',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    description:
      'Connect TikTok via PKCE OAuth v2 to send vertical videos straight to TikTok Inbox/Drafts or Direct Post.',
    scopesSummary: 'user.info.basic, video.upload, video.publish',
    portalLabel: 'TikTok for Developers',
  },
]

export default function MarketingConnectionsView({
  organizationSlug,
  organizationName,
  permissions,
  connections,
  providerConfig,
  schemaPending,
  loading,
  isSuperAdminView = false,
  onRefresh,
}: MarketingConnectionsViewProps) {
  const pathname = usePathname()
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null)

  // WhatsApp Status Quick Config
  const [waModalOpen, setWaModalOpen] = useState(false)
  const [waName, setWaName] = useState(`${organizationName} WhatsApp`)
  const [waPhone, setWaPhone] = useState('+254759442265')
  const [waGatewayUrl, setWaGatewayUrl] = useState('')
  const [waGatewayToken, setWaGatewayToken] = useState('')
  const [savingWa, setSavingWa] = useState(false)

  const copyCallback = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    toast.success('Redirect Callback URL copied!')
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const handleConnectProvider = (providerId: 'meta' | 'linkedin' | 'youtube' | 'tiktok') => {
    if (!permissions.canPublishDirectly) {
      toast.error('Only Marketing Admins or Publishers can connect social accounts.')
      return
    }
    const cfg = providerConfig[providerId]
    if (!cfg?.configured) {
      if (isSuperAdminView) {
        setExpandedGuide(providerId)
        toast.info(
          `Add ${cfg?.requiredEnv.join(' & ')} in Vercel Environment Variables first, then redeploy.`
        )
      } else {
        toast.info('This channel integration is being activated by your platform administrator.')
      }
      return
    }
    const connectUrl = `/api/marketing/oauth/${providerId}/connect?org=${encodeURIComponent(
      organizationSlug
    )}&returnTo=${encodeURIComponent(pathname || '/user/dashboard')}`
    window.location.href = connectUrl
  }

  const handleDisconnect = async (conn: SanitizedSocialConnection) => {
    if (!confirm(`Disconnect ${conn.account_name} (${conn.channel})?`)) return
    setDisconnectingId(conn.id)
    try {
      const res = await fetch(
        `/api/marketing/connections?id=${encodeURIComponent(conn.id)}&org=${encodeURIComponent(
          organizationSlug
        )}`,
        { method: 'DELETE' }
      )
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Could not disconnect account.')
        return
      }
      toast.success(`Disconnected ${conn.account_name}`)
      onRefresh()
    } catch {
      toast.error('Network error disconnecting account.')
    } finally {
      setDisconnectingId(null)
    }
  }

  const handleSaveWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingWa(true)
    try {
      const res = await fetch('/api/marketing/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_slug: organizationSlug,
          account_name: waName,
          phone_number: waPhone,
          gateway_url: waGatewayUrl.trim(),
          gateway_token: waGatewayToken.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Could not save WhatsApp Status config.')
        return
      }
      toast.success('WhatsApp Status channel connected!')
      setWaModalOpen(false)
      onRefresh()
    } catch {
      toast.error('Failed to connect WhatsApp Status.')
    } finally {
      setSavingWa(false)
    }
  }

  const waConnections = connections.filter((c) => c.channel === 'whatsapp_status')

  return (
    <div className="space-y-5">
      {schemaPending && isSuperAdminView && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold text-amber-200">
              Database Setup Pending
            </p>
            <p className="text-slate-300">
              Run <code className="px-1.5 py-0.5 rounded bg-slate-950 text-[#E5C992]">supabase/marketing_social_connections.sql</code> in Supabase SQL Editor.
            </p>
          </div>
        </div>
      )}

      {!permissions.canPublishDirectly && (
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4 flex items-center gap-3 text-xs text-purple-200">
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            Read-only ({permissions.label}). Only Marketing Admins or Publishers can connect or disconnect accounts.
          </span>
        </div>
      )}

      {/* 4 NATIVE OAUTH PROVIDER CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {OAUTH_PROVIDERS.map((provider) => {
          const cfg = providerConfig[provider.id]
          const providerConns = connections.filter((c) => c.provider === provider.id)
          const isConfigured = Boolean(cfg?.configured)
          const isExpanded = expandedGuide === provider.id

          return (
            <div
              key={provider.id}
              className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 flex flex-col justify-between gap-4 shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: provider.accent }}
                    />
                    <h4 className="text-base font-bold text-white">{provider.name}</h4>
                  </div>

                  {providerConns.length > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> {providerConns.length} Connected
                    </span>
                  ) : isConfigured ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30 shrink-0">
                      Ready
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                      {isSuperAdminView ? 'Setup Required' : 'Coming Soon'}
                    </span>
                  )}
                </div>

                {/* Connected Accounts List for this provider */}
                {providerConns.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {providerConns.map((conn) => (
                      <div
                        key={conn.id}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {conn.account_avatar_url ? (
                            <img
                              src={conn.account_avatar_url}
                              alt={conn.account_name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0 uppercase">
                              {conn.account_name[0]}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {conn.account_name}
                              <span className="ml-1.5 text-[10px] font-semibold uppercase text-[#C9A66B]">
                                ({conn.channel})
                              </span>
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">
                              {conn.account_handle || conn.account_id}
                            </p>
                          </div>
                        </div>

                        {permissions.canPublishDirectly && (
                          <button
                            type="button"
                            disabled={disconnectingId === conn.id}
                            onClick={() => handleDisconnect(conn)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 cursor-pointer shrink-0"
                          >
                            {disconnectingId === conn.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Unlink className="w-3 h-3" />
                            )}
                            <span>Disconnect</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Developer Setup Drawer — visible ONLY in Super Admin view */}
                {isSuperAdminView && (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setExpandedGuide(isExpanded ? null : provider.id)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-[#E5C992] transition-colors cursor-pointer"
                    >
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`}
                      />
                      <span>Platform Setup &amp; Redirect URL</span>
                    </button>

                    {isExpanded && cfg && (
                      <div className="mt-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 text-[11px]">
                        <div>
                          <p className="text-slate-400 font-semibold mb-1">
                            Redirect URI ({provider.portalLabel}):
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-cyan-300 truncate">
                              {cfg.callbackUrl}
                            </code>
                            <button
                              type="button"
                              onClick={() => copyCallback(cfg.callbackUrl)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white inline-flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              {copiedUrl === cfg.callbackUrl ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                              <span>Copy</span>
                            </button>
                          </div>
                        </div>

                        <div>
                          <p className="text-slate-400 font-semibold">Vercel Env Keys:</p>
                          <p className="text-[#E5C992] font-mono mt-0.5">
                            {cfg.requiredEnv.join('  •  ')}
                          </p>
                        </div>

                        <a
                          href={cfg.portalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-cyan-400 hover:underline font-semibold pt-1"
                        >
                          Open {provider.portalLabel} <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  disabled={!permissions.canPublishDirectly || (!isConfigured && !isSuperAdminView)}
                  onClick={() => handleConnectProvider(provider.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isConfigured
                      ? 'bg-[#C9A66B] hover:bg-[#d8b87d] text-slate-950 shadow-md shadow-[#C9A66B]/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>
                    {providerConns.length > 0
                      ? 'Add / Reconnect'
                      : isConfigured
                      ? `Connect ${provider.name.split(' ')[0]}`
                      : isSuperAdminView
                      ? 'Configure Keys'
                      : 'Coming Soon'}
                  </span>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* WHATSAPP STATUS CHANNEL CARD */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex flex-wrap items-center gap-2.5">
          <MessageCircle className="w-4 h-4 text-emerald-400" />
          <h4 className="text-base font-bold text-white">WhatsApp Status</h4>
          {waConnections.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" /> {waConnections[0].account_handle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            disabled={!permissions.canPublishDirectly}
            onClick={() => setWaModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>{waConnections.length > 0 ? 'Update' : 'Connect WhatsApp'}</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Status Config Modal */}
      {waModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Configure WhatsApp Status</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Leave Gateway fields blank to use instant mobile share mode, or add a Whapi/Evolution endpoint for auto-posting.
              </p>
            </div>
            <form onSubmit={handleSaveWhatsApp} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Account Label *</label>
                <input
                  type="text"
                  required
                  value={waName}
                  onChange={(e) => setWaName(e.target.value)}
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">WhatsApp Number *</label>
                <input
                  type="text"
                  required
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  placeholder="+2547..."
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Auto-Status Gateway URL (Optional — Whapi.cloud / Evolution API)
                </label>
                <input
                  type="url"
                  value={waGatewayUrl}
                  onChange={(e) => setWaGatewayUrl(e.target.value)}
                  placeholder="https://gate.whapi.cloud/messages/story"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Gateway Bearer Token (Optional, AES-256 encrypted)
                </label>
                <input
                  type="password"
                  value={waGatewayToken}
                  onChange={(e) => setWaGatewayToken(e.target.value)}
                  placeholder="Optional API token"
                  className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setWaModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingWa}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold cursor-pointer"
                >
                  {savingWa ? 'Saving...' : 'Save WhatsApp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
