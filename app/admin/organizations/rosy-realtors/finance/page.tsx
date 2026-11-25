'use client'

import Link from 'next/link'
import { DollarSign, Building2, UserPlus, Wallet, Receipt, FileSpreadsheet } from 'lucide-react'

export default function RosyRealtorsFinancePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold text-[#C9A66B] uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5" />
            Rosy Realtors Nairobi • Finance Department
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            Finance & Commission Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Booking deposits, agent commissions, and M-Pesa / bank reconciliation for Rosy Realtors Nairobi.
          </p>
        </div>

        <Link
          href="/admin/organizations/rosy-realtors/finance/users"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5 text-[#C9A66B]" />
          Manage Finance Users
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white">Property Booking Deposits</h2>
          <p className="text-xs text-slate-400">
            Track reservation deposits and installment milestones across Kilimani, Lavington, and Runda units.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-[#C9A66B]/15 border border-[#C9A66B]/30 text-[#C9A66B] flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white">Agent Commission Payouts</h2>
          <p className="text-xs text-slate-400">
            Automatic 3% commission calculation tied directly to Won Deals closed in the Sales Pipeline.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-white">M-Pesa & Bank Reconciliation</h2>
          <p className="text-xs text-slate-400">
            Clean monthly cashflow statements ready for management review.
          </p>
        </div>
      </div>
    </div>
  )
}
