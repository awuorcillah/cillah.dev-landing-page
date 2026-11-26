'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import SalesAiAssistantDrawer from '@/components/crm/sales-ai-assistant-drawer'
import LeadDocumentsAndBilling from '@/components/crm/lead-documents-and-billing'
import {
  Bot,
  BellRing,
  MessageCircle,
  Phone,
  Mail,
  Calendar,
  Clock,
  UserCheck,
  Search,
  Filter,
  LayoutGrid,
  List,
  Sparkles,
  Plus,
  ChevronDown,
  X,
  CheckCircle2,
  AlertCircle,
  Flame,
  Award,
  ShieldCheck,
  Building,
  Tag,
  Eye,
  Trash2,
  Edit2,
  RotateCcw,
  History
} from 'lucide-react'

export interface SalesLead {
  id: string
  full_name: string
  email: string | null
  phone_number: string | null
  company_name: string | null
  source: string
  stage: string
  assigned_agent_email: string | null
  assigned_agent_id: string | null
  is_qualified: boolean
  estimated_value: number
  last_interaction_at: string
  created_at: string
  updated_at: string
  followup_status: string | null
  next_followup_at: string | null
  followup_title: string | null
  initial_note?: string | null
  viewing_date?: string | null
}

export interface LeadNote {
  id: string
  lead_id: string
  author_email: string
  author_name: string | null
  source: string
  note_text: string
  created_at: string
}

export interface StaffMember {
  id: string
  email: string
  full_name: string
  role: string
  status: string
  org_id?: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  website?: string
}

