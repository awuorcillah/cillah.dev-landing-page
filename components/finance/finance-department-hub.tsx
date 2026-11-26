"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Plus,
  Send,
  Copy,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  ExternalLink,
  Mail,
  MessageCircle,
  MessageSquare,
  X,
  Loader2,
  Search,
  Receipt,
  ArrowDownLeft,
  ArrowUpRight,
  Repeat,
  Users,
  Wallet,
  Trash2,
  Sparkles,
  AlertCircle,
} from "lucide-react"
import { toast } from "sonner"

export interface FinanceInvoice {
  id: string
  org_id: string
  org_slug: string
  lead_id: string | null
  invoice_number: string
  public_token: string
  client_name: string
  client_email: string | null
  client_phone: string | null
  client_company: string | null
  title: string
  description: string | null
  invoice_type: string
  amount_kes: number
  currency: string
  allowed_methods: string[]
  contract_url: string | null
  contract_name: string | null
  contract_notes: string | null
  status: string
  payment_method: string | null
  payment_reference: string | null
  paid_amount: number | null
  paid_at: string | null
  due_date: string | null
  sent_via: string[]
  sent_at: string | null
  is_demo_seed: boolean
  created_by_email: string
  created_at: string
}

interface InflowEntry {
  id: string
  source: "invoice" | "consultation"
  client_name: string
  title: string
  amount_kes: number
  payment_method: string
  reference: string
  paid_at: string
  is_today: boolean
}

interface OutflowEntry {
  id: string
  entry_type: "subscription" | "salary" | "expense"
  title: string
  vendor_or_person: string | null
  category: string
  amount_kes: number
  billing_cycle: string
  status: string
  occurred_on: string
  payment_method: string
  notes: string | null
  is_demo_seed: boolean
}

interface OrgLeadOption {
  id: string
  full_name: string
  email: string | null
  phone_number: string | null
  company_name: string | null
  stage: string
  estimated_value: number | null
}

type FinanceTab = "inflow" | "invoices" | "subscriptions" | "salary" | "expenses"

interface FinanceDepartmentHubProps {
  orgSlug: string
  orgName: string
  isDemoOrg?: boolean
  showManageUsersLink?: boolean
}

const formatKES = (n: number) =>
  `KES ${Math.round(Number(n) || 0).toLocaleString("en-KE")}`

