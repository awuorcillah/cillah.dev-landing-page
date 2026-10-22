'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Stethoscope,
  Globe2,
  Cpu,
  ArrowUpRight,
  Shield,
  Users,
  FolderTree,
  CheckCircle2,
  Plus,
  ExternalLink,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Organization {
  id: string
  name: string
  slug: string
  industry: string
  description: string
  location: string
  icon: any
  color: string
  borderColor: string
  bgGradient: string
  departments: string[]
  primaryHref: string
  staffCount: number
  primaryPipeline: string
}

const ORGANIZATIONS: Organization[] = [
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-111111111111',
    name: 'Stage Properties Brokers L.L.C',
    slug: 'stage-properties',
    industry: 'Luxury & Offplan Real Estate',
    description: 'Dubai real estate brokerage with automated Instagram AI lead qualification, offplan listings, and viewing bookings.',
    location: 'Business Bay, Dubai, UAE',
    icon: Building2,
    color: 'text-amber-400',
    borderColor: 'border-amber-500/30 hover:border-amber-500/60',
    bgGradient: 'from-amber-950/20 to-slate-900',
    departments: ['Sales & Offplan Pipeline', 'Marketing Campaign', 'Property Inventory'],
    primaryHref: '/admin/organizations/stage-properties/pipeline',
    staffCount: 5,
    primaryPipeline: 'Real Estate Sales CRM'
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-222222222222',
    name: 'cillah.dev',
    slug: 'cillah-dev',
    industry: 'AI Automation Agency & SaaS',
    description: 'Autonomous marketing, custom AI agents, lead nurturing pipelines, and enterprise automation infrastructure.',
    location: 'Nairobi, Kenya / Global',
    icon: Cpu,
    color: 'text-cyan-400',
    borderColor: 'border-cyan-500/30 hover:border-cyan-500/60',
    bgGradient: 'from-cyan-950/20 to-slate-900',
    departments: ['Sales Department', 'Marketing Department', 'Finance & Retainers'],
    primaryHref: '/admin/pipeline',
    staffCount: 4,
    primaryPipeline: 'Consultation & Deals Pipeline'
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-333333333333',
    name: 'Chetu Healthcare Clinic',
    slug: 'chetu-healthcare',
    industry: 'Healthcare & Clinical Services',
    description: 'Comprehensive outpatient care, WhatsApp symptom triage, doctor appointment scheduling, and patient directory.',
    location: 'Nairobi, Kenya',
    icon: Stethoscope,
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/30 hover:border-emerald-500/60',
    bgGradient: 'from-emerald-950/20 to-slate-900',
    departments: ['Patient Care & Triage', 'Clinical Appointments', 'Medical Administration'],
    primaryHref: '/admin/organizations/chetu-healthcare',
    staffCount: 8,
    primaryPipeline: 'Patient Triage & Bookings'
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-444444444444',
    name: 'Dendri Africa',
    slug: 'dendri-africa',
    industry: 'Agri-Tech & Enterprise Supply Chain',
    description: 'Cross-border agricultural supply chain, B2B wholesale distribution, and commercial partnership pipelines.',
    location: 'Nairobi, Kenya / East Africa',
    icon: Globe2,
    color: 'text-purple-400',
    borderColor: 'border-purple-500/30 hover:border-purple-500/60',
    bgGradient: 'from-purple-950/20 to-slate-900',
    departments: ['Operations & Logistics', 'Partnerships & Sales', 'Distribution Network'],
    primaryHref: '/admin/organizations/dendri-africa',
    staffCount: 6,
    primaryPipeline: 'B2B Partnerships Pipeline'
  }
]

export default function AdminOrganizationsHubPage() {
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#C9A66B]/15 text-[#C9A66B] border border-[#C9A66B]/30">
              Master Multi-Tenant Hub
            </span>
            <span className="text-xs text-slate-400">4 Active Organizations</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 mt-2">
            Organizations & Departments
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Each organization operates with complete autonomy and dedicated, isolated data. Launch any organization's meeting dashboard with a single click.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
            onClick={() => alert('New organization onboarding is available via Super Admin configuration.')}
          >
            <Plus className="w-4 h-4 mr-2 text-[#C9A66B]" />
            Add Organization
          </Button>
        </div>
      </div>

      {/* Global SaaS Governance Alert */}
      <div className="p-4 rounded-xl border border-sky-500/30 bg-sky-950/20 flex items-start gap-3">
        <Shield className="w-5 h-5 text-sky-400 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-slate-300">
          <p className="font-semibold text-sky-200">Zero Data Cross-Mix Guaranteed</p>
          <p className="text-slate-400 mt-0.5">
            Stage Properties real estate leads and Chetu Healthcare clinical records are completely separated. Staff assigned to one organization can never view records from any other organization.
          </p>
        </div>
      </div>

      {/* Organization Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ORGANIZATIONS.map((org) => {
          const IconComponent = org.icon
          return (
            <Card
              key={org.id}
              className={`bg-gradient-to-br ${org.bgGradient} border ${org.borderColor} transition-all duration-200 hover:shadow-xl hover:shadow-black/40 flex flex-col justify-between`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-slate-950/80 border border-slate-800 ${org.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-100">{org.name}</CardTitle>
                      <p className={`text-xs font-semibold ${org.color} mt-0.5`}>{org.industry}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 bg-emerald-950/30 text-[10px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-1">
                <p className="text-xs text-slate-300 leading-relaxed min-h-[36px]">
                  {org.description}
                </p>

                {/* Location & Pipeline */}
                <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800/60">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Location</span>
                    <p className="text-slate-200 font-medium truncate">{org.location}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Primary Pipeline</span>
                    <p className="text-slate-200 font-medium truncate">{org.primaryPipeline}</p>
                  </div>
                </div>

                {/* Departments */}
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 mb-2">
                    <span className="flex items-center gap-1.5">
                      <FolderTree className="w-3 h-3 text-[#C9A66B]" />
                      Departments ({org.departments.length})
                    </span>
                    <span className="text-slate-500">{org.staffCount} Staff Members</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {org.departments.map((dept, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-950/80 border border-slate-800 text-slate-300"
                      >
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-between gap-3">
                  <Link
                    href={org.primaryHref}
                    className="flex-1"
                  >
                    <Button
                      className="w-full bg-[#C9A66B] hover:bg-[#b08e56] text-slate-950 font-semibold text-xs shadow-md"
                    >
                      <span>Launch Dedicated Dashboard</span>
                      <ArrowUpRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </Link>

                  <Link href={`/admin/organizations/${org.slug}/teams`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-800 bg-slate-950/60 text-slate-300 hover:text-white text-xs px-3"
                    >
                      <Users className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