const STAGES = [
  { id: 'due_followup', name: 'Due Follow-Ups', color: 'bg-rose-500/15 border-rose-500/50 text-rose-300', badge: 'bg-rose-500' },
  { id: 'new_lead', name: 'New Inquiry', color: 'bg-sky-500/10 border-sky-500/30 text-sky-400', badge: 'bg-sky-500' },
  { id: 'repeat_lead', name: 'Repeat Inquiries', color: 'bg-violet-500/10 border-violet-500/30 text-violet-400', badge: 'bg-violet-500' },
  { id: 'hot_lead', name: 'Hot Lead', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400', badge: 'bg-amber-500' },
  { id: 'warm_lead', name: 'Warm Lead', color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', badge: 'bg-yellow-500' },
  { id: 'viewing', name: 'Booked Consultations', color: 'bg-purple-500/10 border-purple-500/30 text-purple-400', badge: 'bg-purple-500' },
  { id: 'cold_lead', name: 'Cold Lead', color: 'bg-slate-500/10 border-slate-500/30 text-slate-400', badge: 'bg-slate-500' },
  { id: 'spam', name: 'Spam', color: 'bg-red-500/10 border-red-500/30 text-red-400', badge: 'bg-red-500' },
  { id: 'closed_won', name: 'Won Deals', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', badge: 'bg-emerald-500' },
  { id: 'ongoing_project', name: 'Ongoing Project', color: 'bg-cyan-500/15 border-cyan-500/45 text-cyan-300', badge: 'bg-cyan-500' },
  { id: 'done_delivered', name: 'Done & Delivered', color: 'bg-indigo-500/15 border-indigo-500/45 text-indigo-300', badge: 'bg-indigo-500' },
  { id: 'full_payment_made', name: 'Full Payment Made', color: 'bg-[#C9A66B]/20 border-[#C9A66B]/60 text-[#E5C687]', badge: 'bg-[#C9A66B]' }
]

const WON_STAGES = new Set(['closed_won', 'ongoing_project', 'done_delivered', 'full_payment_made'])

interface CRMPipelineBoardProps {
  currentUserEmail?: string
  isStaffAdmin?: boolean
  forceUserOnly?: boolean
  embedded?: boolean
  orgId?: string
  excludeEmails?: string[]
  currencyPrefix?: string
  externalAgentFilter?: string
  externalPlatformFilter?: string
  externalDateRange?: { start: string | null; end: string | null }
}

export default function CRMPipelineBoard({
  currentUserEmail = 'atulah@cillah.dev',
  isStaffAdmin = true,
  forceUserOnly = false,
  embedded = false,
  orgId,
  excludeEmails = [],
  currencyPrefix = '$',
  externalAgentFilter,
  externalPlatformFilter = 'all',
  externalDateRange
}: CRMPipelineBoardProps) {
  const supabase = createClient()
  const [leads, setLeads] = useState<SalesLead[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  const effectiveIsAdmin = isStaffAdmin && !forceUserOnly
  const normalizedExcludeEmails = useMemo(
    () => excludeEmails.map((e) => e.toLowerCase().trim()),
    [excludeEmails]
  )

  // Filters & State
  const [agentFilter, setAgentFilter] = useState<string>(effectiveIsAdmin ? 'all' : currentUserEmail)
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('all')

  // Sync agent filter whenever role/view mode or parent executive filter changes
  useEffect(() => {
    if (!effectiveIsAdmin) {
      setAgentFilter(currentUserEmail)
    } else if (externalAgentFilter !== undefined) {
      setAgentFilter(externalAgentFilter)
    } else {
      setAgentFilter('all')
    }
  }, [effectiveIsAdmin, currentUserEmail, externalAgentFilter])
  const [selectedStages, setSelectedStages] = useState<string[]>([])
  const [stageMenuOpen, setStageMenuOpen] = useState(false)
  const [viewMenuOpen, setViewMenuOpen] = useState(false)
  const [timeMenuOpen, setTimeMenuOpen] = useState(false)
  const stageMenuRef = useRef<HTMLDivElement>(null)
  const viewMenuRef = useRef<HTMLDivElement>(null)
  const timeMenuRef = useRef<HTMLDivElement>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')

  const toggleStageFilter = (stageId: string) => {
    setSelectedStages((prev) =>
      prev.includes(stageId) ? prev.filter((id) => id !== stageId) : [...prev, stageId]
    )
  }

  // Profile Menu Dropdown State
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false)
      }
      if (stageMenuRef.current && !stageMenuRef.current.contains(e.target as Node)) {
        setStageMenuOpen(false)
      }
      if (viewMenuRef.current && !viewMenuRef.current.contains(e.target as Node)) {
        setViewMenuOpen(false)
      }
      if (timeMenuRef.current && !timeMenuRef.current.contains(e.target as Node)) {
        setTimeMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Selected Lead Modal Drawer State
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null)
  const [notes, setNotes] = useState<LeadNote[]>([])
  const [newNoteText, setNewNoteText] = useState('')
  const [addingNote, setAddingNote] = useState(false)

  // Edit Lead Contact Info State
  const [isEditingContact, setIsEditingContact] = useState(false)
  const [editFullName, setEditFullName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editCompany, setEditCompany] = useState('')
  const [editEstimatedValue, setEditEstimatedValue] = useState('')
  const [editStage, setEditStage] = useState('')
  const [editAssignedAgentEmail, setEditAssignedAgentEmail] = useState('')
  const [savingContact, setSavingContact] = useState(false)

  // Recycle Bin (Trash) Modal State
  const [showBinModal, setShowBinModal] = useState(false)
  const [binSearchQuery, setBinSearchQuery] = useState('')

  // Personal AI Assistant Drawer State
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false)
  const [aiDrawerMode, setAiDrawerMode] = useState<'lead_draft' | 'pipeline_chat'>('lead_draft')
  const [aiTargetLead, setAiTargetLead] = useState<SalesLead | null>(null)

  // Individualized AI Follow-Up Scanner State
  const [followupScan, setFollowupScan] = useState<{
    overdue: any[]
    dueToday: any[]
    upcoming48h: any[]
    counts: { overdue: number; dueToday: number; upcoming48h: number; totalAttention: number }
  } | null>(null)
  const [scanExpanded, setScanExpanded] = useState(false)

  // Non-blocking activity timestamp logger for Admin Accountability Dashboard
  const logLeadActivity = (payload: {
    lead_id?: string | null
    lead_name?: string | null
    activity_type: string
    summary: string
    duration_seconds?: number | null
  }) => {
    const activeStaff = staffMembers.find(
      (s) => s.email?.toLowerCase() === currentUserEmail.toLowerCase()
    )
    fetch('/api/leads/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: payload.lead_id || null,
        org_id: orgId || activeStaff?.org_id || currentOrgId,
        agent_email: currentUserEmail,
        agent_name: activeStaff?.full_name || currentUserEmail.split('@')[0],
        lead_name: payload.lead_name || null,
        activity_type: payload.activity_type,
        summary: payload.summary,
        duration_seconds: payload.duration_seconds || null,
      }),
    }).catch(() => {})
  }

  const openLeadAiAssistant = (lead: SalesLead) => {
    setAiTargetLead(lead)
    setAiDrawerMode('lead_draft')
    setAiDrawerOpen(true)
  }

  const openPipelineAiAssistant = () => {
    setAiTargetLead(null)
    setAiDrawerMode('pipeline_chat')
    setAiDrawerOpen(true)
  }

  // Auto-scan individualized upcoming/overdue follow-ups
  useEffect(() => {
    if (!currentUserEmail) return
    let active = true
    const qs = new URLSearchParams()
    if (!effectiveIsAdmin) {
      qs.set('agentEmail', currentUserEmail)
    } else if (agentFilter !== 'all') {
      qs.set('agentEmail', agentFilter)
    } else if (orgId) {
      qs.set('orgId', orgId)
    }
    fetch(`/api/leads/followup-scan?${qs.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active && data?.success) {
          setFollowupScan(data)
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [currentUserEmail, effectiveIsAdmin, agentFilter, orgId, leads.length])

  // Lead Transfer State
  const [targetAgentEmail, setTargetAgentEmail] = useState('')
  const [transferringLead, setTransferringLead] = useState(false)

  // Viewing Date Scheduler State
  const [viewingDateInput, setViewingDateInput] = useState('')
  const [savingViewingDate, setSavingViewingDate] = useState(false)

  // Followup Form State inside Modal
  const [followupChoice, setFollowupChoice] = useState<'1_month' | '3_months' | '1_year' | 'forever' | 'custom'>('custom')
  const [customDate, setCustomDate] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [followupNote, setFollowupNote] = useState('')
  const [updatingFollowup, setUpdatingFollowup] = useState(false)
  const [actionSuccessMsg, setActionSuccessMsg] = useState('')

  // Add Lead Modal State
  const [showAddLeadModal, setShowAddLeadModal] = useState(false)
  const [addFullName, setAddFullName] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [addPhone, setAddPhone] = useState('')
  const [addCompany, setAddCompany] = useState('')
  const [addSource, setAddSource] = useState('email_campaign')
  const [addStage, setAddStage] = useState('new_lead')
  const [addAssignedAgentEmail, setAddAssignedAgentEmail] = useState(currentUserEmail)
  const [addEstimatedValue, setAddEstimatedValue] = useState('')
  const [addInitialNote, setAddInitialNote] = useState('')
  const [isSubmittingLead, setIsSubmittingLead] = useState(false)

  const isSuperAdmin = currentUserEmail.toLowerCase() === 'awuorcillah@gmail.com'

  // Organization Resolution: Strictly restrict actions to current organization
  const currentStaff = useMemo(() => {
    return staffMembers.find((s) => s.email?.toLowerCase() === currentUserEmail.toLowerCase())
  }, [staffMembers, currentUserEmail])

  const currentOrgId = useMemo(() => {
    if (orgId) return orgId
    if (currentStaff?.org_id) return currentStaff.org_id
    if (selectedLead?.assigned_agent_email) {
      const leadAgent = staffMembers.find(
        (s) => s.email?.toLowerCase() === selectedLead.assigned_agent_email?.toLowerCase()
      )
      if (leadAgent?.org_id) return leadAgent.org_id
    }
    return 'a1b2c3d4-e5f6-7890-abcd-222222222222' // cillah.dev default organization
  }, [orgId, currentStaff, selectedLead, staffMembers])

  const currentOrg = useMemo(() => {
    return (
      organizations.find((o) => o.id === currentOrgId) || {
        id: currentOrgId,
        name: 'Cillah',
        slug: 'cillah-dev'
      }
    )
  }, [organizations, currentOrgId])

  // Agents strictly within our organization
  const orgStaffMembers = useMemo(() => {
    return staffMembers.filter((s) => {
      const emailLower = (s.email || '').toLowerCase()
      if (normalizedExcludeEmails.includes(emailLower)) return false
      const inOrg = orgId ? s.org_id === orgId : !s.org_id || s.org_id === currentOrgId
      const r = (s.role || '').toLowerCase()
      const isSalesRole =
        r.includes('sales') || r.includes('ceo') || s.status === 'admin'
      return inOrg && isSalesRole
    })
  }, [staffMembers, currentOrgId, orgId, normalizedExcludeEmails])

  // Populate edit fields & viewing date on lead selection
  useEffect(() => {
    if (selectedLead) {
      setEditFullName(selectedLead.full_name || '')
      setEditEmail(selectedLead.email || '')
      setEditPhone(selectedLead.phone_number || '')
      setEditCompany(selectedLead.company_name || '')
      setEditEstimatedValue(selectedLead.estimated_value ? String(selectedLead.estimated_value) : '0')
      setEditStage(selectedLead.stage || 'new_lead')
      setEditAssignedAgentEmail(selectedLead.assigned_agent_email || currentUserEmail)
      setTargetAgentEmail(selectedLead.assigned_agent_email || '')
      setIsEditingContact(false)

      const chosenDate = selectedLead.next_followup_at || selectedLead.viewing_date
      setFollowupNote('')
      if (chosenDate) {
        const dt = new Date(chosenDate)
        const tzOffset = dt.getTimezoneOffset() * 60000
        const localISOTime = new Date(dt.getTime() - tzOffset).toISOString().slice(0, 16)
        setViewingDateInput(localISOTime)
        setCustomDate(localISOTime)
        setCustomTitle(selectedLead.followup_title || '')
        setFollowupChoice('custom')
      } else {
        setViewingDateInput('')
        setCustomDate('')
        setCustomTitle('')
        setFollowupChoice('custom')
      }
    }
  }, [selectedLead])

  const handleSaveViewingDate = async () => {
    if (!selectedLead || !viewingDateInput) {
      toast.error('Please pick a date and time first')
      return
    }
    setSavingViewingDate(true)
    setActionSuccessMsg('')

    const isoViewing = new Date(viewingDateInput).toISOString()
    const nowIso = new Date().toISOString()
    const updatedFields = {
      viewing_date: isoViewing,
      next_followup_at: isoViewing,
      followup_status: 'active',
      followup_title: selectedLead.followup_title || customTitle || 'Upcoming Follow-Up',
      last_interaction_at: nowIso,
      updated_at: nowIso
    }

    const { error } = await supabase
      .from('sales_leads')
      .update(updatedFields)
      .eq('id', selectedLead.id)

    if (!error) {
      const updatedLead = { ...selectedLead, ...updatedFields }
      setSelectedLead(updatedLead)
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updatedLead : l)))

      const noteText = `Updated upcoming follow-up to ${new Date(viewingDateInput).toLocaleString()}`
      const { data: insertedNote } = await supabase
        .from('lead_notes')
        .insert({
          lead_id: selectedLead.id,
          author_email: currentUserEmail,
          author_name: currentUserEmail.split('@')[0],
          source: 'followup_updated',
          note_text: noteText
        })
        .select('*')
        .single()

      if (insertedNote) {
        setNotes((prev) => [insertedNote, ...prev])
      }

      logLeadActivity({
        lead_id: selectedLead.id,
        lead_name: selectedLead.full_name,
        activity_type: 'followup_scheduled',
        summary: noteText,
      })

      toast.success(`Follow-up updated to ${new Date(viewingDateInput).toLocaleString()}`)
      setActionSuccessMsg(`Follow-up updated to ${new Date(viewingDateInput).toLocaleString()}`)
      setTimeout(() => setActionSuccessMsg(''), 4000)
    } else {
      toast.error('Failed to update follow-up date')
    }
    setSavingViewingDate(false)
  }

  // Uplifting Victory Sound Effect Helper
  const playVictorySound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      const ctx = new AudioCtx()
      const now = ctx.currentTime

      const notes = [523.25, 659.25, 783.99]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + idx * 0.12)
        gain.gain.setValueAtTime(0.3, now + idx * 0.12)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.4)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.12)
        osc.stop(now + idx * 0.12 + 0.4)
      })
    } catch (err) {
      console.error('Audio chime error:', err)
    }
  }

  // 1. Fetch Staff, Orgs & Leads IN PARALLEL + instant 0ms cache hydration for flash speed
  useEffect(() => {
    const cacheKey = `cillah_crm_leads_cache:${(currentUserEmail || '').toLowerCase()}`
    if (!effectiveIsAdmin && typeof window !== 'undefined') {
      try {
        const raw = sessionStorage.getItem(cacheKey)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed?.leads)) {
            setLeads(parsed.leads)
            setLoading(false)
          }
        }
      } catch {}
    }

    async function fetchData() {
      let query = supabase.from('sales_leads').select('*').order('created_at', { ascending: false })

      if (!effectiveIsAdmin) {
        query = query.eq('assigned_agent_email', currentUserEmail)
      } else if (agentFilter !== 'all') {
        query = query.eq('assigned_agent_email', agentFilter)
      }

      // Single parallel Promise.all — eliminates sequential waterfall!
      const [{ data: staffData }, { data: orgData }, { data: leadsData }] = await Promise.all([
        supabase.from('staff_members').select('*'),
        supabase.from('organizations').select('*'),
        query
      ])
      if (staffData) setStaffMembers(staffData)
      if (orgData) setOrganizations(orgData)

      const allowedOrgEmails = orgId
        ? new Set(
            (staffData || [])
              .filter((s: any) => s.org_id === orgId)
              .map((s: any) => (s.email || '').toLowerCase())
          )
        : null

      let combinedLeads: SalesLead[] = leadsData
        ? leadsData
            .filter((l: any) => {
              const assignedLower = (l.assigned_agent_email || '').toLowerCase()
              if (normalizedExcludeEmails.includes(assignedLower)) return false
              if (allowedOrgEmails && !allowedOrgEmails.has(assignedLower)) return false
              return true
            })
            .map((l: any) => {
              const cleanName = l.full_name && l.full_name !== 'Valued Lead' && l.full_name !== 'Valued Customer' ? l.full_name : 'Cheryl Atulah'
              const cleanPhone = l.phone_number && l.phone_number !== 'N/A' ? l.phone_number : '+254 794 357 912'

              // Auto-heal legacy test leads in DB
              if (l.full_name === 'Valued Lead' || l.phone_number === 'N/A') {
                supabase.from('sales_leads').update({ full_name: cleanName, phone_number: cleanPhone }).eq('id', l.id)
              }

              return {
                ...l,
                full_name: cleanName,
                phone_number: cleanPhone
              }
            })
        : []

      // Also Fetch Stage Properties organization leads assigned to this agent (skipped when scoped to another orgId)
      if (!orgId) {
        try {
          let stageQuery = supabase.from('stage_leads').select('*').order('created_at', { ascending: false })
          if (!effectiveIsAdmin) {
            const matchingStaff = staffData?.find((s: any) => s.email?.toLowerCase() === currentUserEmail.toLowerCase())
            const agentName = matchingStaff?.full_name || currentUserEmail.split('@')[0]
            stageQuery = stageQuery.or(`assigned_agent_email.eq.${currentUserEmail},assigned_agent_name.ilike.%${agentName}%`)
          } else if (agentFilter !== 'all') {
            const matchingStaff = staffData?.find((s: any) => s.email?.toLowerCase() === agentFilter.toLowerCase())
            const agentName = matchingStaff?.full_name || agentFilter.split('@')[0]
            stageQuery = stageQuery.or(`assigned_agent_email.eq.${agentFilter},assigned_agent_name.ilike.%${agentName}%`)
          }

          const { data: stageLeadsData } = await stageQuery
          if (stageLeadsData && stageLeadsData.length > 0) {
            stageLeadsData.forEach((sl: any) => {
              const exists = combinedLeads.some(
                (cl) => cl.id === sl.id || (sl.phone_number && cl.phone_number === sl.phone_number)
              )
              if (!exists) {
                const mappedStatus =
                  sl.status === 'new_inquiry' || sl.status === 'new_enquiry'
                    ? 'new_lead'
                    : sl.status === 'repeat_user' || sl.status === 'repeat_lead'
                    ? 'repeat_lead'
                    : sl.status || 'new_lead'

                const cleanName = sl.full_name && sl.full_name !== 'Valued Lead' && sl.full_name !== 'Valued Customer' ? sl.full_name : 'Cheryl Atulah'
                const cleanPhone = sl.phone_number && sl.phone_number !== 'N/A' ? sl.phone_number : '+254 794 357 912'

                combinedLeads.push({
                  id: sl.id,
                  full_name: cleanName,
                  email: sl.email || 'cheryl@cillah.dev',
                  phone_number: cleanPhone,
                  company_name: sl.property_interest || 'Sobha Hartland',
                  source: 'stage_properties_dm',
                  stage: mappedStatus,
                  assigned_agent_email: sl.assigned_agent_email || currentUserEmail,
                  assigned_agent_id: sl.assigned_agent_id || null,
                  is_qualified: true,
                  estimated_value: 1500000,
                  last_interaction_at: sl.created_at,
                  created_at: sl.created_at,
                  updated_at: sl.created_at,
                  followup_status: 'active',
                  next_followup_at: null,
                  followup_title: null,
                  initial_note: sl.chat_history || `Instagram DM Lead: ${cleanName} interested in ${sl.property_interest || 'Sobha Hartland'} (${sl.intent || 'BUY'}). Verified buyer assigned to ${sl.assigned_agent_name || 'Ador'}.`
                })
              }
            })
          }
        } catch (err) {
          console.error('Error fetching stage_leads for CRM:', err)
        }
      }

      setLeads(combinedLeads)
      setLoading(false)
      if (!effectiveIsAdmin && typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(
            cacheKey,
            JSON.stringify({ leads: combinedLeads, cachedAt: Date.now() })
          )
        } catch {}
      }
    }

    fetchData()

    // 2. Realtime Subscriptions
    const channel = supabase
      .channel(`public:sales_leads:${orgId || 'default'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const incoming = payload.new as SalesLead
          const assignedLower = (incoming.assigned_agent_email || '').toLowerCase()
          if (normalizedExcludeEmails.includes(assignedLower)) return
          if (!effectiveIsAdmin && assignedLower !== currentUserEmail.toLowerCase()) return
          setLeads((prev) => [incoming, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          const oldLead = payload.old as SalesLead
          const newLead = payload.new as SalesLead
          const assignedLower = (newLead.assigned_agent_email || '').toLowerCase()
          if (normalizedExcludeEmails.includes(assignedLower)) {
            setLeads((prev) => prev.filter((l) => l.id !== newLead.id))
            return
          }

          setLeads((prev) =>
            prev.map((l) => (l.id === payload.new.id ? (payload.new as SalesLead) : l))
          )
          setSelectedLead((prev) => (prev?.id === payload.new.id ? (payload.new as SalesLead) : prev))

          // 1. Victory Deal / Payment Made Alert
          if (
            !WON_STAGES.has(oldLead?.stage) &&
            WON_STAGES.has(newLead?.stage)
          ) {
            const agentName = newLead.assigned_agent_email?.split('@')[0] || 'Sales Agent'
            const valStr = newLead.estimated_value ? ` for ${currencyPrefix}${Number(newLead.estimated_value).toLocaleString()}` : ''
            const stageLabel = STAGES.find((s) => s.id === newLead.stage)?.name || 'Won Deals'
            toast.success(`🎉 PAYMENT / DEAL WON! ${newLead.full_name} moved to "${stageLabel}"${valStr} (${agentName})`, {
              duration: 7000
            })
            playVictorySound()
          }

          // 2. Consultation Booked Alert
          if ((!oldLead?.viewing_date && newLead?.viewing_date) || (oldLead?.stage !== 'viewing' && newLead?.stage === 'viewing')) {
            const agentName = newLead.assigned_agent_email?.split('@')[0] || 'Sales Agent'
            toast.info(`📅 CONSULTATION BOOKED! ${agentName} just scheduled a Booked Consultation with ${newLead.full_name}!`, {
              duration: 6000
            })
            playVictorySound()
          }
        } else if (payload.eventType === 'DELETE') {
          setLeads((prev) => prev.filter((l) => l.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [agentFilter, effectiveIsAdmin, currentUserEmail, forceUserOnly, orgId])

  // Fetch Notes when a lead is selected
  useEffect(() => {
    if (!selectedLead) return

    async function fetchNotes() {
      const { data } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', selectedLead!.id)
        .order('created_at', { ascending: false })

      const notesList = data || []
      
      // If lead has an initial_note from single HTTP ingestion, include it as an initial note entry
      if (selectedLead?.initial_note && !notesList.some(n => n.note_text === selectedLead.initial_note)) {
        notesList.push({
          id: 'initial-' + selectedLead.id,
          lead_id: selectedLead.id,
          author_email: selectedLead.assigned_agent_email || 'system@cillah.dev',
          author_name: 'Email Campaign Bot',
          source: 'email_reply',
          note_text: selectedLead.initial_note,
          created_at: selectedLead.created_at
        })
      }

      setNotes(notesList)
    }

    fetchNotes()
  }, [selectedLead])

  // Helper: Check whether an active lead belongs in the "Due Follow-Ups" column
  const isLeadDueFollowup = (lead: SalesLead) => {
    if (WON_STAGES.has(lead.stage) || lead.stage === 'spam' || lead.stage === 'trash') return false
    if (lead.stage === 'due_followup') return true
    const dt = lead.next_followup_at || lead.viewing_date
    if (!dt) return false
    return new Date(dt).getTime() <= Date.now()
  }

  const getEffectiveStage = (lead: SalesLead) =>
    isLeadDueFollowup(lead) ? 'due_followup' : lead.stage

  // Filtered Leads Calculation (Excludes Recycle Bin leads)
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Exclude leads moved to Recycle Bin (Trash)
      if (lead.stage === 'trash') {
        return false
      }

      // Agent Filter
      if (effectiveIsAdmin && agentFilter !== 'all' && lead.assigned_agent_email !== agentFilter) {
        return false
      }
      if (!effectiveIsAdmin && lead.assigned_agent_email !== currentUserEmail) {
        return false
      }

      // External Date Range Filter (from Executive Dashboard date dropdown)
      if (externalDateRange?.start || externalDateRange?.end) {
        const createdMs = new Date(lead.created_at).getTime()
        if (externalDateRange.start && createdMs < new Date(externalDateRange.start).getTime()) {
          return false
        }
        if (externalDateRange.end && createdMs > new Date(externalDateRange.end).getTime()) {
          return false
        }
      }

      // External Platform Filter (from Executive Dashboard platform cards)
      if (externalPlatformFilter && externalPlatformFilter !== 'all') {
        const s = (lead.source || '').toLowerCase()
        const bucket = s.includes('whatsapp')
          ? 'whatsapp'
          : s.includes('linkedin')
          ? 'linkedin'
          : s.includes('facebook') || s === 'fb'
          ? 'facebook'
          : s.includes('instagram') || s.includes('ig_')
          ? 'instagram'
          : s.includes('tender') || s.includes('rfp')
          ? 'tenders'
          : s.includes('event') || s.includes('forum')
          ? 'events'
          : s.includes('website') || s.includes('web_') || s.includes('landing')
          ? 'website'
          : s.includes('email') || s.includes('outlook') || s.includes('microsoft_365') || s.includes('gmail')
          ? 'email'
          : 'other'
        if (bucket !== externalPlatformFilter) return false
      }

      // Multi-Stage Filter
      if (selectedStages.length > 0 && !selectedStages.includes(getEffectiveStage(lead))) {
        return false
      }

      // Time Filter
      if (timeFilter !== 'all') {
        const createdAt = new Date(lead.created_at).getTime()
        const now = new Date().getTime()
        const diffHours = (now - createdAt) / (1000 * 60 * 60)

        if (timeFilter === '24h' && diffHours > 24) return false
        if (timeFilter === '7d' && diffHours > 24 * 7) return false
        if (timeFilter === '30d' && diffHours > 24 * 30) return false
      }

      // Search Query
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase()
        const matchName = lead.full_name?.toLowerCase().includes(q)
        const matchEmail = lead.email?.toLowerCase().includes(q)
        const matchPhone = lead.phone_number?.toLowerCase().includes(q)
        const matchCompany = lead.company_name?.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchPhone && !matchCompany) return false
      }

      return true
    })
  }, [leads, agentFilter, effectiveIsAdmin, selectedStages, timeFilter, searchQuery, currentUserEmail, externalPlatformFilter, externalDateRange])

  const visibleKanbanStages = useMemo(() => {
    return selectedStages.length > 0
      ? STAGES.filter((st) => selectedStages.includes(st.id))
      : STAGES
  }, [selectedStages])

  // Recycle Bin (Trash) Leads Calculation
  const trashLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (lead.stage !== 'trash') return false

      if (!effectiveIsAdmin && lead.assigned_agent_email !== currentUserEmail) {
        return false
      }
      if (effectiveIsAdmin && agentFilter !== 'all' && lead.assigned_agent_email !== agentFilter) {
        return false
      }

      if (binSearchQuery.trim() !== '') {
        const q = binSearchQuery.toLowerCase()
        const matchName = lead.full_name?.toLowerCase().includes(q)
        const matchEmail = lead.email?.toLowerCase().includes(q)
        const matchPhone = lead.phone_number?.toLowerCase().includes(q)
        const matchCompany = lead.company_name?.toLowerCase().includes(q)
        if (!matchName && !matchEmail && !matchPhone && !matchCompany) return false
      }

      return true
    })
  }, [leads, effectiveIsAdmin, agentFilter, currentUserEmail, binSearchQuery])

  // Metrics Counters (Active leads only)
  const metrics = useMemo(() => {
    const activeLeads = leads.filter((l) => l.stage !== 'trash')
    const now = new Date()
    const past24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const newToday = activeLeads.filter((l) => new Date(l.created_at) >= past24h).length
    const hotLeads = activeLeads.filter((l) => l.stage === 'hot_lead').length
    const upcomingAppointments = activeLeads.filter(
      (l) => l.next_followup_at && new Date(l.next_followup_at) > now
    ).length
    const wonDealsCount = activeLeads.filter((l) => WON_STAGES.has(l.stage)).length
    const wonDealsValue = activeLeads
      .filter((l) => WON_STAGES.has(l.stage))
      .reduce((sum, l) => sum + (Number(l.estimated_value) || 0), 0)

    return { newToday, hotLeads, upcomingAppointments, wonDealsCount, wonDealsValue }
  }, [leads])

  // Stage Move Handler
  const handleStageChange = async (leadId: string, newStage: string) => {
    await supabase
      .from('sales_leads')
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq('id', leadId)

    const mappedStageStatus =
      newStage === 'new_lead'
        ? 'new_enquiry'
        : newStage === 'repeat_lead'
        ? 'repeat_user'
        : newStage

    await supabase
      .from('stage_leads')
      .update({ status: mappedStageStatus, updated_at: new Date().toISOString() })
      .eq('id', leadId)

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)))
    if (selectedLead?.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, stage: newStage } : null))
    }

    const movedLead = leads.find((l) => l.id === leadId)
    const stageName = STAGES.find((s) => s.id === newStage)?.name || newStage
    logLeadActivity({
      lead_id: leadId,
      lead_name: movedLead?.full_name || null,
      activity_type: 'stage_changed',
      summary: `Moved "${movedLead?.full_name || 'lead'}" to ${stageName}`,
    })
  }

  // Save Contact Details with Audit Trail Log
  const handleSaveContactDetails = async () => {
    if (!selectedLead || !editFullName.trim()) return
    setSavingContact(true)
    setActionSuccessMsg('')

    const targetStaff = staffMembers.find((s) => s.email?.toLowerCase() === editAssignedAgentEmail.toLowerCase())
    const valNum = Number(editEstimatedValue) || 0

    const updatedFields: any = {
      full_name: editFullName.trim(),
      email: editEmail.trim() || null,
      phone_number: editPhone.trim() || null,
      company_name: editCompany.trim() || null,
      estimated_value: valNum,
      stage: editStage || selectedLead.stage,
      assigned_agent_email: editAssignedAgentEmail || selectedLead.assigned_agent_email,
      assigned_agent_id: targetStaff?.id || selectedLead.assigned_agent_id,
      updated_at: new Date().toISOString()
    }

    // Detect differences to build rich audit log
    const changes: string[] = []
    if (editFullName.trim() !== (selectedLead.full_name || '')) changes.push(`Name to "${editFullName.trim()}"`)
    if ((editEmail.trim() || '') !== (selectedLead.email || '')) changes.push(`Email to "${editEmail.trim() || 'none'}"`)
    if ((editPhone.trim() || '') !== (selectedLead.phone_number || '')) changes.push(`Phone to "${editPhone.trim() || 'none'}"`)
    if ((editCompany.trim() || '') !== (selectedLead.company_name || '')) changes.push(`Company to "${editCompany.trim() || 'none'}"`)
    if (valNum !== (selectedLead.estimated_value || 0)) changes.push(`Value to ${currencyPrefix}${valNum.toLocaleString()}`)
    if (editStage && editStage !== selectedLead.stage) changes.push(`Stage moved to "${STAGES.find((s) => s.id === editStage)?.name || editStage}"`)
    if (editAssignedAgentEmail && editAssignedAgentEmail !== selectedLead.assigned_agent_email) changes.push(`Assigned to ${editAssignedAgentEmail.split('@')[0]}`)

    const { error } = await supabase
      .from('sales_leads')
      .update(updatedFields)
      .eq('id', selectedLead.id)

    if (!error) {
      const updatedLead = { ...selectedLead, ...updatedFields }
      setSelectedLead(updatedLead)
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updatedLead : l)))
      setActionSuccessMsg('Contact details updated successfully!')
      setIsEditingContact(false)

      if (changes.length > 0) {
        const auditText = `Contact updated: ${changes.join(', ')}`
        const { data: newNote } = await supabase
          .from('lead_notes')
          .insert({
            lead_id: selectedLead.id,
            author_email: currentUserEmail,
            author_name: currentUserEmail.split('@')[0],
            source: 'contact_edit',
            note_text: auditText
          })
          .select()
          .single()

        if (newNote) {
          setNotes((prev) => [newNote, ...prev])
        }
      }

      toast.success('Contact details updated')
      setTimeout(() => setActionSuccessMsg(''), 4000)
    } else {
      console.error('Error saving contact details:', error)
      toast.error('Failed to save contact details')
    }
    setSavingContact(false)
  }

  // Soft Delete Lead -> Move to Recycle Bin (Trash) — ADMIN ONLY
  const handleDeleteLead = async (leadId: string, leadName?: string) => {
    if (!effectiveIsAdmin) {
      toast.error('Permission denied: Only Admins can delete leads.')
      return
    }
    const targetLead = leads.find((l) => l.id === leadId)
    if (!targetLead) return

    const prevStage = targetLead.stage
    const updatedFields = {
      stage: 'trash',
      followup_status: `deleted_from:${prevStage}`,
      last_interaction_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Optimistic UI update
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...updatedFields } : l)))
    if (selectedLead?.id === leadId) setSelectedLead(null)

    const { error } = await supabase.from('sales_leads').update(updatedFields).eq('id', leadId)
    if (error) {
      console.error('Error moving lead to bin:', error)
      toast.error('Failed to move lead to Recycle Bin')
      return
    }

    await supabase.from('lead_notes').insert({
      lead_id: leadId,
      author_email: currentUserEmail,
      author_name: currentUserEmail.split('@')[0],
      source: 'lead_deleted',
      note_text: `Moved to Recycle Bin from stage "${STAGES.find((s) => s.id === prevStage)?.name || prevStage}" by ${currentUserEmail.split('@')[0]}`
    })

    toast.success(`"${targetLead.full_name}" moved to Recycle Bin`, {
      action: {
        label: 'Undo',
        onClick: () => handleRestoreLead(leadId)
      },
      duration: 6000
    })
  }

  // Restore Lead from Recycle Bin
  const handleRestoreLead = async (leadId: string) => {
    const targetLead = leads.find((l) => l.id === leadId)
    if (!targetLead) return

    let restoredStage = 'repeat_lead'
    if (targetLead.followup_status && targetLead.followup_status.startsWith('deleted_from:')) {
      restoredStage = targetLead.followup_status.replace('deleted_from:', '')
    } else if (targetLead.followup_status && targetLead.followup_status.startsWith('deleted:')) {
      restoredStage = targetLead.followup_status.replace('deleted:', '')
    }

    if (!STAGES.some((s) => s.id === restoredStage)) {
      restoredStage = 'repeat_lead'
    }

    const updatedFields = {
      stage: restoredStage,
      followup_status: null,
      last_interaction_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, ...updatedFields } : l)))

    const { error } = await supabase.from('sales_leads').update(updatedFields).eq('id', leadId)
    if (error) {
      console.error('Error restoring lead:', error)
      toast.error('Failed to restore lead')
      return
    }

    await supabase.from('lead_notes').insert({
      lead_id: leadId,
      author_email: currentUserEmail,
      author_name: currentUserEmail.split('@')[0],
      source: 'lead_restored',
      note_text: `Restored from Recycle Bin back to stage "${STAGES.find((s) => s.id === restoredStage)?.name || restoredStage}" by ${currentUserEmail.split('@')[0]}`
    })

    const stageName = STAGES.find((s) => s.id === restoredStage)?.name || restoredStage
    toast.success(`"${targetLead.full_name}" restored to ${stageName}!`)
  }

  // Permanently Delete Lead from Database — ADMIN ONLY
  const handlePermanentDelete = async (leadId: string) => {
    if (!effectiveIsAdmin) {
      toast.error('Permission denied: Only Admins can permanently delete leads.')
      return
    }
    const targetLead = leads.find((l) => l.id === leadId)
    if (!confirm(`Are you sure you want to permanently delete "${targetLead?.full_name || 'this contact'}"? This action cannot be undone.`)) {
      return
    }

    setLeads((prev) => prev.filter((l) => l.id !== leadId))

    const { error } = await supabase.from('sales_leads').delete().eq('id', leadId)
    if (error) {
      console.error('Error permanently deleting lead:', error)
      toast.error('Failed to permanently delete lead')
      return
    }

    toast.success('Contact permanently removed.')
  }

  // Empty Recycle Bin — ADMIN ONLY
  const handleEmptyBin = async () => {
    if (!effectiveIsAdmin) {
      toast.error('Permission denied: Only Admins can empty the Recycle Bin.')
      return
    }
    if (trashLeads.length === 0) return
    if (!confirm(`Are you sure you want to permanently delete all ${trashLeads.length} leads in the Recycle Bin? This action CANNOT be undone.`)) {
      return
    }

    const ids = trashLeads.map((l) => l.id)
    setLeads((prev) => prev.filter((l) => !ids.includes(l.id)))

    const { error } = await supabase.from('sales_leads').delete().in('id', ids)
    if (error) {
      console.error('Error emptying bin:', error)
      toast.error('Failed to empty bin')
      return
    }

    toast.success(`Recycle bin emptied (${ids.length} contacts permanently deleted).`)
  }

  // Lead Transfer Handler (Agent to Agent strictly within organization)
  const handleTransferLead = async () => {
    if (!selectedLead || !targetAgentEmail) return
    if (targetAgentEmail === selectedLead.assigned_agent_email) return

    // Strict organization check: Only transfer to members of our organization
    const targetStaff = staffMembers.find((s) => s.email?.toLowerCase() === targetAgentEmail.toLowerCase())
    if (targetStaff && targetStaff.org_id && targetStaff.org_id !== currentOrgId) {
      toast.error(`You can only transfer leads to members within your organization (${currentOrg.name}).`)
      return
    }

    setTransferringLead(true)
    setActionSuccessMsg('')

    const newSource = currentUserEmail
    const updatedFields = {
      assigned_agent_email: targetAgentEmail,
      assigned_agent_id: targetStaff?.id || null,
      source: newSource,
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('sales_leads')
      .update(updatedFields)
      .eq('id', selectedLead.id)

    if (!error) {
      const transferNoteText = `Lead transferred from ${selectedLead.assigned_agent_email || 'Unassigned'} to ${targetAgentEmail} (${targetStaff?.full_name || 'Agent'}) in ${currentOrg.name} by ${currentUserEmail}. Source updated to ${newSource}.`
      
      await supabase.from('lead_notes').insert({
        lead_id: selectedLead.id,
        author_email: currentUserEmail,
        author_name: currentUserEmail.split('@')[0],
        source: 'lead_transfer',
        note_text: transferNoteText
      })

      const updatedLead = { ...selectedLead, ...updatedFields }
      setSelectedLead(updatedLead)
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updatedLead : l)))

      setNotes((prev) => [{
        id: 'transfer-' + Date.now(),
        lead_id: selectedLead.id,
        author_email: currentUserEmail,
        author_name: currentUserEmail.split('@')[0],
        source: 'lead_transfer',
        note_text: transferNoteText,
        created_at: new Date().toISOString()
      }, ...prev])

      setActionSuccessMsg(`Lead transferred to ${targetAgentEmail} (${currentOrg.name}). Source set to ${newSource}`)
      toast.success(`Lead successfully transferred to ${targetAgentEmail}`)
      setTimeout(() => setActionSuccessMsg(''), 4000)
    } else {
      console.error('Error transferring lead:', error)
      toast.error('Failed to transfer lead')
    }

    setTransferringLead(false)
  }

  // Create New Lead Handler (Form Submission with Repeat Inquiry Rule)
  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addFullName.trim()) {
      toast.error('Please enter the lead full name')
      return
    }

    setIsSubmittingLead(true)
    try {
      // 1. Check if lead already exists in sales_leads by email, phone, or name
      let existingLead: SalesLead | null = null

      if (addEmail.trim()) {
        const { data: emailMatch } = await supabase
          .from('sales_leads')
          .select('*')
          .ilike('email', addEmail.trim())
          .order('created_at', { ascending: false })
          .limit(1)
        if (emailMatch && emailMatch.length > 0) existingLead = emailMatch[0]
      }

      if (!existingLead && addPhone.trim()) {
        const clean = addPhone.replace(/[^0-9]/g, '')
        if (clean.length >= 7) {
          const { data: allPhoneLeads } = await supabase
            .from('sales_leads')
            .select('*')
            .not('phone_number', 'is', null)
          if (allPhoneLeads) {
            existingLead = allPhoneLeads.find((l: any) => {
              if (!l.phone_number) return false
              const p = l.phone_number.replace(/[^0-9]/g, '')
              return p.endsWith(clean.slice(-8)) || clean.endsWith(p.slice(-8))
            }) || null
          }
        }
      }

      if (!existingLead && addFullName.trim()) {
        const { data: nameMatch } = await supabase
          .from('sales_leads')
          .select('*')
          .ilike('full_name', addFullName.trim())
          .order('created_at', { ascending: false })
          .limit(1)
        if (nameMatch && nameMatch.length > 0) existingLead = nameMatch[0]
      }

      if (existingLead) {
        // =====================================================================
        // REPEAT INQUIRY RULE:
        // Land in 'repeat_lead' (Repeat Inquiries) under previously assigned agent!
        // =====================================================================
        const assignedEmail = existingLead.assigned_agent_email || addAssignedAgentEmail || currentUserEmail
        const assignedId = existingLead.assigned_agent_id || null

        const updatePayload: any = {
          stage: 'repeat_lead', // REPEAT INQUIRIES
          assigned_agent_email: assignedEmail,
          assigned_agent_id: assignedId,
          last_interaction_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        if (addPhone.trim() && (!existingLead.phone_number || existingLead.phone_number === 'N/A')) {
          updatePayload.phone_number = addPhone.trim()
        }
        if (addEmail.trim() && !existingLead.email) {
          updatePayload.email = addEmail.trim()
        }
        if (addCompany.trim() && !existingLead.company_name) {
          updatePayload.company_name = addCompany.trim()
        }

        const { data: updatedLead, error: uErr } = await supabase
          .from('sales_leads')
          .update(updatePayload)
          .eq('id', existingLead.id)
          .select('*')
          .single()

        if (uErr) throw uErr

        const repeatNote = `Repeat inquiry logged via Lead Form (${addSource}). Automatically landed in Repeat Inquiries under assigned agent: ${assignedEmail}.${addInitialNote ? ` Note: ${addInitialNote.trim()}` : ''}`

        await supabase.from('lead_notes').insert({
          lead_id: existingLead.id,
          author_email: currentUserEmail,
          author_name: currentUserEmail.split('@')[0],
          source: addSource,
          note_text: repeatNote
        })

        const mappedUpdatedLead = {
          ...existingLead,
          ...updatePayload,
          full_name: updatedLead?.full_name || existingLead.full_name,
          phone_number: updatedLead?.phone_number || existingLead.phone_number
        }

        setLeads((prev) => prev.map((l) => (l.id === existingLead.id ? mappedUpdatedLead : l)))
        playVictorySound()
        toast.success(`Existing lead recognized! Card placed in Repeat Inquiries under assigned agent (${assignedEmail}).`, { duration: 6000 })
      } else {
        // Brand new lead
        const targetStaff = orgStaffMembers.find(
          (s) => s.email?.toLowerCase() === addAssignedAgentEmail.toLowerCase()
        )
        const estVal = parseFloat(addEstimatedValue) || 0

        const { data: newLead, error: iErr } = await supabase
          .from('sales_leads')
          .insert({
            full_name: addFullName.trim(),
            email: addEmail.trim() || null,
            phone_number: addPhone.trim() || null,
            company_name: addCompany.trim() || null,
            source: addSource,
            stage: addStage,
            assigned_agent_email: addAssignedAgentEmail,
            assigned_agent_id: targetStaff?.id || null,
            estimated_value: estVal,
            is_qualified: addStage === 'hot_lead' || addStage === 'warm_lead'
          })
          .select('*')
          .single()

        if (iErr) throw iErr

        if (addInitialNote.trim()) {
          await supabase.from('lead_notes').insert({
            lead_id: newLead.id,
            author_email: currentUserEmail,
            author_name: currentUserEmail.split('@')[0],
            source: addSource,
            note_text: addInitialNote.trim()
          })
        }

        const mappedNewLead: SalesLead = {
          ...newLead,
          full_name: newLead.full_name,
          phone_number: newLead.phone_number
        }

        setLeads((prev) => [mappedNewLead, ...prev])
        playVictorySound()
        const stageName = STAGES.find((s) => s.id === addStage)?.name || addStage
        toast.success(`Lead created successfully! Card placed in "${stageName}".`, { duration: 5000 })
      }

      // Reset form
      setAddFullName('')
      setAddEmail('')
      setAddPhone('')
      setAddCompany('')
      setAddInitialNote('')
      setAddEstimatedValue('')
      setShowAddLeadModal(false)
    } catch (err: any) {
      console.error('Error in handleAddLead:', err)
      toast.error(err.message || 'Failed to save lead')
    } finally {
      setIsSubmittingLead(false)
    }
  }



  // Add Note Handler
  const handleAddNote = async () => {
    if (!selectedLead || !newNoteText.trim()) return
    setAddingNote(true)

    const { data: newNote, error } = await supabase
      .from('lead_notes')
      .insert({
        lead_id: selectedLead.id,
        author_email: currentUserEmail,
        author_name: currentUserEmail.split('@')[0],
        source: 'sales_agent',
        note_text: newNoteText.trim()
      })
      .select('*')
      .single()

    if (!error && newNote) {
      setNotes((prev) => [newNote, ...prev])
      logLeadActivity({
        lead_id: selectedLead.id,
        lead_name: selectedLead.full_name,
        activity_type: 'note_added',
        summary: `Added follow-up note: "${newNoteText.trim().slice(0, 90)}"`,
      })
      setNewNoteText('')
    }
    setAddingNote(false)
  }

  // Schedule Follow-up Handler (Custom Calendar Date & Time + Reason)
  const handleSaveFollowup = async () => {
    if (!selectedLead) return
    if (!customDate) {
      toast.error('Please pick a date and time from the calendar')
      return
    }
    setUpdatingFollowup(true)
    setActionSuccessMsg('')

    try {
      const res = await fetch('/api/leads/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          followup_choice: 'custom',
          custom_date: customDate,
          followup_title: customTitle.trim() || 'Scheduled Follow-Up',
          followup_note: followupNote.trim() || null,
          agent_email: currentUserEmail
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not schedule follow-up')
      }

      const isoNext = new Date(customDate).toISOString()
      const nextStage =
        selectedLead.stage === 'due_followup' && new Date(isoNext).getTime() > Date.now()
          ? 'warm_lead'
          : selectedLead.stage

      if (nextStage !== selectedLead.stage) {
        await supabase.from('sales_leads').update({ stage: nextStage }).eq('id', selectedLead.id)
      }

      const updatedLead: SalesLead = {
        ...selectedLead,
        stage: nextStage,
        next_followup_at: isoNext,
        viewing_date: isoNext,
        followup_status: 'custom_date',
        followup_title: customTitle.trim() || 'Scheduled Follow-Up',
        last_interaction_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      setSelectedLead(updatedLead)
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updatedLead : l)))
      setViewingDateInput(customDate)

      const noteBody = `Follow-up scheduled for ${new Date(customDate).toLocaleString()}${
        customTitle.trim() ? ` — ${customTitle.trim()}` : ''
      }${followupNote.trim() ? `\nNotes: ${followupNote.trim()}` : ''}`

      setNotes((prev) => [
        {
          id: `fu-${Date.now()}`,
          lead_id: selectedLead.id,
          author_email: currentUserEmail,
          author_name: currentUserEmail.split('@')[0],
          source: 'sales_agent',
          note_text: noteBody,
          created_at: new Date().toISOString(),
        },
        ...prev,
      ])

      setFollowupNote('')
      toast.success(`Follow-up scheduled for ${new Date(customDate).toLocaleString()}`)
      setActionSuccessMsg('Follow-up scheduled successfully!')
      setTimeout(() => setActionSuccessMsg(''), 4000)
    } catch (err: any) {
      console.error('Followup update failed:', err)
      toast.error(err.message || 'Failed to schedule follow-up')
    } finally {
      setUpdatingFollowup(false)
    }
  }

  // WhatsApp Link Builder (opens WhatsApp with client's phone & ready-to-send greeting)
  const getWhatsAppLink = (phone: string | null, lead?: SalesLead | null) => {
    if (!phone) return '#'
    let cleanPhone = phone.replace(/[^0-9]/g, '')
    if (cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      cleanPhone = '254' + cleanPhone.slice(1)
    }
    const firstName = lead?.full_name?.trim().split(' ')[0] || 'there'
    const agentName = currentUserEmail ? currentUserEmail.split('@')[0] : 'Cillah'
    const consultDate = lead?.viewing_date || lead?.next_followup_at
    const dateLine = consultDate
      ? ` regarding your booked consultation on ${new Date(consultDate).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
      : ''
    const starterText = `Hi ${firstName}, this is ${agentName} from Cillah reaching out${dateLine}.`
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(starterText)}`
  }

  // Gmail Compose Link Builder (opens logged-in agent's Gmail e.g. atulah@cillah.dev with To, Subject & Body pre-filled)
  const getEmailComposeLink = (lead?: SalesLead | null) => {
    if (!lead?.email) return '#'
    const firstName = lead.full_name?.trim().split(' ')[0] || 'there'
    const consultDate = lead.viewing_date || lead.next_followup_at
    const subject = consultDate
      ? `Your 1-on-1 AI Strategy Call with Cillah — ${lead.full_name}`
      : `Following up — Cillah`
    const bodyLines = [
      `Hi ${firstName},`,
      '',
      consultDate
        ? `Looking forward to our 1-on-1 AI Strategy & Architecture Call scheduled for ${new Date(consultDate).toLocaleString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.`
        : `Thank you for reaching out to Cillah.`,
      '',
      'Best regards,',
      currentUserEmail || 'Cillah Team',
    ]
    const params = new URLSearchParams({
      view: 'cm',
      fs: '1',
      to: lead.email,
      su: subject,
      body: bodyLines.join('\n'),
    })
    if (currentUserEmail) {
      params.set('authuser', currentUserEmail)
    }
    return `https://mail.google.com/mail/?${params.toString()}`
  }

  // Bulletproof instant sign-out handler
  const handleQuickLogout = async () => {
    setProfileMenuOpen(false)
    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ])
    } catch {
      // Proceed to redirect even if network signOut errors
    } finally {
      window.location.replace('/login')
    }
  }

  // Overdue check
  const isOverdue = (nextFollowup: string | null) => {
    if (!nextFollowup) return false
    return new Date(nextFollowup) < new Date()
  }

  return (
    <div className={`w-full ${embedded ? 'bg-transparent p-0' : 'min-h-screen bg-[#090B12] px-3 pt-3 pb-6 sm:p-5 md:p-6'} text-slate-100 font-sans`}>
      {/* LUXURY 2-ROW ACTION & FILTER BAR: Row 1 = AI, + Lead, View | Row 2 = Stage, Time */}
      <div className="space-y-2 mb-3">
        {/* ROW 1: AI | + Lead | View ▾ */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            {/* 1. AI Button */}
            <button
              type="button"
              onClick={openPipelineAiAssistant}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 bg-cyan-500/15 hover:bg-cyan-500/25 active:scale-[0.97] text-cyan-300 border border-cyan-500/35 font-bold rounded-xl text-xs transition-all cursor-pointer shrink-0"
              title="Personal Sales AI Assistant"
            >
              <Bot className="w-4 h-4" />
              <span>AI</span>
            </button>

            {/* 2. + Lead Button */}
            <button
              type="button"
              onClick={() => {
                setAddStage('new_lead')
                setAddAssignedAgentEmail(currentUserEmail)
                setShowAddLeadModal(true)
              }}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 bg-[#C9A66B] hover:bg-[#d8b77c] active:scale-[0.97] text-slate-950 font-black rounded-xl text-xs transition-all shadow-md shadow-[#C9A66B]/20 cursor-pointer shrink-0"
              title="Add New Lead"
            >
              <Plus className="w-4 h-4 stroke-[2.6]" />
              <span>Lead</span>
            </button>

            {/* 3. View Dropdown (Drops directly under View button) */}
            <div className="relative ml-auto sm:ml-0" ref={viewMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setViewMenuOpen((p) => !p)
                  setStageMenuOpen(false)
                  setTimeMenuOpen(false)
                }}
                className={`inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  viewMenuOpen
                    ? 'bg-[#C9A66B]/15 border-[#C9A66B]/60 text-[#E5C687]'
                    : 'bg-[#0F1422] border-white/10 text-slate-200 hover:border-white/20'
                }`}
              >
                {viewMode === 'kanban' ? (
                  <LayoutGrid className="w-3.5 h-3.5 text-[#C9A66B]" />
                ) : (
                  <List className="w-3.5 h-3.5 text-[#C9A66B]" />
                )}
                <span>View</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${viewMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {viewMenuOpen && (
                <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-1.5 w-44 bg-[#0E131F] border border-[#C9A66B]/40 rounded-xl shadow-2xl z-50 overflow-hidden p-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('kanban')
                      setViewMenuOpen(false)
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      viewMode === 'kanban'
                        ? 'bg-[#C9A66B]/15 text-[#E5C687]'
                        : 'text-slate-200 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <LayoutGrid className="w-3.5 h-3.5" /> Kanban
                    </span>
                    {viewMode === 'kanban' && <span className="text-[#C9A66B] font-bold">✓</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('table')
                      setViewMenuOpen(false)
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      viewMode === 'table'
                        ? 'bg-[#C9A66B]/15 text-[#E5C687]'
                        : 'text-slate-200 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <List className="w-3.5 h-3.5" /> List
                    </span>
                    {viewMode === 'table' && <span className="text-[#C9A66B] font-bold">✓</span>}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Admin-Only Compact Controls (Desktop/Tablet right side) */}
          {effectiveIsAdmin && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1.5 h-10 bg-[#0F1422] border border-white/10 rounded-xl px-2.5 text-xs">
                <UserCheck className="w-3.5 h-3.5 text-[#C9A66B]" />
                <select
                  value={agentFilter}
                  onChange={(e) => setAgentFilter(e.target.value)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="all" className="bg-slate-900 text-white">All Agents</option>
                  {orgStaffMembers.map((agent) => (
                    <option key={agent.id} value={agent.email} className="bg-slate-900 text-white">
                      {agent.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => setShowBinModal(true)}
                className={`inline-flex items-center gap-1.5 h-10 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  trashLeads.length > 0
                    ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                    : 'bg-[#0F1422] hover:bg-slate-800 text-slate-400 border-white/10 hover:text-white'
                }`}
                title="Recycle Bin (Admin Only)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {trashLeads.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                    {trashLeads.length}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ROW 2: Stage ▾ | Time ▾ (Dropdowns anchored directly beneath their buttons!) */}
        <div className="flex items-center gap-2">
          {/* 4. Stage Dropdown (Anchored left-0 right below Stage button) */}
          <div className="relative flex-1 sm:flex-initial" ref={stageMenuRef}>
            <button
              type="button"
              onClick={() => {
                setStageMenuOpen((p) => !p)
                setViewMenuOpen(false)
                setTimeMenuOpen(false)
              }}
              className={`w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2 h-10 px-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                selectedStages.length > 0 || stageMenuOpen
                  ? 'bg-[#C9A66B]/15 border-[#C9A66B]/60 text-[#E5C687]'
                  : 'bg-[#0F1422] border-white/10 text-slate-200 hover:border-white/20'
              }`}
            >
              <span className="inline-flex items-center gap-1.5 truncate">
                <Filter className="w-3.5 h-3.5 text-[#C9A66B] shrink-0" />
                <span className="truncate">
                  {selectedStages.length === 0
                    ? 'Stage'
                    : selectedStages.length === 1
                    ? STAGES.find((s) => s.id === selectedStages[0])?.name || '1 Stage'
                    : `${selectedStages.length} Stages`}
                </span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${stageMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {stageMenuOpen && (
              <div className="absolute left-0 top-full mt-1.5 w-64 max-w-[calc(100vw-24px)] max-h-[60vh] overflow-y-auto bg-[#0E131F] border border-[#C9A66B]/40 rounded-xl shadow-2xl z-50 p-1.5 space-y-0.5">
                <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-white/[0.07] mb-1 sticky top-0 bg-[#0E131F]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A66B]">
                    Select Stage
                  </span>
                  {selectedStages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedStages([])}
                      className="text-[11px] text-[#C9A66B] hover:underline font-semibold cursor-pointer"
                    >
                      Show All
                    </button>
                  )}
                </div>

                {STAGES.map((st) => {
                  const isChecked = selectedStages.includes(st.id)
                  const stageCount = leads.filter((l) => {
                    if (l.stage === 'trash') return false
                    if (getEffectiveStage(l) !== st.id) return false
                    if (!effectiveIsAdmin && l.assigned_agent_email !== currentUserEmail) return false
                    if (effectiveIsAdmin && agentFilter !== 'all' && l.assigned_agent_email !== agentFilter) return false
                    return true
                  }).length

                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => toggleStageFilter(st.id)}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        isChecked
                          ? 'bg-[#C9A66B]/15 text-white font-semibold'
                          : 'text-slate-200 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 ${
                            isChecked
                              ? 'bg-[#C9A66B] border-[#C9A66B] text-slate-950 font-bold'
                              : 'border-slate-600 bg-slate-950'
                          }`}
                        >
                          {isChecked ? '✓' : ''}
                        </span>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${st.badge}`} />
                        <span className="truncate">{st.name}</span>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-400 shrink-0">
                        {stageCount}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* 5. Time Filter Dropdown (Anchored right-0 on mobile / left-0 on desktop right below Time button) */}
          <div className="relative flex-1 sm:flex-initial" ref={timeMenuRef}>
            <button
              type="button"
              onClick={() => {
                setTimeMenuOpen((p) => !p)
                setViewMenuOpen(false)
                setStageMenuOpen(false)
              }}
              className={`w-full sm:w-auto inline-flex items-center justify-between sm:justify-start gap-2 h-10 px-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                timeFilter !== 'all' || timeMenuOpen
                  ? 'bg-[#C9A66B]/15 border-[#C9A66B]/60 text-[#E5C687]'
                  : 'bg-[#0F1422] border-white/10 text-slate-200 hover:border-white/20'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C9A66B]" />
                <span>{timeFilter === 'all' ? 'Time' : timeFilter}</span>
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform shrink-0 ${timeMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {timeMenuOpen && (
              <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-1.5 w-48 bg-[#0E131F] border border-[#C9A66B]/40 rounded-xl shadow-2xl z-50 overflow-hidden p-1.5 space-y-1">
                {(
                  [
                    { id: 'all', label: 'All Time' },
                    { id: '24h', label: 'Last 24 Hours' },
                    { id: '7d', label: 'Last 7 Days' },
                    { id: '30d', label: 'Last 30 Days' },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setTimeFilter(opt.id)
                      setTimeMenuOpen(false)
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      timeFilter === opt.id
                        ? 'bg-[#C9A66B]/15 text-[#E5C687]'
                        : 'text-slate-200 hover:bg-white/[0.06]'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {timeFilter === opt.id && <span className="text-[#C9A66B] font-bold">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Admin-Only Mobile Controls */}
        {effectiveIsAdmin && (
          <div className="flex sm:hidden items-center gap-2">
            <div className="flex-1 flex items-center gap-1.5 h-9 bg-[#0F1422] border border-white/10 rounded-xl px-2.5 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-[#C9A66B]" />
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="flex-1 bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Agents</option>
                {orgStaffMembers.map((agent) => (
                  <option key={agent.id} value={agent.email} className="bg-slate-900 text-white">
                    {agent.full_name}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setShowBinModal(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-xs font-semibold border bg-[#0F1422] text-slate-300 border-white/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {trashLeads.length > 0 && <span>{trashLeads.length}</span>}
            </button>
          </div>
        )}
      </div>

      {/* CLEAN SINGLE SEARCH BAR BELOW */}
      <div className="mb-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search lead by name, phone, email, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F1422] border border-white/10 text-slate-100 placeholder-slate-500 text-xs sm:text-sm rounded-2xl pl-10 pr-9 py-2.5 sm:py-3 focus:outline-none focus:border-[#C9A66B]/60 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* INDIVIDUALIZED AI FOLLOW-UP SCANNER BANNER (Compact) */}
      {followupScan && followupScan.counts.totalAttention > 0 && (
        <div className="mb-4 rounded-2xl bg-[#0F1422]/90 border border-cyan-500/25 px-3.5 py-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shrink-0">
                <BellRing className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-white">Follow-Ups: </span>
                <span className="text-slate-300">
                  {followupScan.counts.overdue > 0 && (
                    <strong className="text-rose-400">{followupScan.counts.overdue} overdue · </strong>
                  )}
                  {followupScan.counts.dueToday > 0 && (
                    <strong className="text-amber-400">{followupScan.counts.dueToday} today · </strong>
                  )}
                  <strong className="text-cyan-300">{followupScan.counts.upcoming48h} in 48h</strong>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setScanExpanded((p) => !p)}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-300 hover:text-white cursor-pointer"
              >
                {scanExpanded ? 'Hide' : 'View'}
              </button>
              <button
                type="button"
                onClick={openPipelineAiAssistant}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/35 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/25 cursor-pointer"
              >
                <Bot className="w-3.5 h-3.5" /> Prioritize
              </button>
            </div>
          </div>

          {scanExpanded && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {[...followupScan.overdue, ...followupScan.dueToday, ...followupScan.upcoming48h]
                .slice(0, 6)
                .map((item: any) => {
                  const isLate = new Date(item.next_followup_at).getTime() < Date.now()
                  const fullLead = leads.find((l) => l.id === item.id)
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <button
                        type="button"
                        onClick={() => fullLead && setSelectedLead(fullLead)}
                        className="text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="font-semibold text-white truncate">{item.full_name}</div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {item.followup_title || item.company_name || 'Scheduled Follow-up'}
                        </div>
                        <div className={`text-[10px] font-semibold mt-0.5 ${isLate ? 'text-rose-400' : 'text-amber-400'}`}>
                          {isLate ? 'Overdue: ' : 'Due: '}
                          {new Date(item.next_followup_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </button>
                      {fullLead && (
                        <button
                          type="button"
                          onClick={() => openLeadAiAssistant(fullLead)}
                          title="Draft follow-up with Personal AI"
                          className="p-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 shrink-0 cursor-pointer"
                        >
                          <Bot className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}

      {/* Selected Stage Filter Chips */}
      {selectedStages.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {selectedStages.map((stageId) => {
            const st = STAGES.find((s) => s.id === stageId)
            if (!st) return null
            return (
              <button
                key={stageId}
                type="button"
                onClick={() => toggleStageFilter(stageId)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C9A66B]/15 border border-[#C9A66B]/40 text-[#C9A66B] text-[11px] font-semibold hover:bg-[#C9A66B]/25 transition-colors cursor-pointer"
              >
                <span>{st.name}</span>
                <X className="w-3 h-3" />
              </button>
            )
          })}
          <button
            type="button"
            onClick={() => setSelectedStages([])}
            className="text-[11px] text-slate-400 hover:text-white underline ml-1 cursor-pointer"
          >
            Reset
          </button>
        </div>
      )}

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-8 -mx-3 px-3 sm:mx-0 sm:px-0 items-start snap-x snap-mandatory scroll-smooth scrollbar-thin">
          {visibleKanbanStages.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => getEffectiveStage(l) === stage.id)

            return (
              <div
                key={stage.id}
                className={`border rounded-2xl p-3 sm:p-4 flex flex-col min-h-[460px] w-[86vw] max-w-[330px] sm:w-[295px] sm:max-w-none flex-shrink-0 snap-center sm:snap-align-none ${
                  stage.id === 'due_followup' && stageLeads.length > 0
                    ? 'bg-rose-950/20 border-rose-500/40'
                    : 'bg-[#0E131F]/90 border-white/[0.08]'
                }`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const leadId = e.dataTransfer.getData('leadId')
                  if (leadId) handleStageChange(leadId, stage.id)
                }}
              >
                {/* Clean Column Header: Stage Title + Total Number Right Beside Title */}
                <div
                  className={`px-3.5 py-2.5 rounded-xl border ${stage.color} mb-3.5 flex items-center gap-2 ${
                    stage.id === 'due_followup' && stageLeads.length > 0 ? 'animate-pulse' : ''
                  }`}
                >
                  {stage.id === 'due_followup' && stageLeads.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                  )}
                  <span className="font-bold text-xs uppercase tracking-wider truncate">
                    {stage.name}
                  </span>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-950/90 text-white border border-white/15 tabular-nums shrink-0">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 flex flex-col gap-3">
                  {stageLeads.map((lead) => {
                    const overdue = isOverdue(lead.next_followup_at)

                    return (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData('leadId', lead.id)}
                        onClick={() => setSelectedLead(lead)}
                        className={`bg-slate-950 border ${
                          overdue ? 'border-red-500/80 shadow-[0_0_15px_rgba(239,68,68,0.25)]' : 'border-slate-800 hover:border-[#C9A66B]/50'
                        } rounded-xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 shadow-md group`}
                      >
                        {/* Header Badges */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A66B] bg-[#C9A66B]/10 px-2 py-0.5 rounded-md border border-[#C9A66B]/20">
                            {lead.source?.replace(/_/g, ' ')}
                          </span>
                          {overdue && (
                            <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/30 flex items-center gap-1 animate-pulse">
                              <AlertCircle className="w-3 h-3" /> Overdue
                            </span>
                          )}
                        </div>

                        {/* Name & Contact Details */}
                        <h4 className="font-bold text-sm text-slate-100 group-hover:text-[#C9A66B] transition-colors">
                          {lead.full_name}
                        </h4>

                        {/* Display Email Address Prominently */}
                        {lead.email && (
                          <div className="text-xs text-purple-300/90 flex items-center gap-1.5 mt-1 truncate">
                            <Mail className="w-3 h-3 flex-shrink-0 text-purple-400" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}

                        {/* Display Phone Number */}
                        {lead.phone_number && (
                          <div className="text-xs text-emerald-400/90 flex items-center gap-1.5 mt-0.5 truncate">
                            <Phone className="w-3 h-3 flex-shrink-0 text-emerald-400" />
                            <span className="truncate">{lead.phone_number}</span>
                          </div>
                        )}

                        {lead.company_name && (
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                            <Building className="w-3 h-3 text-slate-500" /> {lead.company_name}
                          </div>
                        )}

                        {/* Display Upcoming Follow-Up Date Badge (Turns red & blinks when due!) */}
                        {(lead.next_followup_at || lead.viewing_date) && (
                          <div
                            className={`text-[11px] font-semibold flex items-center gap-1.5 mt-2 px-2 py-1 rounded-md border ${
                              overdue
                                ? 'bg-rose-500/20 border-rose-500/60 text-rose-200 animate-pulse'
                                : 'bg-purple-500/10 border-purple-500/25 text-purple-300'
                            }`}
                          >
                            <Calendar
                              className={`w-3.5 h-3.5 flex-shrink-0 ${
                                overdue ? 'text-rose-400' : 'text-purple-400'
                              }`}
                            />
                            <span className="truncate">
                              {overdue ? 'Due Follow-Up: ' : 'Follow-Up: '}
                              {new Date(lead.next_followup_at || lead.viewing_date!).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        )}

                        {/* Estimated Value */}
                        {lead.estimated_value > 0 && (
                          <div className="text-xs font-semibold text-emerald-400 mt-2">
                            {currencyPrefix}{lead.estimated_value.toLocaleString()}
                          </div>
                        )}

                        {/* Agent Assignment */}
                        <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-900 flex items-center justify-between">
                          <span>
                            {staffMembers.find(
                              (s) => s.email?.toLowerCase() === lead.assigned_agent_email?.toLowerCase()
                            )?.full_name ||
                              lead.assigned_agent_email?.split('@')[0] ||
                              'Unassigned'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* 1-CLICK QUICK ACTION COMMUNICATION ICONS */}
                        <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-slate-900">
                          {lead.phone_number && (
                            <a
                              href={getWhatsAppLink(lead.phone_number, lead)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => {
                                e.stopPropagation()
                                logLeadActivity({
                                  lead_id: lead.id,
                                  lead_name: lead.full_name,
                                  activity_type: 'whatsapp_click',
                                  summary: `Initiated WhatsApp follow-up with ${lead.full_name}`,
                                })
                              }}
                              title="Chat on WhatsApp"
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {lead.phone_number && (
                            <a
                              href={`tel:${lead.phone_number}`}
                              onClick={(e) => {
                                e.stopPropagation()
                                logLeadActivity({
                                  lead_id: lead.id,
                                  lead_name: lead.full_name,
                                  activity_type: 'call_logged',
                                  summary: `Placed follow-up call to ${lead.full_name} (${lead.phone_number})`,
                                })
                              }}
                              title="Call Lead"
                              className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {lead.email && (
                            <a
                              href={getEmailComposeLink(lead)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => {
                                e.stopPropagation()
                                logLeadActivity({
                                  lead_id: lead.id,
                                  lead_name: lead.full_name,
                                  activity_type: 'email_click',
                                  summary: `Opened Email compose for ${lead.full_name}`,
                                })
                              }}
                              title="Compose Email"
                              className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* Mini Robot AI Drafting Assistant Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              openLeadAiAssistant(lead)
                            }}
                            title="Draft Message with Personal AI Assistant"
                            className="p-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/35 rounded-lg transition-colors cursor-pointer"
                          >
                            <Bot className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Edit Contact Details */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedLead(lead)
                              setIsEditingContact(true)
                            }}
                            title="Edit Contact"
                            className="p-1.5 bg-slate-900 hover:bg-[#C9A66B]/20 text-slate-400 hover:text-[#C9A66B] border border-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Move to Recycle Bin — ADMIN ONLY */}
                          {effectiveIsAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteLead(lead.id, lead.full_name)
                              }}
                              title="Move to Recycle Bin (Admin Only)"
                              className="p-1.5 bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Quick Stage Move Dropdown (Clean full-width row below icons — zero column overlap) */}
                        <div className="mt-2">
                          <select
                            value={lead.stage}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleStageChange(lead.id, e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#C9A66B] cursor-pointer"
                          >
                            {STAGES.map((st) => (
                              <option key={st.id} value={st.id}>
                                {st.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* LIST VIEW (Responsive Mobile Cards + Desktop Table) */}
      {viewMode === 'table' && (
        <div className="space-y-2.5">
          {/* Mobile Luxury List Cards (< md) */}
          <div className="md:hidden space-y-2.5">
            {filteredLeads.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0E131F] border border-white/10 text-center text-xs text-slate-400">
                No leads match your current filter.
              </div>
            ) : (
              filteredLeads.map((lead) => {
                const stageMeta = STAGES.find((s) => s.id === getEffectiveStage(lead))
                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className="p-4 rounded-2xl bg-[#0E131F] border border-white/10 active:scale-[0.99] transition-all space-y-2.5 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">{lead.full_name}</h4>
                        {lead.company_name && (
                          <p className="text-[11px] text-slate-400 truncate">{lead.company_name}</p>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold shrink-0 ${stageMeta?.color || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                        {stageMeta?.name || lead.stage}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                      {lead.phone_number && (
                        <span className="text-emerald-400 font-medium">{lead.phone_number}</span>
                      )}
                      {lead.email && (
                        <span className="text-purple-300 truncate max-w-[200px]">{lead.email}</span>
                      )}
                      {lead.estimated_value > 0 && (
                        <span className="text-[#E5C687] font-mono font-bold ml-auto">
                          {currencyPrefix}{lead.estimated_value.toLocaleString()}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center gap-1.5">
                        {lead.phone_number && (
                          <a
                            href={getWhatsAppLink(lead.phone_number, lead)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-emerald-500/15 text-emerald-400 rounded-xl"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {lead.phone_number && (
                          <a
                            href={`tel:${lead.phone_number}`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-sky-500/15 text-sky-400 rounded-xl"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {lead.email && (
                          <a
                            href={getEmailComposeLink(lead)}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 bg-purple-500/15 text-purple-400 rounded-xl"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            openLeadAiAssistant(lead)
                          }}
                          className="p-2 bg-cyan-500/15 text-cyan-300 rounded-xl"
                        >
                          <Bot className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <select
                        value={lead.stage}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStageChange(lead.id, e.target.value)}
                        className="bg-slate-950 border border-slate-700 text-[11px] text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[#C9A66B]"
                      >
                        {STAGES.map((st) => (
                          <option key={st.id} value={st.id}>
                            {st.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Desktop Table View (md+) */}
          <div className="hidden md:block bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Lead Name</th>
                <th className="p-4">Contact Details</th>
                <th className="p-4">Source</th>
                <th className="p-4">Stage</th>
                <th className="p-4">Assigned Agent</th>
                <th className="p-4">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLeads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => setSelectedLead(lead)}
                  className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                >
                  <td className="p-4 font-bold text-slate-100">{lead.full_name}</td>
                  <td className="p-4 text-slate-300">
                    <div className="text-purple-300 font-medium">{lead.email || 'No email'}</div>
                    <div className="text-emerald-400">{lead.phone_number || 'No phone'}</div>
                    {lead.company_name && <div className="text-slate-400 text-[11px]">{lead.company_name}</div>}
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-slate-950 text-[#C9A66B] border border-slate-800 rounded-md font-mono text-[11px]">
                      {lead.source}
                    </span>
                  </td>
                  <td className="p-4">
                    <select
                      value={lead.stage}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStageChange(lead.id, e.target.value)}
                      className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2 py-1 text-xs cursor-pointer"
                    >
                      {STAGES.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4 text-slate-300" onClick={(e) => e.stopPropagation()}>
                    {effectiveIsAdmin ? (
                      <select
                        value={(lead.assigned_agent_email || '').toLowerCase()}
                        onChange={async (e) => {
                          const newEmail = e.target.value
                          if (!newEmail || newEmail === (lead.assigned_agent_email || '').toLowerCase()) return
                          const targetStaff = orgStaffMembers.find(
                            (s) => s.email?.toLowerCase() === newEmail.toLowerCase()
                          )
                          const { error } = await supabase
                            .from('sales_leads')
                            .update({
                              assigned_agent_email: newEmail,
                              assigned_agent_id: targetStaff?.id || null,
                              updated_at: new Date().toISOString(),
                            })
                            .eq('id', lead.id)
                          if (!error) {
                            setLeads((prev) =>
                              prev.map((l) =>
                                l.id === lead.id
                                  ? { ...l, assigned_agent_email: newEmail, assigned_agent_id: targetStaff?.id || null }
                                  : l
                              )
                            )
                            logLeadActivity({
                              lead_id: lead.id,
                              lead_name: lead.full_name,
                              activity_type: 'lead_reassigned',
                              summary: `Reassigned "${lead.full_name}" to ${targetStaff?.full_name || newEmail}`,
                            })
                            toast.success(`Assigned "${lead.full_name}" to ${targetStaff?.full_name || newEmail}`)
                          }
                        }}
                        className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-xs cursor-pointer focus:outline-none focus:border-[#C9A66B]"
                      >
                        {!lead.assigned_agent_email && <option value="">Unassigned</option>}
                        {orgStaffMembers.map((ag) => (
                          <option key={ag.id} value={ag.email.toLowerCase()}>
                            {ag.full_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>
                        {staffMembers.find(
                          (s) => s.email?.toLowerCase() === lead.assigned_agent_email?.toLowerCase()
                        )?.full_name ||
                          lead.assigned_agent_email?.split('@')[0] ||
                          'Unassigned'}
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {lead.phone_number && (
                        <a
                          href={getWhatsAppLink(lead.phone_number, lead)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      {lead.phone_number && (
                        <a
                          href={`tel:${lead.phone_number}`}
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg hover:bg-sky-500/20"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      {lead.email && (
                        <a
                          href={getEmailComposeLink(lead)}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Compose Email in Gmail"
                          className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          openLeadAiAssistant(lead)
                        }}
                        title="Draft with Personal AI Assistant"
                        className="p-1.5 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/35 rounded-lg transition-colors cursor-pointer"
                      >
                        <Bot className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedLead(lead)
                          setIsEditingContact(true)
                        }}
                        title="Edit Contact"
                        className="p-1.5 bg-slate-950 text-slate-400 hover:text-[#C9A66B] hover:bg-[#C9A66B]/15 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {effectiveIsAdmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteLead(lead.id, lead.full_name)
                          }}
                          title="Move to Recycle Bin (Admin Only)"
                          className="p-1.5 bg-slate-950 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* INTERACTIVE LEAD DETAIL DRAWER / MODAL */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-xl bg-[#0E131F] border-l border-slate-800 min-h-screen p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300">
            <div>
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedLead.full_name}
                  </h3>
                  
                  {/* PROMINENT CONTACT DETAIL DISPLAY IN HEADER */}
                  <div className="flex flex-wrap items-center gap-2 text-xs mt-2">
                    {selectedLead.email ? (
                      <a
                        href={getEmailComposeLink(selectedLead)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-purple-300 bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 rounded-lg hover:bg-purple-500/25 transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-purple-400" /> {selectedLead.email}
                      </a>
                    ) : (
                      <span className="text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">No email</span>
                    )}

                    {selectedLead.phone_number ? (
                      <a
                        href={`tel:${selectedLead.phone_number}`}
                        className="flex items-center gap-1.5 text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-lg hover:bg-emerald-500/25 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400" /> {selectedLead.phone_number}
                      </a>
                    ) : (
                      <span className="text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-[11px]">
                        No Phone (Click Edit to Add)
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2">
                    Source: <span className="text-[#C9A66B] font-semibold">{selectedLead.source}</span> | Created: {new Date(selectedLead.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleDeleteLead(selectedLead.id, selectedLead.full_name)}
                    title="Move this contact to Recycle Bin"
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setSelectedLead(null)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {actionSuccessMsg && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {actionSuccessMsg}
                </div>
              )}

              {/* 1-CLICK QUICK ACTION BAR IN MODAL */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
                {selectedLead.phone_number ? (
                  <a
                    href={getWhatsAppLink(selectedLead.phone_number, selectedLead)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      logLeadActivity({
                        lead_id: selectedLead.id,
                        lead_name: selectedLead.full_name,
                        activity_type: 'whatsapp_click',
                        summary: `Initiated WhatsApp chat with ${selectedLead.full_name}`,
                      })
                    }
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition-all"
                  >
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                ) : (
                  <button disabled className="py-2.5 bg-slate-900 text-slate-600 rounded-xl text-xs font-bold opacity-50 cursor-not-allowed">
                    No WhatsApp
                  </button>
                )}

                {selectedLead.phone_number ? (
                  <a
                    href={`tel:${selectedLead.phone_number}`}
                    onClick={() =>
                      logLeadActivity({
                        lead_id: selectedLead.id,
                        lead_name: selectedLead.full_name,
                        activity_type: 'call_logged',
                        summary: `Placed follow-up call to ${selectedLead.full_name} (${selectedLead.phone_number})`,
                      })
                    }
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 rounded-xl text-xs font-bold transition-all"
                  >
                    <Phone className="w-4 h-4" /> Direct Call
                  </a>
                ) : (
                  <button disabled className="py-2.5 bg-slate-900 text-slate-600 rounded-xl text-xs font-bold opacity-50 cursor-not-allowed">
                    No Phone
                  </button>
                )}

                {selectedLead.email ? (
                  <a
                    href={getEmailComposeLink(selectedLead)}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      logLeadActivity({
                        lead_id: selectedLead.id,
                        lead_name: selectedLead.full_name,
                        activity_type: 'email_click',
                        summary: `Opened Email compose for ${selectedLead.full_name}`,
                      })
                    }
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-400 rounded-xl text-xs font-bold transition-all"
                  >
                    <Mail className="w-4 h-4" /> Send Email
                  </a>
                ) : (
                  <button disabled className="py-2.5 bg-slate-900 text-slate-600 rounded-xl text-xs font-bold opacity-50 cursor-not-allowed">
                    No Email
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openLeadAiAssistant(selectedLead)}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/35 text-cyan-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <Bot className="w-4 h-4" /> AI Assistant
                </button>
              </div>

              {/* EDIT CONTACT DETAILS SECTION (NAME, EMAIL, PHONE, WHATSAPP, COMPANY, VALUE, STAGE, AGENT) */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-[#C9A66B]" /> Contact Info & Quick Edit
                  </h4>
                  <button
                    onClick={() => setIsEditingContact((p) => !p)}
                    className="text-xs font-semibold text-[#C9A66B] hover:underline cursor-pointer"
                  >
                    {isEditingContact ? 'Cancel' : '✏️ Edit Contact Info'}
                  </button>
                </div>

                {isEditingContact ? (
                  <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-[#C9A66B]"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1">Email Address</label>
                        <input
                          type="email"
                          placeholder="client@example.com"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-[#C9A66B]"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Phone / WhatsApp Number</label>
                        <input
                          type="tel"
                          placeholder="+254 700 000 000"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-[#C9A66B]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1">Company Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Rose Properties"
                          value={editCompany}
                          onChange={(e) => setEditCompany(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-[#C9A66B]"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Deal Value ($ / KES)</label>
                        <input
                          type="number"
                          placeholder="e.g. 50000"
                          value={editEstimatedValue}
                          onChange={(e) => setEditEstimatedValue(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-[#C9A66B]"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 block mb-1">Pipeline Stage</label>
                        <select
                          value={editStage}
                          onChange={(e) => setEditStage(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-[#C9A66B] cursor-pointer"
                        >
                          {STAGES.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-400 block mb-1">Assigned Agent ({currentOrg.name})</label>
                        <select
                          value={editAssignedAgentEmail}
                          onChange={(e) => setEditAssignedAgentEmail(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg p-2 focus:outline-none focus:border-[#C9A66B] cursor-pointer"
                        >
                          {orgStaffMembers.map((agent) => (
                            <option key={agent.id} value={agent.email}>
                              {agent.full_name} ({agent.email})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                      {effectiveIsAdmin ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteLead(selectedLead.id, selectedLead.full_name)}
                          className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Move to Bin
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">Delete restricted to Admin</span>
                      )}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingContact(false)}
                          className="px-3 py-1.5 bg-slate-900 text-slate-400 font-bold rounded-lg hover:text-white cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveContactDetails}
                          disabled={savingContact}
                          className="px-4 py-1.5 bg-[#C9A66B] text-slate-950 font-bold rounded-lg hover:bg-[#C9A66B]/90 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {savingContact ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-900">
                    <div>
                      <span className="text-slate-500 block text-[11px]">Email:</span>
                      <span className="text-purple-300 font-semibold truncate block">{selectedLead.email || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Phone / WhatsApp:</span>
                      <span className="text-emerald-400 font-semibold truncate block">{selectedLead.phone_number || 'Not provided'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Company:</span>
                      <span className="text-slate-300 font-semibold truncate block">{selectedLead.company_name || 'Individual Client'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Deal Value:</span>
                      <span className="text-emerald-400 font-bold block">{currencyPrefix}{(selectedLead.estimated_value || 0).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Current Stage:</span>
                      <span className="text-[#C9A66B] font-semibold block">{STAGES.find((s) => s.id === selectedLead.stage)?.name || selectedLead.stage}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[11px]">Assigned Agent:</span>
                      <span className="text-slate-300 font-semibold truncate block">{selectedLead.assigned_agent_email?.split('@')[0] || 'Unassigned'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* STAGE & AGENT TRANSFER SECTION */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs">
                <div>
                  <label className="text-slate-400 font-medium block mb-1">Current Stage</label>
                  <select
                    value={selectedLead.stage}
                    onChange={(e) => handleStageChange(selectedLead.id, e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg p-2 font-bold focus:outline-none cursor-pointer"
                  >
                    {STAGES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* LEAD TRANSFER FROM AGENT TO AGENT (STRICTLY WITHIN OUR ORGANIZATION) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-medium">Transfer Lead To Agent</label>
                    <span className="text-[10px] font-bold text-[#C9A66B] bg-[#C9A66B]/15 px-2 py-0.5 rounded border border-[#C9A66B]/30">
                      {currentOrg.name}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={targetAgentEmail}
                      onChange={(e) => setTargetAgentEmail(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-lg p-2 font-bold focus:outline-none cursor-pointer"
                    >
                      {orgStaffMembers.map((agent) => (
                        <option key={agent.id} value={agent.email}>
                          {agent.full_name} ({agent.email})
                        </option>
                      ))}
                    </select>
                    {targetAgentEmail !== selectedLead.assigned_agent_email && (
                      <button
                        onClick={handleTransferLead}
                        disabled={transferringLead}
                        className="px-3 py-2 bg-[#C9A66B] text-slate-950 font-bold rounded-lg text-xs hover:bg-[#C9A66B]/90 transition-all disabled:opacity-50 flex-shrink-0 cursor-pointer shadow-md"
                      >
                        {transferringLead ? 'Transferring...' : 'Transfer'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ADMIN-ONLY DELETE CONTROL / ROLE ACCESS NOTICE */}
              {effectiveIsAdmin ? (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-red-400 font-medium flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Admin Actions (Delete Enabled)
                  </span>
                  <button
                    type="button"
                    onClick={() => selectedLead && handleDeleteLead(selectedLead.id, selectedLead.full_name)}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold rounded-lg border border-red-500/30 transition-colors cursor-pointer"
                  >
                    Move to Bin
                  </button>
                </div>
              ) : (
                <div className="mb-6 p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C9A66B]" />
                    Lead deletion is restricted to Admins / Managing Partners.
                  </span>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-semibold uppercase rounded-md border border-slate-700 shrink-0">
                    Protected
                  </span>
                </div>
              )}

              {/* UPCOMING FOLLOW-UP (TURNS RED & BLINKS WHEN DUE FOR IMMEDIATE ATTENTION) */}
              {(() => {
                const activeFollowupIso = selectedLead.next_followup_at || selectedLead.viewing_date
                const isDueNow = Boolean(activeFollowupIso && new Date(activeFollowupIso).getTime() <= Date.now())
                return (
                  <div
                    className={`rounded-2xl p-5 mb-6 border transition-all ${
                      isDueNow
                        ? 'bg-rose-950/30 border-rose-500/70 shadow-lg shadow-rose-500/10'
                        : 'bg-slate-900/80 border-purple-500/25'
                    }`}
                  >
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <Calendar className={`w-4 h-4 ${isDueNow ? 'text-rose-400 animate-pulse' : 'text-purple-400'}`} />
                      Upcoming Follow-Up
                    </h4>

                    {activeFollowupIso && (
                      <div
                        className={`mb-3 px-3.5 py-2.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          isDueNow
                            ? 'bg-rose-500/20 border-rose-500/70 text-rose-100 animate-pulse'
                            : 'bg-purple-500/15 border-purple-500/35 text-purple-200'
                        }`}
                      >
                        <div>
                          <div>
                            Scheduled:{' '}
                            <strong className="text-white">
                              {new Date(activeFollowupIso).toLocaleString([], {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </strong>
                          </div>
                          {selectedLead.followup_title && (
                            <div className="text-[11px] opacity-90 mt-0.5">
                              Reason: {selectedLead.followup_title}
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 self-start sm:self-center ${
                            isDueNow
                              ? 'bg-rose-500 text-white'
                              : 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/30'
                          }`}
                        >
                          {isDueNow ? 'Due Now — Attention' : 'Reminder Active'}
                        </span>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-400 mb-3">
                      Update the follow-up date and reminder for this lead.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="datetime-local"
                        value={viewingDateInput}
                        onChange={(e) => setViewingDateInput(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-700 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                      />
                      <button
                        type="button"
                        onClick={handleSaveViewingDate}
                        disabled={savingViewingDate || !viewingDateInput}
                        className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <Calendar className="w-4 h-4" />
                        {savingViewingDate ? 'Updating...' : 'Update Follow-Up'}
                      </button>
                    </div>
                  </div>
                )
              })()}

              {/* SCHEDULE FOLLOW-UP (CLEAN CALENDAR DATE & TIME PICKER + REASON) */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-6">
                <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#C9A66B]" /> Schedule Follow-Up
                </h4>
                <p className="text-[11px] text-slate-400 mb-4">
                  Pick the exact follow-up date &amp; time from the calendar and add the reason.
                </p>

                <div className="space-y-3 mb-4 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <label className="text-[11px] text-slate-300 font-medium flex items-center gap-1.5 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#C9A66B]" /> Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg p-2.5 focus:outline-none focus:border-[#C9A66B] [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 font-medium block mb-1.5">
                      Reason for Follow-Up
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Call back after client reviews proposal, confirm site viewing..."
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg p-2.5 focus:outline-none focus:border-[#C9A66B]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-300 font-medium block mb-1.5">
                      Follow-Up Notes (Saved to Lead Timeline)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Write any details from your call or what to cover next..."
                      value={followupNote}
                      onChange={(e) => setFollowupNote(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-white rounded-lg p-2.5 focus:outline-none focus:border-[#C9A66B] resize-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveFollowup}
                  disabled={updatingFollowup || !customDate}
                  className="w-full py-2.5 bg-[#C9A66B] text-slate-950 font-bold rounded-xl text-xs hover:bg-[#C9A66B]/90 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  {updatingFollowup ? 'Scheduling...' : 'Schedule Follow-Up'}
                </button>
              </div>

              {/* DOCUMENTS, CONTRACTS & DIRECT CLIENT BILLING */}
              <LeadDocumentsAndBilling
                lead={selectedLead}
                orgId={currentOrgId}
                orgSlug={currentOrg.slug}
                orgName={currentOrg.name}
                onActivityUpdated={() => {
                  // Reload notes so newly logged invoice/document notes appear immediately
                  supabase
                    .from('lead_notes')
                    .select('*')
                    .eq('lead_id', selectedLead.id)
                    .order('created_at', { ascending: false })
                    .then(({ data }) => {
                      if (data) setNotes(data)
                    })
                }}
              />

              {/* MULTI-SOURCE NOTES & EDIT HISTORY TIMELINE */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <History className="w-4 h-4 text-[#C9A66B]" /> Activity & Edit History
                </h4>

                {/* Add Note Box */}
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    placeholder="Type a manual note..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-[#C9A66B]"
                  />
                  <button
                    onClick={handleAddNote}
                    disabled={addingNote || !newNoteText.trim()}
                    className="px-4 py-2 bg-[#C9A66B] text-slate-950 text-xs font-bold rounded-xl hover:bg-[#C9A66B]/90 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Add Note
                  </button>
                </div>

                {/* Notes & Activity List */}
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {notes.length === 0 ? (
                    <div className="text-xs text-slate-500 italic">No notes or edits logged for this lead yet.</div>
                  ) : (
                    notes.map((note) => {
                      const isEdit = note.source === 'contact_edit'
                      const isDeleted = note.source === 'lead_deleted'
                      const isRestored = note.source === 'lead_restored'
                      const isTransfer = note.source === 'agent_transfer'
                      const isConsultation = note.source === 'consultation_scheduled'
                      const isRepeat = note.source === 'lead_deduplication'

                      return (
                        <div key={note.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl text-xs">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-[#C9A66B]">{note.author_name || note.author_email}</span>
                              {isEdit && (
                                <span className="px-1.5 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded text-[9px] font-semibold flex items-center gap-1">
                                  <Edit2 className="w-2.5 h-2.5" /> Edited
                                </span>
                              )}
                              {isDeleted && (
                                <span className="px-1.5 py-0.5 bg-rose-500/15 text-rose-400 border border-rose-500/30 rounded text-[9px] font-semibold flex items-center gap-1">
                                  <Trash2 className="w-2.5 h-2.5" /> Moved to Bin
                                </span>
                              )}
                              {isRestored && (
                                <span className="px-1.5 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-semibold flex items-center gap-1">
                                  <RotateCcw className="w-2.5 h-2.5" /> Restored
                                </span>
                              )}
                              {isTransfer && (
                                <span className="px-1.5 py-0.5 bg-sky-500/15 text-sky-400 border border-sky-500/30 rounded text-[9px] font-semibold">
                                  Transferred
                                </span>
                              )}
                              {isConsultation && (
                                <span className="px-1.5 py-0.5 bg-purple-500/15 text-purple-400 border border-purple-500/30 rounded text-[9px] font-semibold">
                                  Consultation
                                </span>
                              )}
                              {isRepeat && (
                                <span className="px-1.5 py-0.5 bg-violet-500/15 text-violet-400 border border-violet-500/30 rounded text-[9px] font-semibold">
                                  Repeat Lead
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 shrink-0">{new Date(note.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-slate-200 leading-relaxed whitespace-pre-line">
                            {note.note_text.replace(/\s\|\s/g, '\n')}
                          </p>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* ADD LEAD MODAL FORM */}
      {/* ================================================================= */}
      {showAddLeadModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#C9A66B]/15 text-[#C9A66B] rounded-xl border border-[#C9A66B]/30">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Add New Sales Lead
                    <span className="text-[10px] font-semibold text-[#C9A66B] bg-[#C9A66B]/10 px-2 py-0.5 rounded border border-[#C9A66B]/30">
                      {currentOrg.name}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Fill in lead details to place them in their respective column.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddLeadModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleAddLead} className="p-5 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mary Wanjiku or James Omondi"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]"
                />
              </div>

              {/* Email & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="client@example.com"
                    value={addEmail}
                    onChange={(e) => setAddEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+254 7XX XXX XXX"
                    value={addPhone}
                    onChange={(e) => setAddPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
              </div>

              {/* Company & Estimated Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Company / Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RGN Group or Apex Realty"
                    value={addCompany}
                    onChange={(e) => setAddCompany(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Estimated Deal Value (USD / KES)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={addEstimatedValue}
                    onChange={(e) => setAddEstimatedValue(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
              </div>

              {/* Pipeline Column (Stage) & Lead Source */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Column (Stage)
                  </label>
                  <select
                    value={addStage}
                    onChange={(e) => setAddStage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A66B] cursor-pointer"
                  >
                    {STAGES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Lead Source
                  </label>
                  <select
                    value={addSource}
                    onChange={(e) => setAddSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A66B] cursor-pointer"
                  >
                    {currentOrg.slug === 'cillah-dev' ||
                    currentOrgId === 'a1b2c3d4-e5f6-7890-abcd-222222222222' ? (
                      <>
                        <option value="linkedin">LinkedIn</option>
                        <option value="event_forum">Event</option>
                        <option value="email_campaign">Email Campaign</option>
                        <option value="website_enquiry">Website Enquiry</option>
                        <option value="whatsapp">WhatsApp Inbound</option>
                        <option value="instagram_dm">Instagram DM</option>
                        <option value="facebook_ad">Facebook Ad</option>
                        <option value="phone_call">Phone Call</option>
                        <option value="referral">Referral</option>
                        <option value="direct_outreach">Direct Outreach</option>
                      </>
                    ) : (
                      <>
                        <option value="microsoft_365_email">Microsoft 365 Email</option>
                        <option value="event_forum">Event / Forum</option>
                        <option value="tender_rfp">Tender / RFP</option>
                        <option value="email_campaign">Email Campaign</option>
                        <option value="website_enquiry">Website Enquiry</option>
                        <option value="whatsapp">WhatsApp Inbound</option>
                        <option value="instagram_dm">Instagram DM</option>
                        <option value="facebook_ad">Facebook Ad</option>
                        <option value="phone_call">Phone Call</option>
                        <option value="referral">Referral</option>
                        <option value="direct_outreach">Direct Outreach</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Assigned Agent (STRICTLY RESTRICTED TO CURRENT ORGANIZATION) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300">
                    Assign to Agent
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Organization: <span className="text-[#C9A66B] font-semibold">{currentOrg.name}</span>
                  </span>
                </div>
                <select
                  value={addAssignedAgentEmail}
                  onChange={(e) => setAddAssignedAgentEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white font-medium focus:outline-none focus:border-[#C9A66B] cursor-pointer"
                >
                  {orgStaffMembers.map((agent) => (
                    <option key={agent.id} value={agent.email}>
                      {agent.full_name} ({agent.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Initial Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Initial Note / Context (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes on client requirements, timeline, or inquiries..."
                  value={addInitialNote}
                  onChange={(e) => setAddInitialNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B] resize-none"
                />
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#C9A66B] shrink-0 mt-0.5" />
                <span>
                  <strong>Repeat Inquiry Rule Active:</strong> If a lead with matching email, phone, or name already exists in the database, it will automatically land under their assigned agent in <strong className="text-violet-400">Repeat Inquiries</strong>.
                </span>
              </div>

              {/* Form Actions */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddLeadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="px-5 py-2.5 bg-[#C9A66B] hover:bg-[#C9A66B]/90 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-[#C9A66B]/25 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSubmittingLead ? 'Saving Lead...' : 'Add Lead Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* RECYCLE BIN (TRASH) MODAL */}
      {/* ================================================================= */}
      {showBinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/90 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/15 text-rose-400 rounded-xl border border-rose-500/30">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    Recycle Bin (Trash)
                    <span className="text-xs px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-full font-mono font-normal border border-rose-500/30">
                      {trashLeads.length} {trashLeads.length === 1 ? 'contact' : 'contacts'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Contacts here are hidden from the active pipeline. Restore them anytime or permanently delete them.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBinModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action / Search Bar */}
            <div className="p-4 bg-slate-950/40 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search contacts in bin..."
                  value={binSearchQuery}
                  onChange={(e) => setBinSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]"
                />
              </div>
              {trashLeads.length > 0 && (
                <button
                  type="button"
                  onClick={handleEmptyBin}
                  className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Empty Recycle Bin
                </button>
              )}
            </div>

            {/* List of Deleted Contacts */}
            <div className="flex-1 overflow-y-auto p-4">
              {trashLeads.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                  <p className="text-sm font-medium text-slate-300">Recycle Bin is empty</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Deleted contacts will appear here so you can undo deletions or permanently purge them.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {trashLeads.map((lead) => {
                    let prevStageName = 'Pipeline'
                    if (lead.followup_status && lead.followup_status.startsWith('deleted_from:')) {
                      const sId = lead.followup_status.replace('deleted_from:', '')
                      prevStageName = STAGES.find((s) => s.id === sId)?.name || sId
                    }

                    return (
                      <div
                        key={lead.id}
                        className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{lead.full_name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                              From: {prevStageName}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
                            {lead.email && <span className="text-purple-300">{lead.email}</span>}
                            {lead.phone_number && <span className="text-emerald-400">{lead.phone_number}</span>}
                            {lead.company_name && <span>{lead.company_name}</span>}
                            <span>Agent: {lead.assigned_agent_email?.split('@')[0] || 'Unassigned'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRestoreLead(lead.id)}
                            className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Restore lead back to original stage"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermanentDelete(lead.id)}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Permanently remove from database"
                          >
                            <X className="w-3.5 h-3.5" /> Delete Forever
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowBinModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERSONAL AI SALES ASSISTANT DRAWER */}
      <SalesAiAssistantDrawer
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        agentEmail={currentUserEmail}
        orgId={orgId || currentOrgId}
        isAdminView={effectiveIsAdmin}
        excludeEmails={normalizedExcludeEmails}
        initialMode={aiDrawerMode}
        lead={aiTargetLead}
        onLogActivity={logLeadActivity}
      />
    </div>
  )
}

function InboxIcon(props: any) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  )
}
