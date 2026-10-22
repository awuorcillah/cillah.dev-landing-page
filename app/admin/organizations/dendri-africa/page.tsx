'use client'

import { useState } from 'react'
import {
  Globe2,
  TrendingUp,
  Truck,
  Package,
  Users,
  Calendar,
  Building,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  DollarSign
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface DendriLead {
  id: string
  client_name: string
  company: string
  location: string
  commodity: string
  volume: string
  estimated_value: string
  stage: 'Inquiry' | 'Sample Testing' | 'Contract Sent' | 'Fulfilled'
  assigned_lead: string
}

const SAMPLE_DENDRI_LEADS: DendriLead[] = [
  { id: '1', client_name: 'Tariq Al-Mansoor', company: 'Gulf Agro Commodities FZE', location: 'Dubai, UAE', commodity: 'Grade A Hass Avocados', volume: '40ft Reconditioned Container (24 Tons)', estimated_value: '$48,000 USD', stage: 'Contract Sent', assigned_lead: 'Cillah Awuor' },
  { id: '2', client_name: 'Jean-Luc Dubois', company: 'Marseille Food Importers', location: 'Marseille, France', commodity: 'Organic Premium French Beans', volume: '12 Tons Air Freight', estimated_value: '$31,500 USD', stage: 'Sample Testing', assigned_lead: 'Operations Desk' },
  { id: '3', client_name: 'Kwame Asante', company: 'Accra Retail Logistics', location: 'Accra, Ghana', commodity: 'Macadamia Raw Kernels', volume: '18 Tons Sea Freight', estimated_value: '$54,000 USD', stage: 'Inquiry', assigned_lead: 'Commercial Team' },
  { id: '4', client_name: 'Sarah Van Der Merwe', company: 'Cape Fresh Distribution', location: 'Cape Town, SA', commodity: 'Specialty Tea & Arabica Coffee', volume: '8 Tons Consolidated', estimated_value: '$22,000 USD', stage: 'Fulfilled', assigned_lead: 'Logistics Desk' }
]

export default function DendriAfricaDashboard() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-950/60 pb-6 bg-gradient-to-r from-purple-950/30 via-slate-900 to-slate-950 p-6 rounded-2xl border border-purple-500/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Globe2 className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Agri-Tech & Enterprise Supply Chain
              </span>
              <span className="text-xs text-slate-400">Dendri Africa Operations</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              Cross-Border Trade & Logistics Pipeline
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Wholesale Commodities • Export Contracts • Regional Freight Tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-purple-500/40 text-purple-400 bg-purple-950/40 py-1 px-3">
            <Truck className="w-3.5 h-3.5 mr-1.5" /> 3 Containers in Transit
          </Badge>
          <Button className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> New Export Contract
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Pipeline Value</span>
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">$155,500</div>
            <p className="text-[11px] text-emerald-400 mt-1">
              4 active wholesale deals
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Commodities Volume</span>
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                <Package className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">62 Tons</div>
            <p className="text-[11px] text-purple-400 mt-1">
              Avocados, French Beans, Macadamia
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Buyers</span>
              <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                <Building className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">18 Importers</div>
            <p className="text-[11px] text-sky-400 mt-1">
              UAE, France, South Africa, UK
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-800">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fulfillment Rate</span>
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">98.4%</div>
            <p className="text-[11px] text-amber-400 mt-1">
              On-time cold chain delivery
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Commercial Deals & Contracts Pipeline */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardHeader className="border-b border-slate-800 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" /> Commercial Wholesale Deals & Contracts
            </CardTitle>
            <span className="text-xs text-slate-400">Updated Real-Time</span>
          </div>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="p-3">Buyer & Company</th>
                <th className="p-3">Destination</th>
                <th className="p-3">Commodity & Volume</th>
                <th className="p-3">Est. Value</th>
                <th className="p-3">Contract Stage</th>
                <th className="p-3">Assigned Lead</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {SAMPLE_DENDRI_LEADS.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3">
                    <p className="font-semibold text-white">{lead.client_name}</p>
                    <p className="text-[11px] text-slate-400">{lead.company}</p>
                  </td>
                  <td className="p-3 text-slate-300">{lead.location}</td>
                  <td className="p-3">
                    <p className="font-medium text-purple-300">{lead.commodity}</p>
                    <p className="text-[10px] text-slate-500">{lead.volume}</p>
                  </td>
                  <td className="p-3 font-mono font-bold text-emerald-400">{lead.estimated_value}</td>
                  <td className="p-3">
                    <Badge
                      className={
                        lead.stage === 'Contract Sent'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]'
                          : lead.stage === 'Sample Testing'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 text-[10px]'
                          : lead.stage === 'Fulfilled'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]'
                          : 'bg-sky-500/20 text-sky-300 border-sky-500/40 text-[10px]'
                      }
                      variant="outline"
                    >
                      {lead.stage}
                    </Badge>
                  </td>
                  <td className="p-3 text-slate-400">{lead.assigned_lead}</td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" className="h-7 text-xs text-purple-400 hover:text-white hover:bg-purple-950/60">
                      View Contract <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
