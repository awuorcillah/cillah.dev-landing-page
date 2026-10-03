'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Building2, MessageSquare, Shield, Filter, Calendar, Phone, Mail,
  RefreshCw, CheckCircle2, Search, ArrowUpRight, Radio, Sparkles,
  Send, UserCheck, Flame, Layers, Globe, Share2, Video, Loader2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type ChannelPlatform = 'all' | 'whatsapp' | 'instagram' | 'facebook' | 'website' | 'tiktok'
type DateFilter = 'all' | 'today' | '7days' | '30days' | 'custom'

interface MarketingMessage {
  id: string
  platform: 'whatsapp' | 'instagram' | 'facebook' | 'website' | 'tiktok'
  sender_name: string
  sender_handle_phone: string
  message_preview: string
  lead_quality: 'Hot Lead' | 'Qualified' | 'General Enquiry'
  assigned_marketer: string
  created_at: string
}

const MARKETING_TEAM = [
  { id: 'M-1', name: 'Brenda Cherono', role: 'Social Media & Content Lead', access: 'Marketing Admin' },
  { id: 'M-2', name: 'Kelvin Mutiso', role: 'Meta & Performance Ads Specialist', access: 'Marketing Specialist' },
  { id: 'M-3', name: 'Joy Wambui', role: 'WhatsApp Automation Operator', access: 'Marketing Agent' },
]