export default function FinanceDepartmentHub({
  orgSlug,
  orgName,
  isDemoOrg = false,
}: FinanceDepartmentHubProps) {
  const supabase = createClient()

  const [activeTab, setActiveTab] = useState<FinanceTab>("inflow")
  const [inflowScope, setInflowScope] = useState<"today" | "all">("today")
  const [invoiceFilter, setInvoiceFilter] = useState<"all" | "unpaid" | "payment_made">("all")
  const [search, setSearch] = useState("")

  const [loading, setLoading] = useState(true)
  const [outflowsSchemaPending, setOutflowsSchemaPending] = useState(false)
  const [invoices, setInvoices] = useState<FinanceInvoice[]>([])
  const [inflowEntries, setInflowEntries] = useState<InflowEntry[]>([])
  const [outflows, setOutflows] = useState<OutflowEntry[]>([])
  const [leads, setLeads] = useState<OrgLeadOption[]>([])
  const [kpis, setKpis] = useState({
    totalCollectedKes: 0,
    todayInflowKes: 0,
    totalOutflowKes: 0,
    netCashflowKes: 0,
    pendingAmountKes: 0,
    paidCount: 0,
    unpaidCount: 0,
    subscriptionsMonthlyKes: 0,
    salaryTotalKes: 0,
    expensesTotalKes: 0,
  })

  // Create Invoice (Pay Now) Modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState("")
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientCompany, setClientCompany] = useState("")
  const [title, setTitle] = useState("")
  const [invoiceType, setInvoiceType] = useState("deposit")
  const [amountKes, setAmountKes] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [allowMpesa, setAllowMpesa] = useState(true)
  const [allowCard, setAllowCard] = useState(true)
  const [contractNotes, setContractNotes] = useState("")
  const [contractUrl, setContractUrl] = useState("")
  const [contractName, setContractName] = useState("")
  const [uploadingContract, setUploadingContract] = useState(false)
  const [creatingInvoice, setCreatingInvoice] = useState(false)

  // Send Pay Now Link Modal
  const [sendTarget, setSendTarget] = useState<FinanceInvoice | null>(null)
  const [customSendMessage, setCustomSendMessage] = useState("")
  const [sendingChannel, setSendingChannel] = useState<"email" | "whatsapp" | "sms" | null>(null)

  // Add Outflow Modal (Subscription / Salary / Expense)
  const [outflowModalType, setOutflowModalType] = useState<
    "subscription" | "salary" | "expense" | null
  >(null)
  const [outTitle, setOutTitle] = useState("")
  const [outVendor, setOutVendor] = useState("")
  const [outCategory, setOutCategory] = useState("Software")
  const [outAmount, setOutAmount] = useState("")
  const [outDate, setOutDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [outMethod, setOutMethod] = useState("mpesa")
  const [outStatus, setOutStatus] = useState("paid")
  const [outNotes, setOutNotes] = useState("")
  const [savingOutflow, setSavingOutflow] = useState(false)

  const fetchFinanceData = useCallback(async () => {
    try {
      const res = await fetch(`/api/finance/invoices?orgSlug=${encodeURIComponent(orgSlug)}`, {
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not load finance")
        return
      }
      setOutflowsSchemaPending(Boolean(data.outflowsSchemaPending))
      setInvoices(data.invoices || [])
      setInflowEntries(data.inflowEntries || [])
      setOutflows(data.outflows || [])
      setLeads(data.leads || [])
      if (data.kpis) setKpis(data.kpis)
    } catch (err: any) {
      toast.error(err?.message || "Failed to load finance")
    } finally {
      setLoading(false)
    }
  }, [orgSlug])

  useEffect(() => {
    fetchFinanceData()
    // Live realtime listener: immediately updates Invoice Paid + Inflow when client pays!
    const channel = supabase
      .channel(`finance_live_${orgSlug}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "finance_invoices" }, () => {
        fetchFinanceData()
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "finance_outflows" }, () => {
        fetchFinanceData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchFinanceData, orgSlug, supabase])

  const getPayUrl = (token: string) =>
    typeof window === "undefined"
      ? `https://www.cillah.dev/pay/${token}`
      : `${window.location.origin}/pay/${token}`

  const handleSelectLead = (leadId: string) => {
    setSelectedLeadId(leadId)
    const found = leads.find((l) => l.id === leadId)
    if (found) {
      setClientName(found.full_name || "")
      setClientEmail(found.email || "")
      setClientPhone(found.phone_number || "")
      setClientCompany(found.company_name || "")
      if (found.estimated_value && Number(found.estimated_value) > 0 && !amountKes) {
        setAmountKes(String(found.estimated_value))
      }
      if (!title) {
        setTitle(found.company_name || `Project — ${found.full_name}`)
      }
    }
  }

  const handleContractUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingContract(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("orgSlug", orgSlug)
      fd.append("docType", "contract")
      fd.append("title", file.name)
      const res = await fetch("/api/finance/upload-document", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok || !data.file?.url) throw new Error(data.error || "Upload failed")
      setContractUrl(data.file.url)
      setContractName(data.file.name)
      toast.success(`Attached "${data.file.name}"`)
    } catch (err: any) {
      toast.error(err?.message || "Upload failed")
    } finally {
      setUploadingContract(false)
      e.target.value = ""
    }
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    const allowedMethods = [
      ...(allowMpesa ? ["mpesa"] : []),
      ...(allowCard ? ["card"] : []),
    ]
    if (allowedMethods.length === 0) {
      toast.error("Select M-Pesa or Card.")
      return
    }
    setCreatingInvoice(true)
    try {
      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgSlug,
          leadId: selectedLeadId || null,
          clientName,
          clientEmail,
          clientPhone,
          clientCompany,
          title,
          invoiceType,
          amountKes: Number(amountKes),
          allowedMethods,
          contractUrl: contractUrl || null,
          contractName: contractName || null,
          contractNotes: contractNotes || null,
          dueDate: dueDate || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.invoice) throw new Error(data.error || "Could not create invoice")

      toast.success(`Invoice ${data.invoice.invoice_number} ready!`)
      setShowInvoiceModal(false)
      setSendTarget(data.invoice)
      setCustomSendMessage("")
      setActiveTab("invoices")

      setSelectedLeadId("")
      setClientName("")
      setClientEmail("")
      setClientPhone("")
      setClientCompany("")
      setTitle("")
      setAmountKes("")
      setContractUrl("")
      setContractName("")
      setContractNotes("")
      setDueDate("")
      await fetchFinanceData()
    } catch (err: any) {
      toast.error(err?.message || "Failed to create invoice")
    } finally {
      setCreatingInvoice(false)
    }
  }

  const handleDispatchChannel = async (
    inv: FinanceInvoice,
    channel: "email" | "whatsapp" | "sms"
  ) => {
    setSendingChannel(channel)
    try {
      const res = await fetch("/api/finance/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: inv.id,
          channel,
          customMessage: customSendMessage.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send")

      if (data.deliveredDirectly) {
        toast.success(data.deliveryNote || `Sent via ${channel.toUpperCase()}`)
      } else if (channel === "whatsapp") {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer")
      } else if (channel === "email") {
        window.open(data.gmailComposeUrl, "_blank", "noopener,noreferrer")
      } else {
        await navigator.clipboard.writeText(data.plainMessage).catch(() => {})
        window.location.href = data.smsUrl
        toast.success("SMS opened & link copied")
      }
      fetchFinanceData()
    } catch (err: any) {
      toast.error(err?.message || "Failed to send")
    } finally {
      setSendingChannel(null)
    }
  }

  const openOutflowModal = (type: "subscription" | "salary" | "expense") => {
    setOutflowModalType(type)
    setOutTitle("")
    setOutVendor("")
    setOutAmount("")
    setOutNotes("")
    setOutDate(new Date().toISOString().slice(0, 10))
    setOutCategory(
      type === "subscription" ? "Software" : type === "salary" ? "Payroll" : "Operations"
    )
    setOutStatus(type === "subscription" ? "active" : "paid")
    setOutMethod(type === "subscription" ? "card" : type === "salary" ? "bank" : "mpesa")
  }

  const handleSaveOutflow = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!outflowModalType) return
    setSavingOutflow(true)
    try {
      const res = await fetch("/api/finance/outflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgSlug,
          entryType: outflowModalType,
          title: outTitle,
          vendorOrPerson: outVendor,
          category: outCategory,
          amountKes: Number(outAmount),
          billingCycle:
            outflowModalType === "subscription" || outflowModalType === "salary"
              ? "monthly"
              : "one_time",
          status: outStatus,
          occurredOn: outDate,
          paymentMethod: outMethod,
          notes: outNotes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save")
      toast.success("Saved!")
      setOutflowModalType(null)
      await fetchFinanceData()
    } catch (err: any) {
      toast.error(err?.message || "Could not save")
    } finally {
      setSavingOutflow(false)
    }
  }

  const toggleOutflowStatus = async (item: OutflowEntry) => {
    const nextStatus =
      item.entry_type === "subscription"
        ? item.status === "active"
          ? "paused"
          : "active"
        : item.status === "paid"
        ? "pending"
        : "paid"

    const res = await fetch("/api/finance/outflows", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgSlug, id: item.id, status: nextStatus }),
    })
    if (res.ok) {
      toast.success(`Marked ${nextStatus}`)
      fetchFinanceData()
    }
  }

  const deleteOutflow = async (id: string) => {
    const res = await fetch(
      `/api/finance/outflows?id=${encodeURIComponent(id)}&orgSlug=${encodeURIComponent(orgSlug)}`,
      { method: "DELETE" }
    )
    if (res.ok) {
      toast.success("Removed")
      fetchFinanceData()
    }
  }

  const filteredInflow = useMemo(() => {
    return inflowEntries.filter((e) => {
      if (inflowScope === "today" && !e.is_today) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return `${e.client_name} ${e.title} ${e.reference}`.toLowerCase().includes(q)
      }
      return true
    })
  }, [inflowEntries, inflowScope, search])

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (invoiceFilter === "payment_made" && inv.status !== "payment_made") return false
      if (invoiceFilter === "unpaid" && inv.status === "payment_made") return false
      if (search.trim()) {
        const q = search.toLowerCase()
        return `${inv.invoice_number} ${inv.client_name} ${inv.title}`.toLowerCase().includes(q)
      }
      return true
    })
  }, [invoices, invoiceFilter, search])

  const subscriptions = useMemo(
    () => outflows.filter((o) => o.entry_type === "subscription"),
    [outflows]
  )
  const salaries = useMemo(
    () => outflows.filter((o) => o.entry_type === "salary"),
    [outflows]
  )
  const expenses = useMemo(
    () => outflows.filter((o) => o.entry_type === "expense"),
    [outflows]
  )

  const TABS: Array<{ id: FinanceTab; label: string; icon: any }> = [
    { id: "inflow", label: "Inflow", icon: ArrowDownLeft },
    { id: "invoices", label: "Invoices", icon: Receipt },
    { id: "subscriptions", label: "Subscriptions", icon: Repeat },
    { id: "salary", label: "Salary", icon: Users },
    { id: "expenses", label: "Expenses", icon: ArrowUpRight },
  ]

  return (
    <div className="min-h-screen bg-[#090B12] text-slate-100 px-3 pt-3 pb-10 sm:p-5 md:p-6 space-y-4 font-sans">
      {/* 1. COMPACT CASHFLOW STRIP (INFLOW | OUTFLOW | NET) — ZERO CLUTTER */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("inflow")}
          className="text-left p-3 sm:p-4 rounded-2xl bg-[#0F1422] border border-emerald-500/25 hover:border-emerald-400/50 transition-all cursor-pointer"
        >
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
            Inflow
          </span>
          <span className="text-sm sm:text-xl font-black text-white font-mono block mt-1 truncate">
            {formatKES(kpis.totalCollectedKes)}
          </span>
          <span className="text-[10px] text-emerald-300/80 block mt-0.5 truncate">
            Today: {formatKES(kpis.todayInflowKes)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("expenses")}
          className="text-left p-3 sm:p-4 rounded-2xl bg-[#0F1422] border border-rose-500/20 hover:border-rose-400/50 transition-all cursor-pointer"
        >
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-400 block">
            Outflow
          </span>
          <span className="text-sm sm:text-xl font-black text-white font-mono block mt-1 truncate">
            {formatKES(kpis.totalOutflowKes)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
            Subs · Salary · Exp
          </span>
        </button>

        <div className="p-3 sm:p-4 rounded-2xl bg-[#0F1422] border border-[#C9A66B]/30">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#C9A66B] block">
            Net
          </span>
          <span
            className={`text-sm sm:text-xl font-black font-mono block mt-1 truncate ${
              kpis.netCashflowKes >= 0 ? "text-[#E5C687]" : "text-rose-400"
            }`}
          >
            {formatKES(kpis.netCashflowKes)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
            {isDemoOrg ? `${orgName} Demo` : orgName}
          </span>
        </div>
      </div>

      {/* 2. TOP ACTION ROW: + Pay Now / Invoice + CLEAN MODULE TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setShowInvoiceModal(true)}
          className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-[#C9A66B] hover:bg-[#d8b77c] active:scale-[0.97] text-slate-950 font-black text-xs shrink-0 shadow-md shadow-[#C9A66B]/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Pay Now</span>
        </button>

        {TABS.map((t) => {
          const Icon = t.icon
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setActiveTab(t.id)
                setSearch("")
              }}
              className={`inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl border text-xs font-bold shrink-0 transition-all cursor-pointer ${
                active
                  ? "bg-white/[0.1] border-[#C9A66B]/70 text-white"
                  : "bg-[#0F1422] border-white/10 text-slate-400 hover:text-white"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? "text-[#C9A66B]" : ""}`} />
              <span>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* OPTIONAL SQL NOTICE ONLY WHEN OUTFLOWS TABLE NOT YET CREATED */}
      {outflowsSchemaPending &&
        (activeTab === "subscriptions" ||
          activeTab === "salary" ||
          activeTab === "expenses") && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/35 flex items-start gap-2.5 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Run <code className="text-amber-300">supabase/finance_outflows_schema.sql</code> in
              Supabase SQL Editor once to enable Subscriptions, Salary &amp; Expenses.
            </span>
          </div>
        )}

      {/* 3. TAB CONTENT */}
      {loading ? (
        <div className="py-16 flex items-center justify-center gap-2 text-xs text-[#C9A66B]">
          <Sparkles className="w-4 h-4 animate-spin" /> Loading...
        </div>
      ) : (
        <>
          {/* ===================== TAB 1: INFLOW ===================== */}
          {activeTab === "inflow" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex bg-[#0F1422] border border-white/10 rounded-xl p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setInflowScope("today")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      inflowScope === "today"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Today ({formatKES(kpis.todayInflowKes)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setInflowScope("all")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      inflowScope === "all"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    All ({inflowEntries.length})
                  </button>
                </div>

                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search inflow..."
                    className="w-full bg-[#0F1422] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
              </div>

              {filteredInflow.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#0F1422] border border-white/[0.07] text-center space-y-2">
                  <p className="text-sm font-bold text-slate-200">
                    {inflowScope === "today" ? "KES 0 received today" : "No inflow recorded yet"}
                  </p>
                  {inflowScope === "today" && inflowEntries.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setInflowScope("all")}
                      className="text-xs text-[#C9A66B] font-semibold hover:underline cursor-pointer"
                    >
                      View all {inflowEntries.length} payments →
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredInflow.map((entry) => (
                    <div
                      key={`${entry.source}-${entry.id}`}
                      className="p-3.5 rounded-2xl bg-[#0F1422] border border-white/[0.08] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">
                            {entry.client_name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold shrink-0">
                            {entry.payment_method}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{entry.title}</p>
                        <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                          Ref: {entry.reference} &bull;{" "}
                          {new Date(entry.paid_at).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <span className="text-sm sm:text-base font-black font-mono text-emerald-400 shrink-0">
                        +{formatKES(entry.amount_kes)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 2: INVOICES ===================== */}
          {activeTab === "invoices" && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex bg-[#0F1422] border border-white/10 rounded-xl p-1 text-xs">
                  {(
                    [
                      { id: "all", label: `All (${invoices.length})` },
                      { id: "unpaid", label: `Unpaid (${kpis.unpaidCount})` },
                      { id: "payment_made", label: "Invoice Paid" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setInvoiceFilter(f.id)}
                      className={`px-2.5 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                        invoiceFilter === f.id
                          ? "bg-[#C9A66B] text-slate-950"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="relative flex-1 min-w-[160px] max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search invoice..."
                    className="w-full bg-[#0F1422] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
              </div>

              {filteredInvoices.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#0F1422] border border-white/[0.07] text-center space-y-3">
                  <p className="text-sm font-bold text-slate-200">No invoices yet</p>
                  <button
                    type="button"
                    onClick={() => setShowInvoiceModal(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A66B] text-slate-950 font-black text-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Invoice
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredInvoices.map((inv) => {
                    const isPaid = inv.status === "payment_made"
                    return (
                      <div
                        key={inv.id}
                        className="p-4 rounded-2xl bg-[#0F1422] border border-white/[0.08] space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-[#E5C687]">
                                {inv.invoice_number}
                              </span>
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                                  <CheckCircle2 className="w-3 h-3" /> Invoice Paid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[10px] font-bold">
                                  <Clock className="w-3 h-3" /> Unpaid
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-sm text-white mt-1 truncate">
                              {inv.client_name}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{inv.title}</p>
                            {inv.payment_reference && (
                              <p className="text-[10px] font-mono text-emerald-400 mt-0.5">
                                Ref: {inv.payment_reference}
                              </p>
                            )}
                          </div>
                          <span className="font-mono font-black text-base text-white shrink-0">
                            {formatKES(inv.paid_amount || inv.amount_kes)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-white/[0.06]">
                          <button
                            type="button"
                            onClick={() => {
                              setSendTarget(inv)
                              setCustomSendMessage("")
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C9A66B]/15 hover:bg-[#C9A66B]/25 border border-[#C9A66B]/40 text-[#E5C687] font-bold text-xs cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" /> Send Pay Now
                          </button>

                          {inv.contract_url && (
                            <a
                              href={inv.contract_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-300 text-xs font-semibold"
                            >
                              <FileText className="w-3.5 h-3.5" /> Contract
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={async () => {
                              await navigator.clipboard.writeText(getPayUrl(inv.public_token))
                              toast.success("Pay Now link copied!")
                            }}
                            className="p-2 rounded-xl bg-slate-950 border border-white/10 text-slate-300 cursor-pointer"
                            title="Copy Pay Now Link"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`/pay/${inv.public_token}`}
                            target="_blank"
                            rel="noreferrer"
                            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-slate-300 hover:text-[#C9A66B]"
                          >
                            Pay Page <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 3: SUBSCRIPTIONS ===================== */}
          {activeTab === "subscriptions" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    Monthly Total
                  </span>
                  <p className="text-lg font-black font-mono text-white">
                    {formatKES(kpis.subscriptionsMonthlyKes)}
                    <span className="text-xs font-normal text-slate-400"> / mo</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openOutflowModal("subscription")}
                  className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-[#C9A66B] text-slate-950 font-black text-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Subscription
                </button>
              </div>

              {subscriptions.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#0F1422] border border-white/[0.07] text-center text-xs text-slate-400">
                  No monthly subscriptions added yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3.5 rounded-2xl bg-[#0F1422] border border-white/[0.08] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">{sub.title}</span>
                          <button
                            type="button"
                            onClick={() => toggleOutflowStatus(sub)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase cursor-pointer ${
                              sub.status === "active"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {sub.status}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {sub.vendor_or_person || sub.category} &bull; {sub.payment_method.toUpperCase()} &bull; {sub.occurred_on}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-black text-sm text-rose-300">
                          -{formatKES(sub.amount_kes)}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteOutflow(sub.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 4: SALARY ===================== */}
          {activeTab === "salary" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    Paid Payroll
                  </span>
                  <p className="text-lg font-black font-mono text-white">
                    {formatKES(kpis.salaryTotalKes)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openOutflowModal("salary")}
                  className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-[#C9A66B] text-slate-950 font-black text-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Salary
                </button>
              </div>

              {salaries.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#0F1422] border border-white/[0.07] text-center text-xs text-slate-400">
                  No salaries recorded yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {salaries.map((sal) => (
                    <div
                      key={sal.id}
                      className="p-3.5 rounded-2xl bg-[#0F1422] border border-white/[0.08] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">
                            {sal.vendor_or_person || sal.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleOutflowStatus(sal)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase cursor-pointer ${
                              sal.status === "paid"
                                ? "bg-emerald-500/15 text-emerald-300"
                                : "bg-amber-500/15 text-amber-300"
                            }`}
                          >
                            {sal.status}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {sal.title} &bull; {sal.occurred_on}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-black text-sm text-rose-300">
                          -{formatKES(sal.amount_kes)}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteOutflow(sal.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================== TAB 5: EXPENSES ===================== */}
          {activeTab === "expenses" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                    Total Expenses
                  </span>
                  <p className="text-lg font-black font-mono text-white">
                    {formatKES(kpis.expensesTotalKes)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => openOutflowModal("expense")}
                  className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-[#C9A66B] text-slate-950 font-black text-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Expense
                </button>
              </div>

              {expenses.length === 0 ? (
                <div className="p-10 rounded-2xl bg-[#0F1422] border border-white/[0.07] text-center text-xs text-slate-400">
                  No expenses logged yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {expenses.map((exp) => (
                    <div
                      key={exp.id}
                      className="p-3.5 rounded-2xl bg-[#0F1422] border border-white/[0.08] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white truncate">{exp.title}</span>
                          <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 text-[10px] font-bold shrink-0">
                            {exp.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                          {exp.payment_method.toUpperCase()} &bull; {exp.occurred_on}
                          {exp.notes ? ` · ${exp.notes}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono font-black text-sm text-rose-300">
                          -{formatKES(exp.amount_kes)}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteOutflow(exp.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL 1: CREATE INVOICE + CONTRACT (PAY NOW) */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#0E131F] border border-white/15 rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-base font-bold text-white">New Invoice &amp; Pay Now Link</h3>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <select
                value={selectedLeadId}
                onChange={(e) => handleSelectLead(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
              >
                <option value="">Link CRM Lead (optional)</option>
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.full_name} {l.company_name ? `(${l.company_name})` : ""}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client Name *"
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
                />
                <input
                  type="number"
                  required
                  min="1"
                  value={amountKes}
                  onChange={(e) => setAmountKes(e.target.value)}
                  placeholder="Amount (KES) *"
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-[#C9A66B]"
                />
              </div>

              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Invoice Title (e.g. Website Deposit) *"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
              />

              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="Client Email"
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
                />
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="WhatsApp / Phone"
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <select
                  value={invoiceType}
                  onChange={(e) => setInvoiceType(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
                >
                  <option value="deposit">Deposit → Ongoing Project</option>
                  <option value="milestone">Milestone → Ongoing Project</option>
                  <option value="final_balance">Final → Full Payment Made</option>
                  <option value="full_payment">Full → Full Payment Made</option>
                  <option value="retainer">Monthly Retainer</option>
                </select>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white [color-scheme:dark] focus:outline-none focus:border-[#C9A66B]"
                />
              </div>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <label className="inline-flex items-center gap-2 cursor-pointer text-emerald-300 font-bold">
                  <input
                    type="checkbox"
                    checked={allowMpesa}
                    onChange={(e) => setAllowMpesa(e.target.checked)}
                    className="accent-emerald-500"
                  />
                  M-Pesa
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer text-[#E5C687] font-bold">
                  <input
                    type="checkbox"
                    checked={allowCard}
                    onChange={(e) => setAllowCard(e.target.checked)}
                    className="accent-[#C9A66B]"
                  />
                  Card
                </label>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sky-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" /> Contract / Proposal
                  </span>
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-200 font-bold cursor-pointer">
                    {uploadingContract ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    Upload
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleContractUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                {contractName && (
                  <p className="text-[11px] text-sky-200 truncate">{contractName}</p>
                )}
                <input
                  type="text"
                  value={contractNotes}
                  onChange={(e) => setContractNotes(e.target.value)}
                  placeholder="Contract terms / notes (optional)"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-white"
                />
              </div>

              <button
                type="submit"
                disabled={creatingInvoice}
                className="w-full py-3 rounded-xl bg-[#C9A66B] hover:bg-[#d8b77c] text-slate-950 font-black flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {creatingInvoice ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Create Invoice &amp; Get Pay Now Link
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SEND PAY NOW LINK */}
      {sendTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#0E131F] border border-[#C9A66B]/40 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-mono font-bold text-[#C9A66B]">
                  {sendTarget.invoice_number} &bull; {formatKES(sendTarget.amount_kes)}
                </p>
                <h3 className="text-base font-bold text-white">{sendTarget.client_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSendTarget(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-white/10 flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-sky-300 truncate">
                {getPayUrl(sendTarget.public_token)}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(getPayUrl(sendTarget.public_token))
                  toast.success("Copied!")
                }}
                className="text-xs font-bold text-[#C9A66B] shrink-0 cursor-pointer"
              >
                Copy
              </button>
            </div>

            <textarea
              rows={2}
              value={customSendMessage}
              onChange={(e) => setCustomSendMessage(e.target.value)}
              placeholder="Optional note above Pay Now button..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white resize-none"
            />

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={sendingChannel !== null}
                onClick={() => handleDispatchChannel(sendTarget, "email")}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-purple-500/20 text-purple-200 font-bold text-xs cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" /> Email
              </button>
              <button
                type="button"
                disabled={sendingChannel !== null}
                onClick={() => handleDispatchChannel(sendTarget, "whatsapp")}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/20 text-emerald-200 font-bold text-xs cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </button>
              <button
                type="button"
                disabled={sendingChannel !== null}
                onClick={() => handleDispatchChannel(sendTarget, "sms")}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-sky-500/20 text-sky-200 font-bold text-xs cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" /> SMS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD SUBSCRIPTION / SALARY / EXPENSE */}
      {outflowModalType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-[#0E131F] border border-white/15 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white capitalize flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#C9A66B]" />
                Add {outflowModalType}
              </h3>
              <button
                type="button"
                onClick={() => setOutflowModalType(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOutflow} className="space-y-3 text-xs">
              <input
                type="text"
                required
                value={outTitle}
                onChange={(e) => setOutTitle(e.target.value)}
                placeholder={
                  outflowModalType === "subscription"
                    ? "Tool / Plan (e.g. Vercel Pro, Supabase) *"
                    : outflowModalType === "salary"
                    ? "Role / Month (e.g. Sales Salary — Nov) *"
                    : "Expense description *"
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
              />

              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={outVendor}
                  onChange={(e) => setOutVendor(e.target.value)}
                  placeholder={outflowModalType === "salary" ? "Staff Name" : "Vendor / Payee"}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
                />
                <input
                  type="number"
                  required
                  min="0"
                  value={outAmount}
                  onChange={(e) => setOutAmount(e.target.value)}
                  placeholder="Amount (KES) *"
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-[#C9A66B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <select
                  value={outCategory}
                  onChange={(e) => setOutCategory(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                >
                  <option value="Software">Software</option>
                  <option value="Payroll">Payroll</option>
                  <option value="Marketing">Marketing / Ads</option>
                  <option value="Operations">Operations</option>
                  <option value="Transport">Transport</option>
                  <option value="Tax">Tax / KRA</option>
                  <option value="Other">Other</option>
                </select>
                <select
                  value={outMethod}
                  onChange={(e) => setOutMethod(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                >
                  <option value="mpesa">M-Pesa</option>
                  <option value="card">Card</option>
                  <option value="bank">Bank</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="date"
                  value={outDate}
                  onChange={(e) => setOutDate(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white [color-scheme:dark]"
                />
                <select
                  value={outStatus}
                  onChange={(e) => setOutStatus(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                >
                  {outflowModalType === "subscription" ? (
                    <>
                      <option value="active">Active</option>
                      <option value="paused">Paused</option>
                    </>
                  ) : (
                    <>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                    </>
                  )}
                </select>
              </div>

              <input
                type="text"
                value={outNotes}
                onChange={(e) => setOutNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
              />

              <button
                type="submit"
                disabled={savingOutflow}
                className="w-full py-3 rounded-xl bg-[#C9A66B] text-slate-950 font-black flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {savingOutflow && <Loader2 className="w-4 h-4 animate-spin" />}
                Save {outflowModalType}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
