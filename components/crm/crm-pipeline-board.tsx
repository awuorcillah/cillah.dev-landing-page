'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
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
  { id: 'new_lead', name: 'New Inquiry', color: 'bg-sky-500/10 border-sky-500/30 text-sky-400', badge: 'bg-sky-500' },
  { id: 'repeat_lead', name: 'Repeat Inquiries', color: 'bg-violet-500/10 border-violet-500/30 text-violet-400', badge: 'bg-violet-500' },
  { id: 'hot_lead', name: 'Hot Lead', color: 'bg-amber-500/10 border-amber-500/30 text-amber-400', badge: 'bg-amber-500' },
  { id: 'warm_lead', name: 'Warm Lead', color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400', badge: 'bg-yellow-500' },
  { id: 'viewing', name: 'Booked Consultations', color: 'bg-purple-500/10 border-purple-500/30 text-purple-400', badge: 'bg-purple-500' },
  { id: 'cold_lead', name: 'Cold Lead', color: 'bg-slate-500/10 border-slate-500/30 text-slate-400', badge: 'bg-slate-500' },
  { id: 'spam', name: 'Spam', color: 'bg-red-500/10 border-red-500/30 text-red-400', badge: 'bg-red-500' },
  { id: 'closed_won', name: 'Won Deals', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', badge: 'bg-emerald-500' }
]

interface CRMPipelineBoardProps {
  currentUserEmail?: string
  isStaffAdmin?: boolean
  forceUserOnly?: boolean
  embedded?: boolean
}

export default function CRMPipelineBoard({
  currentUserEmail = 'atulah@cillah.dev',
  isStaffAdmin = true,
  forceUserOnly = false,
  embedded = false
}: CRMPipelineBoardProps) {
  const supabase = createClient()
  const [leads, setLeads] = useState<SalesLead[]>([])
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  const effectiveIsAdmin = isStaffAdmin && !forceUserOnly

  // Filters & State
  const [agentFilter, setAgentFilter] = useState<string>(effectiveIsAdmin ? 'all' : currentUserEmail)
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d' | 'all'>('all')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')

  // Profile Menu Dropdown State
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false)
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

  // Lead Transfer State
  const [targetAgentEmail, setTargetAgentEmail] = useState('')
  const [transferringLead, setTransferringLead] = useState(false)

  // Viewing Date Scheduler State
  const [viewingDateInput, setViewingDateInput] = useState('')
  const [savingViewingDate, setSavingViewingDate] = useState(false)

  // Followup Form State inside Modal
  const [followupChoice, setFollowupChoice] = useState<'1_month' | '3_months' | '1_year' | 'forever' | 'custom'>('1_month')
  const [customDate, setCustomDate] = useState('')
  const [customTitle, setCustomTitle] = useState('')
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
    if (currentStaff?.org_id) return currentStaff.org_id
    if (selectedLead?.assigned_agent_email) {
      const leadAgent = staffMembers.find(
        (s) => s.email?.toLowerCase() === selectedLead.assigned_agent_email?.toLowerCase()
      )
      if (leadAgent?.org_id) return leadAgent.org_id
    }
    return 'a1b2c3d4-e5f6-7890-abcd-222222222222' // cillah.dev default organization
  }, [currentStaff, selectedLead, staffMembers])

  const currentOrg = useMemo(() => {
    return (
      organizations.find((o) => o.id === currentOrgId) || {
        id: currentOrgId,
        name: 'cillah.dev',
        slug: 'cillah-dev'
      }
    )
  }, [organizations, currentOrgId])

  // Agents strictly within our organization
  const orgStaffMembers = useMemo(() => {
    return staffMembers.filter((s) => {
      const inOrg = s.org_id === currentOrgId
      const isSalesRole = s.role === 'sales' || s.role === 'ceo' || s.status === 'admin'
      return inOrg && isSalesRole
    })
  }, [staffMembers, currentOrgId])

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

      if (selectedLead.viewing_date) {
        const dt = new Date(selectedLead.viewing_date)
        const tzOffset = dt.getTimezoneOffset() * 60000
        const localISOTime = (new Date(dt.getTime() - tzOffset)).toISOString().slice(0, 16)
        setViewingDateInput(localISOTime)
      } else {
        setViewingDateInput('')
      }
    }
  }, [selectedLead])

  const handleSaveViewingDate = async () => {
    if (!selectedLead || !viewingDateInput) return
    setSavingViewingDate(true)
    setActionSuccessMsg('')

    const isoViewing = new Date(viewingDateInput).toISOString()
    const updatedFields = {
      viewing_date: isoViewing,
      stage: 'viewing',
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('sales_leads')
      .update(updatedFields)
      .eq('id', selectedLead.id)

    if (!error) {
      const updatedLead = { ...selectedLead, ...updatedFields }
      setSelectedLead(updatedLead)
      setLeads((prev) => prev.map((l) => (l.id === selectedLead.id ? updatedLead : l)))

      await supabase.from('lead_notes').insert({
        lead_id: selectedLead.id,
        author_email: currentUserEmail,
        author_name: currentUserEmail.split('@')[0],
        source: 'consultation_scheduled',
        note_text: `Booked consultation scheduled for ${new Date(viewingDateInput).toLocaleString()}`
      })

      setActionSuccessMsg(`Booked consultation scheduled for ${new Date(viewingDateInput).toLocaleString()}! Stage moved to Booked Consultations.`)
      setTimeout(() => setActionSuccessMsg(''), 4000)
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

  // 1. Fetch Staff & Leads on Mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      // Fetch Staff Members & Organizations
      const [{ data: staffData }, { data: orgData }] = await Promise.all([
        supabase.from('staff_members').select('*'),
        supabase.from('organizations').select('*')
      ])
      if (staffData) setStaffMembers(staffData)
      if (orgData) setOrganizations(orgData)

      // Fetch Sales Leads
      let query = supabase.from('sales_leads').select('*').order('created_at', { ascending: false })

      if (!effectiveIsAdmin) {
        query = query.eq('assigned_agent_email', currentUserEmail)
      } else if (agentFilter !== 'all') {
        query = query.eq('assigned_agent_email', agentFilter)
      }

      const { data: leadsData } = await query
      let combinedLeads: SalesLead[] = leadsData
        ? leadsData.map((l: any) => {
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

      // Also Fetch Stage Properties organization leads assigned to this agent
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
            // Only add if not already in combinedLeads (by phone or id)
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

      setLeads(combinedLeads)
      setLoading(false)
    }

    fetchData()

    // 2. Realtime Subscriptions
    const channel = supabase
      .channel('public:sales_leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_leads' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setLeads((prev) => [payload.new as SalesLead, ...prev])
        } else if (payload.eventType === 'UPDATE') {
          const oldLead = payload.old as SalesLead
          const newLead = payload.new as SalesLead

          setLeads((prev) =>
            prev.map((l) => (l.id === payload.new.id ? (payload.new as SalesLead) : l))
          )
          setSelectedLead((prev) => (prev?.id === payload.new.id ? (payload.new as SalesLead) : prev))

          // 1. Victory Deal Closed Alert
          if (oldLead?.stage !== 'closed_won' && newLead?.stage === 'closed_won') {
            const agentName = newLead.assigned_agent_email?.split('@')[0] || 'Sales Agent'
            const valStr = newLead.estimated_value ? ` for $${Number(newLead.estimated_value).toLocaleString()}` : ''
            toast.success(`🎉 VICTORY DEAL WON! ${agentName} just closed a deal${valStr} with ${newLead.full_name}!`, {
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
  }, [agentFilter, effectiveIsAdmin, currentUserEmail, forceUserOnly])

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

      // Stage Filter
      if (stageFilter !== 'all' && lead.stage !== stageFilter) {
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
  }, [leads, agentFilter, effectiveIsAdmin, stageFilter, timeFilter, searchQuery, currentUserEmail])

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
    const wonDealsCount = activeLeads.filter((l) => l.stage === 'closed_won').length
    const wonDealsValue = activeLeads
      .filter((l) => l.stage === 'closed_won')
      .reduce((sum, l) => sum + (l.estimated_value || 0), 0)

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
    if (valNum !== (selectedLead.estimated_value || 0)) changes.push(`Value to $${valNum.toLocaleString()}`)
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

  // Soft Delete Lead -> Move to Recycle Bin (Trash)
  const handleDeleteLead = async (leadId: string, leadName?: string) => {
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

  // Permanently Delete Lead from Database
  const handlePermanentDelete = async (leadId: string) => {
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

  // Empty Recycle Bin
  const handleEmptyBin = async () => {
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
      setNewNoteText('')
    }
    setAddingNote(false)
  }

  // Update Follow-up Handler
  const handleSaveFollowup = async () => {
    if (!selectedLead) return
    setUpdatingFollowup(true)
    setActionSuccessMsg('')

    try {
      const res = await fetch('/api/leads/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          followup_choice: followupChoice,
          custom_date: followupChoice === 'custom' ? customDate : null,
          followup_title: customTitle || null,
          agent_email: currentUserEmail
        })
      })

      const data = await res.json()
      if (data.success) {
        setActionSuccessMsg('Follow-up schedule updated successfully!')
        setTimeout(() => setActionSuccessMsg(''), 4000)
      }
    } catch (err) {
      console.error('Followup update failed:', err)
    } finally {
      setUpdatingFollowup(false)
    }
  }

  // WhatsApp Link Builder
  const getWhatsAppLink = (phone: string | null) => {
    if (!phone) return '#'
    const cleanPhone = phone.replace(/[^0-9]/g, '')
    return `https://wa.me/${cleanPhone}`
  }

  // Overdue check
  const isOverdue = (nextFollowup: string | null) => {
    if (!nextFollowup) return false
    return new Date(nextFollowup) < new Date()
  }

  return (
    <div className={`w-full ${embedded ? 'bg-transparent p-0' : 'min-h-screen bg-[#0E131F] p-3 sm:p-6 md:p-8'} text-slate-100 font-sans`}>
      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 md:mb-8 border-b border-slate-800 pb-5 md:pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-[#C9A66B] flex-shrink-0" />
              <span>{forceUserOnly ? 'My Sales Pipeline' : 'Sales Engine & CRM Pipeline'}</span>
            </h1>
            <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 bg-[#C9A66B]/20 text-[#C9A66B] text-[10px] sm:text-xs font-semibold rounded-full border border-[#C9A66B]/30 uppercase whitespace-nowrap">
              {forceUserOnly ? 'Personal Pipeline' : effectiveIsAdmin ? 'Admin Control (All Agents)' : 'Sales Workspace'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Logged in as <span className="text-slate-200 font-medium">{currentUserEmail}</span>
          </p>
        </div>

        {/* CONTROLS: AGENT FILTER & VIEW MODE */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Staff Admin Agent Switcher (Strictly Organization Agents) */}
          {effectiveIsAdmin && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs">
              <UserCheck className="w-4 h-4 text-[#C9A66B]" />
              <span className="text-slate-400">Agent:</span>
              <select
                value={agentFilter}
                onChange={(e) => setAgentFilter(e.target.value)}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All {currentOrg.name} Agents</option>
                {orgStaffMembers.map((agent) => (
                  <option key={agent.id} value={agent.email} className="bg-slate-900 text-white">
                    {agent.full_name} ({agent.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Add Lead Quick Button */}
          <button
            onClick={() => {
              setAddStage('new_lead')
              setAddAssignedAgentEmail(currentUserEmail)
              setShowAddLeadModal(true)
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#C9A66B] hover:bg-[#C9A66B]/90 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-[#C9A66B]/25 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Lead
          </button>

          {/* Recycle Bin (Trash) Button */}
          <button
            onClick={() => setShowBinModal(true)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              trashLeads.length > 0
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700/80 hover:text-white'
            }`}
            title="Recycle Bin (Deleted Contacts)"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bin</span>
            {trashLeads.length > 0 && (
              <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold">
                {trashLeads.length}
              </span>
            )}
          </button>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-[#C9A66B] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Kanban Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-[#C9A66B] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" /> Table View
            </button>
          </div>

          {/* User Profile Avatar Dropdown Menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileMenuOpen((prev) => !prev)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-[#C9A66B]/60 transition-all text-xs shadow-md"
            >
              <div className="w-6 h-6 rounded-full bg-[#C9A66B]/20 border border-[#C9A66B]/50 flex items-center justify-center font-bold text-[#C9A66B] text-[11px] uppercase">
                {currentUserEmail[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-slate-200 font-semibold hidden sm:inline">{currentUserEmail.split('@')[0]}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileMenuOpen ? 'rotate-180 text-[#C9A66B]' : ''}`} />
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 top-12 w-52 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl z-50 overflow-hidden text-xs divide-y divide-slate-800">
                <div className="px-4 py-3 bg-slate-950/60">
                  <p className="font-semibold text-white truncate">{currentUserEmail.split('@')[0]}</p>
                  <p className="text-[10px] text-slate-400 truncate">{currentUserEmail}</p>
                </div>
                <div className="py-1.5">
                  <Link
                    href="/user/profile"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/admin/dashboard"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/pipeline"
                    onClick={() => setProfileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-[#C9A66B] font-bold hover:bg-slate-800 transition-colors"
                  >
                    Sales Pipeline
                  </Link>
                </div>
                <div className="py-1.5">
                  <button
                    onClick={async () => {
                      setProfileMenuOpen(false)
                      await supabase.auth.signOut()
                      window.location.href = '/login'
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-red-400 hover:bg-red-500/10 font-medium transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* METRICS ROW - HORIZONTAL SWIPEABLE ON MOBILE */}
      <div className="flex overflow-x-auto pb-3 pt-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 md:mb-8 scrollbar-none snap-x snap-mandatory">
        <div className="min-w-[210px] sm:min-w-0 flex-1 snap-start bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3 sm:gap-4 flex-shrink-0 sm:flex-shrink">
          <div className="p-2.5 sm:p-3 bg-sky-500/10 text-sky-400 rounded-xl border border-sky-500/20 flex-shrink-0">
            <InboxIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-white">{metrics.newToday}</div>
            <div className="text-[11px] sm:text-xs text-slate-400 font-medium">New Leads (24h)</div>
          </div>
        </div>

        <div className="min-w-[210px] sm:min-w-0 flex-1 snap-start bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3 sm:gap-4 flex-shrink-0 sm:flex-shrink">
          <div className="p-2.5 sm:p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20 flex-shrink-0">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-amber-400">{metrics.hotLeads}</div>
            <div className="text-[11px] sm:text-xs text-slate-400 font-medium">Hot Leads</div>
          </div>
        </div>

        <div className="min-w-[210px] sm:min-w-0 flex-1 snap-start bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3 sm:gap-4 flex-shrink-0 sm:flex-shrink">
          <div className="p-2.5 sm:p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20 flex-shrink-0">
            <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-purple-300">{metrics.upcomingAppointments}</div>
            <div className="text-[11px] sm:text-xs text-slate-400 font-medium">Upcoming Follow-ups</div>
          </div>
        </div>

        <div className="min-w-[210px] sm:min-w-0 flex-1 snap-start bg-slate-900/90 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 shadow-lg flex items-center gap-3 sm:gap-4 flex-shrink-0 sm:flex-shrink">
          <div className="p-2.5 sm:p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 flex-shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              ${metrics.wonDealsValue.toLocaleString()}
            </div>
            <div className="text-[11px] sm:text-xs text-slate-400 font-medium">
              Won Deals ({metrics.wonDealsCount})
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search lead by name, phone, email, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/70 text-slate-100 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#C9A66B]"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
            {(['all', '24h', '7d', '30d'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                  timeFilter === t ? 'bg-slate-800 text-[#C9A66B] font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {t === 'all' ? 'All Time' : t}
              </button>
            ))}
          </div>

          {/* Stage Filter Dropdown */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Stages</option>
              {STAGES.map((st) => (
                <option key={st.id} value={st.id} className="bg-slate-900">
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KANBAN BOARD VIEW */}
      {viewMode === 'kanban' && (
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-8 -mx-3 px-3 sm:mx-0 sm:px-0 items-start snap-x snap-mandatory scrollbar-thin">
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stage.id)

            return (
              <div
                key={stage.id}
                className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 flex flex-col min-h-[500px] w-[84vw] max-w-[320px] sm:w-[290px] sm:max-w-none flex-shrink-0 snap-center sm:snap-align-none"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const leadId = e.dataTransfer.getData('leadId')
                  if (leadId) handleStageChange(leadId, stage.id)
                }}
              >
                {/* Column Header */}
                <div className={`p-3 rounded-xl border ${stage.color} mb-4 flex items-center justify-between`}>
                  <span className="font-bold text-xs uppercase tracking-wider">{stage.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full bg-slate-950/80">
                      {stageLeads.length}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setAddStage(stage.id)
                        setAddAssignedAgentEmail(currentUserEmail)
                        setShowAddLeadModal(true)
                      }}
                      title={`Add lead directly to ${stage.name}`}
                      className="p-1 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                            {lead.source?.replace('_', ' ')}
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

                        {/* Display Booked Consultation Date Badge */}
                        {lead.viewing_date && (
                          <div className="text-[11px] text-purple-300 font-semibold flex items-center gap-1.5 mt-2 bg-purple-500/10 px-2 py-1 rounded-md border border-purple-500/25">
                            <Calendar className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                            <span className="truncate">Consultation: {new Date(lead.viewing_date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}

                        {/* Estimated Value */}
                        {lead.estimated_value > 0 && (
                          <div className="text-xs font-semibold text-emerald-400 mt-2">
                            ${lead.estimated_value.toLocaleString()}
                          </div>
                        )}

                        {/* Agent Assignment */}
                        <div className="text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-900 flex items-center justify-between">
                          <span>{lead.assigned_agent_email?.split('@')[0] || 'Unassigned'}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(lead.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        {/* 1-CLICK QUICK ACTION COMMUNICATION ICONS */}
                        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-900">
                          {lead.phone_number && (
                            <a
                              href={getWhatsAppLink(lead.phone_number)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              title="Chat on WhatsApp"
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {lead.phone_number && (
                            <a
                              href={`tel:${lead.phone_number}`}
                              onClick={(e) => e.stopPropagation()}
                              title="Call Lead"
                              className="p-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-lg transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              onClick={(e) => e.stopPropagation()}
                              title="Send Email"
                              className="p-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg transition-colors"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                          )}

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

                          {/* Move to Recycle Bin */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteLead(lead.id, lead.full_name)
                            }}
                            title="Move to Recycle Bin"
                            className="p-1.5 bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Stage Move Dropdown */}
                          <select
                            value={lead.stage}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleStageChange(lead.id, e.target.value)}
                            className="ml-auto bg-slate-900 border border-slate-800 text-[10px] text-slate-300 rounded-lg px-1.5 py-1 focus:outline-none cursor-pointer"
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

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
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
                  <td className="p-4 text-slate-300">{lead.assigned_agent_email || 'Unassigned'}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {lead.phone_number && (
                        <a
                          href={getWhatsAppLink(lead.phone_number)}
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
                          href={`mailto:${lead.email}`}
                          onClick={(e) => e.stopPropagation()}
                          title="Send Email"
                          className="p-1.5 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
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
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteLead(lead.id, lead.full_name)
                        }}
                        title="Move to Recycle Bin"
                        className="p-1.5 bg-slate-950 text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                        href={`mailto:${selectedLead.email}`}
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
              <div className="grid grid-cols-3 gap-3 mb-6">
                {selectedLead.phone_number ? (
                  <a
                    href={getWhatsAppLink(selectedLead.phone_number)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition-all"
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
                    className="flex items-center justify-center gap-2 py-2.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 rounded-xl text-xs font-bold transition-all"
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
                    href={`mailto:${selectedLead.email}`}
                    className="flex items-center justify-center gap-2 py-2.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-400 rounded-xl text-xs font-bold transition-all"
                  >
                    <Mail className="w-4 h-4" /> Send Email
                  </a>
                ) : (
                  <button disabled className="py-2.5 bg-slate-900 text-slate-600 rounded-xl text-xs font-bold opacity-50 cursor-not-allowed">
                    No Email
                  </button>
                )}
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
                      <button
                        type="button"
                        onClick={() => handleDeleteLead(selectedLead.id, selectedLead.full_name)}
                        className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Move to Bin
                      </button>
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
                      <span className="text-emerald-400 font-bold block">${(selectedLead.estimated_value || 0).toLocaleString()}</span>
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
                  <p className="text-[10px] text-slate-500 mt-1">
                    Restricted to members of <span className="text-slate-300 font-medium">{currentOrg.name}</span>. Transferring sets Lead Source to <span className="text-[#C9A66B] font-semibold">{currentUserEmail}</span>.
                  </p>
                </div>
              </div>

              {/* SUPER ADMIN DELETE BUTTON */}
              {isSuperAdmin && (
                <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
                  <span className="text-xs text-red-400 font-medium">Super Admin Actions</span>
                  <button
                    type="button"
                    onClick={() => selectedLead && handleDeleteLead(selectedLead.id, selectedLead.full_name)}
                    className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-bold rounded-lg border border-red-500/30 transition-colors cursor-pointer"
                  >
                    Move to Bin
                  </button>
                </div>
              )}

              {/* SCHEDULE BOOKED CONSULTATION & STRATEGY CALL SECTION */}
              <div className="bg-slate-900/80 border border-purple-500/25 rounded-2xl p-5 mb-6">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" /> Booked Consultations & Strategy Call Scheduler
                </h4>
                <p className="text-[11px] text-slate-400 mb-3">
                  Schedule a booked consultation, discovery call, or strategy meeting date for this lead.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="datetime-local"
                    value={viewingDateInput}
                    onChange={(e) => setViewingDateInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 text-xs text-white rounded-xl p-2.5 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleSaveViewingDate}
                    disabled={savingViewingDate || !viewingDateInput}
                    className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-all disabled:opacity-50 shadow-md flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Calendar className="w-4 h-4" /> {savingViewingDate ? 'Scheduling...' : 'Save Booked Consultation'}
                  </button>
                </div>
              </div>

              {/* FOLLOW-UP CLOSURE & SCHEDULER SECTION */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-6">
                <h4 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#C9A66B]" /> Follow-Up Scheduler & Closure
                </h4>

                {/* Preset Choices */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {[
                    { id: '1_month', label: '1 Month' },
                    { id: '3_months', label: '3 Months' },
                    { id: '1_year', label: '1 Year' },
                    { id: 'forever', label: 'Forever (Close)' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setFollowupChoice(p.id as any)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-colors ${
                        followupChoice === p.id
                          ? 'bg-[#C9A66B] text-slate-950 border-[#C9A66B]'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Option Toggle */}
                <button
                  onClick={() => setFollowupChoice('custom')}
                  className={`w-full py-2 mb-3 text-xs font-bold rounded-xl border transition-colors ${
                    followupChoice === 'custom'
                      ? 'bg-[#C9A66B] text-slate-950 border-[#C9A66B]'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  📆 Custom Date & Time Picker
                </button>

                {/* Custom Form Fields */}
                {followupChoice === 'custom' && (
                  <div className="space-y-3 mb-4 bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Follow-up Reason / Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Call back after client reviews AI proposal"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">Date & Time</label>
                      <input
                        type="datetime-local"
                        value={customDate}
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-lg p-2 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleSaveFollowup}
                  disabled={updatingFollowup}
                  className="w-full py-2.5 bg-[#C9A66B] text-slate-950 font-bold rounded-xl text-xs hover:bg-[#C9A66B]/90 transition-all shadow-md"
                >
                  {updatingFollowup ? 'Saving Schedule...' : 'Save Follow-Up Schedule'}
                </button>
              </div>

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
                          <p className="text-slate-200 leading-relaxed">{note.note_text}</p>
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
                    <option value="email_campaign">Email Campaign</option>
                    <option value="website_enquiry">Website Enquiry</option>
                    <option value="whatsapp">WhatsApp Inbound</option>
                    <option value="instagram_dm">Instagram DM</option>
                    <option value="facebook_ad">Facebook Ad</option>
                    <option value="phone_call">Phone Call</option>
                    <option value="referral">Referral</option>
                    <option value="direct_outreach">Direct Outreach</option>
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
