'use client'

import { DollarSign, CreditCard, Award, TrendingUp, Sparkles } from 'lucide-react'

export default function FinanceDepartmentPage() {
  return (
    <div className="w-full min-h-screen bg-[#0E131F] text-slate-100 p-4 md:p-8 font-sans">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-emerald-400" /> Finance Department & Retainers
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Client retainer billings, closed revenue, and payment reconciliations.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/90 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400">KES 0</div>
            <div className="text-xs text-slate-400 font-medium">Monthly Retainer Revenue</div>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">M-Pesa & Card</div>
            <div className="text-xs text-slate-400 font-medium">Active Payment Gateways</div>
          </div>
        </div>
      </div>
    </div>
  )
}