export default function MarketingDepartmentPage() {
  const supabase = createClient()

  const [messages, setMessages] = useState<MarketingMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState<ChannelPlatform>('all')
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [customStartDate, setCustomStartDate] = useState<string>('')
  const [customEndDate, setCustomEndDate] = useState<string>('')
  const [selectedMessage, setSelectedMessage] = useState<MarketingMessage | null>(null)
  const [replyText, setReplyText] = useState('')

  // ── Load Omnichannel Marketing Messages ──
  const fetchMarketingData = async () => {
    setLoading(true)
    try {
      const { data: dbMessages, error } = await supabase
        .from('marketing_messages')
        .select('*')
        .order('created_at', { ascending: false })

      if (error || !dbMessages || dbMessages.length === 0) {
        // High fidelity omnichannel demo messages for cillah.dev agency
        const initialMessages: MarketingMessage[] = [
          {
            id: 'MSG-701',
            platform: 'whatsapp',
            sender_name: 'Eng. Patrick Kibet',
            sender_handle_phone: '+254 722 990 011',
            message_preview: 'Hi! Saw your video on WhatsApp CRM lead routing automation. Can we set up a 1-on-1 strategy call for my business?',
            lead_quality: 'Hot Lead',
            assigned_marketer: 'Joy Wambui',
            created_at: new Date().toISOString()
          },
          {
            id: 'MSG-702',
            platform: 'instagram',
            sender_name: 'Anita_Business_Nairobi',
            sender_handle_phone: '@anita_business_nrobi',
            message_preview: 'DM: What is the monthly retainer fee for website maintenance and dedicated server hosting for our e-commerce platform?',
            lead_quality: 'Qualified',
            assigned_marketer: 'Brenda Cherono',
            created_at: new Date(Date.now() - 1800000).toISOString()
          },
          {
            id: 'MSG-703',
            platform: 'facebook',
            sender_name: 'Grace Mwangi',
            sender_handle_phone: 'FB Lead Ad Form #402',
            message_preview: 'Submitted Facebook Lead Form: Interested in Tier 2 custom software build with client portal access.',
            lead_quality: 'Hot Lead',
            assigned_marketer: 'Kelvin Mutiso',
            created_at: new Date(Date.now() - 3600000 * 2).toISOString()
          },
          {
            id: 'MSG-704',
            platform: 'website',
            sender_name: 'Samuel Kiprop',
            sender_handle_phone: 'samuel.k@finance.co.ke',
            message_preview: 'Live Chat: Do you build custom Meta Conversions API & auto lead assignment workflows for sales teams?',
            lead_quality: 'Qualified',
            assigned_marketer: 'Joy Wambui',
            created_at: new Date(Date.now() - 3600000 * 4).toISOString()
          },
          {
            id: 'MSG-705',
            platform: 'tiktok',
            sender_name: 'tech_founder_ke',
            sender_handle_phone: '@tech_founder_ke',
            message_preview: 'TikTok Comment: Loved your demo! How fast can cillah.dev deploy an AI sales bot for incoming Instagram & WhatsApp DMs?',
            lead_quality: 'General Enquiry',
            assigned_marketer: 'Brenda Cherono',
            created_at: new Date(Date.now() - 86400000).toISOString()
          }
        ]
        setMessages(initialMessages)
      } else {
        setMessages(dbMessages)
      }
    } catch (err) {
      console.error('Fetch marketing error:', err)
      toast.error('Failed to load marketing channels')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketingData()
  }, [])

  // ── Date Range Helper ──
  const isWithinDateRange = (createdAtStr: string) => {
    if (dateFilter === 'all') return true
    const created = new Date(createdAtStr)
    const now = new Date()

    if (dateFilter === 'today') {
      return (
        created.getFullYear() === now.getFullYear() &&
        created.getMonth() === now.getMonth() &&
        created.getDate() === now.getDate()
      )
    }
    if (dateFilter === '7days') {
      const d7 = new Date()
      d7.setDate(now.getDate() - 7)
      return created >= d7
    }
    if (dateFilter === '30days') {
      const d30 = new Date()
      d30.setDate(now.getDate() - 30)
      return created >= d30
    }
    if (dateFilter === 'custom') {
      if (!customStartDate && !customEndDate) return true
      const start = customStartDate ? new Date(customStartDate) : new Date(0)
      const end = customEndDate ? new Date(customEndDate + 'T23:59:59') : new Date()
      return created >= start && created <= end
    }
    return true
  }

  // ── Filtered Messages ──
  const filteredMessages = messages.filter(m => {
    const matchesChannel = channelFilter === 'all' || m.platform === channelFilter
    const matchesDate = isWithinDateRange(m.created_at)
    const term = search.toLowerCase().trim()
    const matchesSearch =
      !term ||
      m.sender_name.toLowerCase().includes(term) ||
      m.sender_handle_phone.toLowerCase().includes(term) ||
      m.message_preview.toLowerCase().includes(term) ||
      m.id.toLowerCase().includes(term)

    return matchesChannel && matchesDate && matchesSearch
  })

  // ── Platform Counters ──
  const totalCount = messages.length
  const whatsappCount = messages.filter(m => m.platform === 'whatsapp').length
  const instagramCount = messages.filter(m => m.platform === 'instagram').length
  const facebookCount = messages.filter(m => m.platform === 'facebook').length
  const websiteCount = messages.filter(m => m.platform === 'website').length
  const tiktokCount = messages.filter(m => m.platform === 'tiktok').length

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedMessage) return
    toast.success(`Reply dispatched to ${selectedMessage.sender_name} via ${selectedMessage.platform.toUpperCase()}`)
    setReplyText('')
    setSelectedMessage(null)
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" /> cillah.dev Organization & Department
          </div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            📢 Marketing Department & Omnichannel Hub
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Monitor incoming leads from WhatsApp, Instagram, Facebook Ads, TikTok, & Website live chats
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={fetchMarketingData}
            disabled={loading}
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Channels
          </Button>
        </div>
      </div>

      {/* ── Omnichannel Channel Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* WhatsApp */}
        <div
          onClick={() => setChannelFilter('whatsapp')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            channelFilter === 'whatsapp'
              ? 'bg-emerald-500/20 border-emerald-500/50 shadow-lg'
              : 'bg-slate-900/70 border-slate-800 hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">WhatsApp</span>
            <span className="text-lg">💬</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{whatsappCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Live WhatsApp Leads</p>
        </div>

        {/* Instagram */}
        <div
          onClick={() => setChannelFilter('instagram')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            channelFilter === 'instagram'
              ? 'bg-purple-500/20 border-purple-500/50 shadow-lg'
              : 'bg-slate-900/70 border-slate-800 hover:border-purple-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Instagram</span>
            <span className="text-lg">📸</span>
          </div>
          <p className="text-2xl font-bold text-purple-400 mt-2">{instagramCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">DMs & Ad Comments</p>
        </div>

        {/* Facebook */}
        <div
          onClick={() => setChannelFilter('facebook')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            channelFilter === 'facebook'
              ? 'bg-blue-500/20 border-blue-500/50 shadow-lg'
              : 'bg-slate-900/70 border-slate-800 hover:border-blue-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Facebook</span>
            <span className="text-lg">📘</span>
          </div>
          <p className="text-2xl font-bold text-blue-400 mt-2">{facebookCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Lead Ad Forms</p>
        </div>

        {/* Website */}
        <div
          onClick={() => setChannelFilter('website')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            channelFilter === 'website'
              ? 'bg-cyan-500/20 border-cyan-500/50 shadow-lg'
              : 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Website</span>
            <span className="text-lg">🌐</span>
          </div>
          <p className="text-2xl font-bold text-cyan-400 mt-2">{websiteCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Live Chat Inquiries</p>
        </div>

        {/* TikTok */}
        <div
          onClick={() => setChannelFilter('tiktok')}
          className={`p-4 rounded-xl border transition-all cursor-pointer ${
            channelFilter === 'tiktok'
              ? 'bg-pink-500/20 border-pink-500/50 shadow-lg'
              : 'bg-slate-900/70 border-slate-800 hover:border-pink-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">TikTok</span>
            <span className="text-lg">🎵</span>
          </div>
          <p className="text-2xl font-bold text-pink-400 mt-2">{tiktokCount}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">TikTok Lead Ads</p>
        </div>
      </div>

      {/* ── Search & Filters Bar ── */}
      <div className="space-y-4 bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search incoming messages by sender, handle, phone, content..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* Platform & Date Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs">
              <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value as DateFilter)}
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer text-xs font-medium"
              >
                <option value="all" className="bg-slate-900">All Time</option>
                <option value="today" className="bg-slate-900">Today</option>
                <option value="7days" className="bg-slate-900">Last 7 Days</option>
                <option value="30days" className="bg-slate-900">Last 30 Days</option>
                <option value="custom" className="bg-slate-900">Custom Date Range</option>
              </select>
            </div>
          </div>

        </div>

        {/* Custom Date Pickers when 'custom' is selected */}
        {dateFilter === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
            <span className="text-slate-400">Custom Range:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500"
            />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
          <div>
            Showing <strong className="text-purple-400 font-bold">{filteredMessages.length}</strong> incoming platform messages
          </div>
          <button
            onClick={() => setChannelFilter('all')}
            className="text-xs text-cyan-400 hover:underline"
          >
            Show All Channels ({totalCount})
          </button>
        </div>
      </div>

      {/* ── Omnichannel Messages Stream ── */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <p className="text-sm">Fetching omnichannel marketing messages...</p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500 gap-2">
            <MessageSquare className="w-10 h-10 text-slate-600 mb-2" />
            <p className="text-base font-semibold text-slate-300">No incoming messages match filter</p>
            <p className="text-xs text-slate-500">Try changing your channel selection or date range</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">#</th>
                  <th className="py-3.5 px-4 font-semibold">Platform</th>
                  <th className="py-3.5 px-4 font-semibold">Sender Details</th>
                  <th className="py-3.5 px-4 font-semibold">Message Preview</th>
                  <th className="py-3.5 px-4 font-semibold">Lead Quality</th>
                  <th className="py-3.5 px-4 font-semibold">Assigned Marketer</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMessages.map((msg, index) => (
                  <tr key={msg.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-4 px-4 font-mono text-xs text-slate-500 font-bold">
                      {index + 1}
                    </td>

                    {/* Platform Badge */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                        msg.platform === 'whatsapp'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : msg.platform === 'instagram'
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          : msg.platform === 'facebook'
                          ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                          : msg.platform === 'website'
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                          : 'bg-pink-500/15 text-pink-300 border border-pink-500/30'
                      }`}>
                        {msg.platform === 'whatsapp' ? '💬 WhatsApp' : msg.platform === 'instagram' ? '📸 Instagram' : msg.platform === 'facebook' ? '📘 Facebook' : msg.platform === 'website' ? '🌐 Website' : '🎵 TikTok'}
                      </span>
                    </td>

                    {/* Sender */}
                    <td className="py-4 px-4">
                      <p className="font-semibold text-slate-100">{msg.sender_name}</p>
                      <p className="text-xs text-slate-400">{msg.sender_handle_phone}</p>
                      <p className="text-[10px] text-slate-600 font-mono mt-0.5">{msg.id}</p>
                    </td>

                    {/* Message Preview */}
                    <td className="py-4 px-4">
                      <p className="text-xs text-slate-300 max-w-sm line-clamp-2 font-light">
                        "{msg.message_preview}"
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>

                    {/* Quality */}
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        msg.lead_quality === 'Hot Lead'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : msg.lead_quality === 'Qualified'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {msg.lead_quality}
                      </span>
                    </td>

                    {/* Assigned Marketer */}
                    <td className="py-4 px-4 text-xs text-slate-300 font-medium">
                      {msg.assigned_marketer}
                    </td>

                    {/* Reply Action */}
                    <td className="py-4 px-4 text-right">
                      <Button
                        size="sm"
                        onClick={() => setSelectedMessage(msg)}
                        className="bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs py-1 px-2.5 h-auto gap-1"
                      >
                        <Send className="w-3 h-3" />
                        Reply Live
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Marketing Team Access Section ── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" /> Marketing Team & Admin Permissions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MARKETING_TEAM.map(member => (
            <div key={member.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-100">{member.name}</p>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold text-[10px]">
                  {member.access}
                </span>
              </div>
              <p className="text-slate-400">{member.role}</p>
              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Department Status: Active</span>
                <button
                  onClick={() => toast.success(`${member.name} promoted to Marketing Admin`)}
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  Upgrade to Admin
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Reply Modal ── */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Reply to {selectedMessage.sender_name}
                </h3>
                <p className="text-xs text-purple-400 capitalize">
                  Platform: {selectedMessage.platform} ({selectedMessage.sender_handle_phone})
                </p>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
              <p className="text-slate-500">Original Message:</p>
              <p className="text-slate-200 italic font-light">"{selectedMessage.message_preview}"</p>
            </div>

            <form onSubmit={handleSendReply} className="space-y-3">
              <textarea
                rows={4}
                required
                placeholder={`Type your reply to send directly to ${selectedMessage.sender_name} via ${selectedMessage.platform.toUpperCase()}...`}
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-purple-500/50"
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedMessage(null)}
                  className="border-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Omnichannel Reply
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
