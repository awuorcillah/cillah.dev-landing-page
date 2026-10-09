'use client'

import { useState } from 'react'
import { Building2, Calendar, Clock, User, Phone, CheckCircle2 } from 'lucide-react'
import { Card } from '@/components/ui/card'

export default function StagePropertiesAppointmentsPage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">
          <Building2 className="w-4 h-4" /> Stage Properties Brokers L.L.C
        </div>
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
          📅 Upcoming Property Viewings & Appointments
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Scheduled property tours, site visits, and consultation calls for Stage Properties clients
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-900/70 border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 font-mono">APP-STAGE-001</span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              UPCOMING VIEWING
            </span>
          </div>
          <h3 className="text-base font-bold text-slate-100">Sobha Hartland Villa Tour</h3>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-purple-400" /> Today at 4:30 PM (GST)
          </p>
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-300 space-y-1">
            <p><strong>Client:</strong> Ghassan Saliba</p>
            <p><strong>Assigned Advisor:</strong> Ador (0794357912)</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
