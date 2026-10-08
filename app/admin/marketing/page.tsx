'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Megaphone, Link as LinkIcon, BarChart3, TrendingUp, Sparkles, ExternalLink } from 'lucide-react'

export default function MarketingDepartmentPage() {
  const supabase = createClient()
  const [clicks, setClicks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMarketingData() {
      setLoading(true)
      const { data } = await supabase
        .from('campaign_clicks')
        .select('*')
        .order('clicked_at', { ascending: false })

      if (data) setClicks(data)
      setLoading(false)
    }

    fetchMarketingData()
  }, [])

  return (
    <div className="w-full min-h-screen bg-[#0E131F] text-slate-100 p-4 md:p-8 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Megaphone className="w-7 h-7 text-purple-400" /> Marketing Department & Campaign Traffic
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Omnichannel marketing traffic, YouTube link click attributions, and campaign performance.
          </p>
        </div>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
            <LinkIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">{clicks.length}</div>
            <div className="text-xs text-slate-400 font-medium">Total Tracked Campaign Clicks</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-sky-400">YouTube & Social</div>
            <div className="text-xs text-slate-400 font-medium">Primary Attribution Channels</div>
          </div>
        </div>
      </div>

      {/* CLICK ATTRIBUTION TABLE */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 font-bold text-sm text-slate-200">
          Recent Campaign Link Clicks
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <th className="p-4">Source</th>
              <th className="p-4">Campaign Name</th>
              <th className="p-4">Destination URL</th>
              <th className="p-4">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {clicks.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-slate-500 italic">
                  No campaign clicks recorded yet. Tracked links will log here automatically.
                </td>
              </tr>
            ) : (
              clicks.map((click) => (
                <tr key={click.id} className="hover:bg-slate-800/40">
                  <td className="p-4 font-bold text-purple-400">{click.source}</td>
                  <td className="p-4 text-slate-200">{click.campaign_name || 'General Promo'}</td>
                  <td className="p-4 text-slate-400 truncate max-w-xs">{click.destination_url}</td>
                  <td className="p-4 text-slate-400">{new Date(click.clicked_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
