'use client'

import { Building2, Megaphone, Instagram, MessageSquare, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function StagePropertiesMarketingPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
          <Building2 className="w-4 h-4" /> Stage Properties Brokers L.L.C
        </div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          📣 Marketing Campaigns & Instagram Auto-DM Trigger
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Active lead acquisition campaigns for Stage Properties Instagram & social channels
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-900/70 border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-pink-400 flex items-center gap-1.5">
              <Instagram className="w-4 h-4" /> Instagram Comment Campaign
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              ACTIVE
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-100">Sobha Hartland Auto-DM Campaign</h3>
          <p className="text-xs text-slate-400">
            Keyword Trigger: <strong>"HARTLAND"</strong>
          </p>
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 space-y-1">
            <p><strong>AI Flow:</strong> Instant DM with prices & availability ➔ Buy/Rent qualification ➔ Ador allocation via WhatsApp</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
