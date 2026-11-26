"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import {
  DollarSign,
  CreditCard,
  Smartphone,
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
  RefreshCw,
  Building2,
  UserPlus,
  ShieldCheck,
  AlertCircle,
  X,
  Loader2,
  Search,
  Receipt,
  Sparkles,
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

interface OrgLeadOption {
  id: string
  full_name: string
  email: string | null
  phone_number: string | null
  company_name: string | null
  stage: string
  estimated_value: number | null
  assigned_agent_email: string | null
}

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
  showManageUsersLink = true,
}: FinanceDepartmentHubProps) {
  const [loading, setLoading] = useState(true)
  const [schemaPending, setSchemaPending] = useState(false)
  const [paystackConfigured, setPaystackConfigured] = useState(false)
  const [paystackLiveMode, setPaystackLiveMode] = useState(false)
  const [invoices, setInvoices] = useState<FinanceInvoice[]>([])
  const [leads, setLeads] = useState<OrgLeadOption[]>([])
  const [kpis, setKpis] = useState({
    totalCollectedKes: 0,
    pendingAmountKes: 0,
    paidCount: 0,
    unpaidCount: 0,
    mpesaCollectedKes: 0,
    cardCollectedKes: 0,
    totalInvoices: 0,
  })

  // Filters
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "payment_made">("all")
  const [search, setSearch] = useState("")

  // Bill Client Modal State
  const [showBillModal, setShowBillModal] = useState(false)
  const [selectedLeadId, setSelectedLeadId] = useState<string>("")
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientCompany, setClientCompany] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
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

  // Send Pay Now Link Modal State
  const [sendTarget, setSendTarget] = useState<FinanceInvoice | null>(null)
  const [customSendMessage, setCustomSendMessage] = useState("")
  const [sendingChannel, setSendingChannel] = useState<"email" | "whatsapp" | "sms" | null>(null)

  const fetchFinanceData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/finance/invoices?orgSlug=${encodeURIComponent(orgSlug)}`, {
        cache: "no-store",
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Could not load finance workspace")
        return
      }
      setSchemaPending(Boolean(data.schemaPending))
      setPaystackConfigured(Boolean(data.paystackConfigured))
      setPaystackLiveMode(Boolean(data.paystackLiveMode))
      setInvoices(data.invoices || [])
      setLeads(data.leads || [])
      if (data.kpis) setKpis(data.kpis)
    } catch (err: any) {
      toast.error(err?.message || "Failed to load finance data")
    } finally {
      setLoading(false)
    }
  }, [orgSlug])

  useEffect(() => {
    fetchFinanceData()
  }, [fetchFinanceData])

  const getPayUrl = (token: string) => {
    if (typeof window === "undefined") return `https://www.cillah.dev/pay/${token}`
    return `${window.location.origin}/pay/${token}`
  }

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
        setTitle(
          found.company_name
            ? `${found.company_name} — Project Agreement & Deposit`
            : `Project Agreement & Deposit — ${found.full_name}`
        )
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
      const res = await fetch("/api/finance/upload-document", {
        method: "POST",
        body: fd,
      })
      const data = await res.json()
      if (!res.ok || !data.file?.url) {
        throw new Error(data.error || "Could not upload contract")
      }
      setContractUrl(data.file.url)
      setContractName(data.file.name)
      toast.success(`Contract "${data.file.name}" attached!`)
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
      toast.error("Please enable at least one payment option (M-Pesa or Card).")
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
          description,
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
      if (!res.ok || !data.invoice) {
        throw new Error(data.error || "Failed to create invoice")
      }

      toast.success(`Invoice ${data.invoice.invoice_number} created! Ready to send with Pay Now button.`)
      setShowBillModal(false)
      setSendTarget(data.invoice)
      setCustomSendMessage("")

      // Reset form
      setSelectedLeadId("")
      setClientName("")
      setClientEmail("")
      setClientPhone("")
      setClientCompany("")
      setTitle("")
      setDescription("")
      setAmountKes("")
      setContractUrl("")
      setContractName("")
      setContractNotes("")
      setDueDate("")
      setAllowMpesa(true)
      setAllowCard(true)

      await fetchFinanceData()
    } catch (err: any) {
      toast.error(err?.message || "Could not create invoice")
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
      if (!res.ok) {
        throw new Error(data.error || "Failed to prepare message")
      }

      if (data.deliveredDirectly) {
        toast.success(data.deliveryNote || `Sent via ${channel.toUpperCase()}!`)
      } else if (channel === "whatsapp") {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer")
        toast.success("WhatsApp opened with your contract & Pay Now link ready to send!")
      } else if (channel === "email") {
        window.open(data.gmailComposeUrl, "_blank", "noopener,noreferrer")
        toast.success("Email composer opened with your invoice, contract & Pay Now link!")
      } else if (channel === "sms") {
        await navigator.clipboard.writeText(data.plainMessage).catch(() => {})
        window.location.href = data.smsUrl
        toast.success("SMS opened & message copied to clipboard!")
      }

      fetchFinanceData()
    } catch (err: any) {
      toast.error(err?.message || "Could not send invoice")
    } finally {
      setSendingChannel(null)
    }
  }

  const copyPayLink = async (inv: FinanceInvoice) => {
    const url = getPayUrl(inv.public_token)
    await navigator.clipboard.writeText(url)
    toast.success(`Copied Pay Now link for ${inv.invoice_number}!`)
  }

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      if (statusFilter === "payment_made" && inv.status !== "payment_made") return false
      if (statusFilter === "unpaid" && inv.status === "payment_made") return false
      if (search.trim()) {
        const q = search.toLowerCase()
        const hay = `${inv.invoice_number} ${inv.client_name} ${inv.client_email || ""} ${
          inv.client_company || ""
        } ${inv.title}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [invoices, statusFilter, search])

  return (
    <div className="min-h-screen bg-[#0E131F] text-slate-100 p-4 md:p-6 space-y-6 font-sans">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5 text-[#C9A66B]" />
            <span className="text-[#C9A66B]">{orgName} &bull; Finance Department</span>
            {isDemoOrg ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[9px] uppercase">
                Demo Ledger &bull; Live Billing Enabled
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[9px] uppercase">
                Live Production Data
              </span>
            )}
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            Client Billing, Contracts &amp; Paystack Settlement
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isDemoOrg
              ? "Safe demo ledger for client showcases — sample records stay isolated here while Bill Client triggers real M-Pesa & Card Paystack payments."
              : "Live accurate revenue & invoices for cillah.dev. Paid invoices automatically move leads to Ongoing Project / Full Payment Made and update Won Deals in KES."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowBillModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C9A66B] hover:bg-[#d8b77c] text-slate-950 font-extrabold text-xs shadow-lg shadow-[#C9A66B]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Bill Client / Send Contract
          </button>

          {showManageUsersLink && (
            <Link
              href={`/admin/organizations/${orgSlug}/finance/users`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#C9A66B]" />
              Finance Users
            </Link>
          )}

          <button
            type="button"
            onClick={fetchFinanceData}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#C9A66B]" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* SETUP / PAYSTACK CONNECTION STATUS BANNER */}
      {schemaPending && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-start gap-3 text-xs text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-100">One-Time Database Setup Needed</p>
            <p className="mt-0.5 text-amber-200/85">
              Run <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300">supabase/finance_paystack_and_documents_schema.sql</code> in your Supabase SQL Editor to activate <code className="text-amber-300">finance_invoices</code>, <code className="text-amber-300">lead_documents</code>, and the <code className="text-amber-300">client-documents</code> storage bucket.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-300">
            <Smartphone className="w-4 h-4" /> M-Pesa Express: <strong className="text-white">Active (Till 3513268)</strong>
          </span>
          <span className="text-slate-700">|</span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-[#E5C687]">
            <CreditCard className="w-4 h-4" /> Paystack Card &amp; Global:
            {paystackConfigured ? (
              <strong className="text-emerald-400">
                {paystackLiveMode ? "Live Connected" : "Test Mode Connected"}
              </strong>
            ) : (
              <strong className="text-amber-300">Add PAYSTACK_SECRET_KEY in Vercel / .env.local</strong>
            )}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          M-Pesa cap: KES 150,000/tx &bull; Card: Unlimited (Local &amp; International)
        </span>
      </div>

      {/* 4 FINANCE KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/85 border border-emerald-500/25">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Collected (Payment Made)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-400 font-mono">
            {formatKES(kpis.totalCollectedKes)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {kpis.paidCount} verified {kpis.paidCount === 1 ? "payment" : "payments"}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/85 border border-amber-500/25">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Outstanding Invoices</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-300 font-mono">
            {formatKES(kpis.pendingAmountKes)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {kpis.unpaidCount} awaiting client payment
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/85 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Collected via M-Pesa</span>
            <Smartphone className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-white font-mono">
            {formatKES(kpis.mpesaCollectedKes)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">STK Push &amp; Paystack Mobile Money</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/85 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Collected via Card (Global)</span>
            <CreditCard className="w-4 h-4 text-[#C9A66B]" />
          </div>
          <div className="mt-2 text-2xl font-black text-[#E5C687] font-mono">
            {formatKES(kpis.cardCollectedKes)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Visa, Mastercard &amp; Apple Pay</p>
        </div>
      </div>

      {/* INVOICE LEDGER TABLE */}
      <div className="rounded-2xl bg-slate-900/75 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-[#C9A66B]" />
              Client Invoices &amp; Contract Payment Links
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Every invoice comes with a unique Pay Now link, attached contract, and automatic CRM stage updates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search client or invoice..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#C9A66B]"
              />
            </div>

            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1 text-[11px]">
              {(["all", "unpaid", "payment_made"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    statusFilter === tab
                      ? "bg-[#C9A66B] text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {tab === "all" ? "All" : tab === "unpaid" ? "Awaiting" : "Payment Made"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
            <Sparkles className="w-5 h-5 animate-spin text-[#C9A66B]" />
            Loading {orgName} invoices...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="py-16 text-center space-y-3 px-4">
            <Receipt className="w-10 h-10 text-slate-700 mx-auto" />
            <p className="text-sm font-semibold text-slate-200">No invoices yet for {orgName}</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click <strong>&ldquo;Bill Client / Send Contract&rdquo;</strong> above to attach a contract, set the agreed KES amount, and send a Pay Now link via Email, WhatsApp, or SMS.
            </p>
            <button
              type="button"
              onClick={() => setShowBillModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C9A66B] text-slate-950 font-bold text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create First Invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/90 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Invoice &amp; Milestone</th>
                  <th className="py-3.5 px-4">Client</th>
                  <th className="py-3.5 px-4">Agreed Amount</th>
                  <th className="py-3.5 px-4">Contract</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Send / Pay Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {filteredInvoices.map((inv) => {
                  const isPaid = inv.status === "payment_made"
                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/35 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-[#E5C687] flex items-center gap-1.5">
                          {inv.invoice_number}
                          {inv.is_demo_seed && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-sans">
                              DEMO
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-white mt-0.5 max-w-[240px] truncate">
                          {inv.title}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize mt-0.5">
                          {inv.invoice_type.replace(/_/g, " ")} &bull;{" "}
                          {new Date(inv.created_at).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-100">{inv.client_name}</div>
                        {inv.client_company && (
                          <div className="text-[11px] text-slate-400">{inv.client_company}</div>
                        )}
                        <div className="text-[10px] text-slate-500">
                          {inv.client_email || inv.client_phone || "—"}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-white text-sm">
                          {formatKES(inv.paid_amount || inv.amount_kes)}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {(inv.allowed_methods || ["mpesa", "card"]).map((m) => (
                            <span
                              key={m}
                              className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[9px] uppercase font-bold text-slate-300"
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {inv.contract_url ? (
                          <a
                            href={inv.contract_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 text-[11px] font-semibold"
                          >
                            <FileText className="w-3 h-3" />
                            <span className="max-w-[130px] truncate">
                              {inv.contract_name || "View Contract"}
                            </span>
                          </a>
                        ) : inv.contract_name ? (
                          <span className="text-[11px] text-slate-300">{inv.contract_name}</span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        {isPaid ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-[10px] uppercase">
                              <CheckCircle2 className="w-3 h-3" /> Payment Made
                            </span>
                            {inv.payment_reference && (
                              <div className="text-[10px] font-mono text-slate-400">
                                Ref: {inv.payment_reference}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 font-bold text-[10px] uppercase">
                              <Clock className="w-3 h-3" /> {inv.status === "sent" ? "Sent • Unpaid" : "Unpaid"}
                            </span>
                            {inv.sent_via?.length > 0 && (
                              <div className="text-[10px] text-slate-500">
                                Sent via {inv.sent_via.join(", ")}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSendTarget(inv)
                              setCustomSendMessage("")
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#C9A66B]/15 hover:bg-[#C9A66B]/25 border border-[#C9A66B]/40 text-[#E5C687] font-bold text-[11px] cursor-pointer"
                          >
                            <Send className="w-3 h-3" /> Send Pay Now
                          </button>

                          <button
                            type="button"
                            onClick={() => copyPayLink(inv)}
                            title="Copy Pay Now link"
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <a
                            href={`/pay/${inv.public_token}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Preview Client Checkout Page"
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: BILL CLIENT / CREATE INVOICE + CONTRACT */}
      {showBillModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#C9A66B]" />
                  Bill Client &amp; Attach Contract ({orgName})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Creates a verified Pay Now link (M-Pesa / Card) and saves the contract directly in the lead&apos;s drawer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowBillModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Link to CRM Lead */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Link to CRM Lead (Auto-updates pipeline stage &amp; drawer documents on payment)
                </label>
                <select
                  value={selectedLeadId}
                  onChange={(e) => handleSelectLead(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
                >
                  <option value="">— Select a {orgName} lead (or type client manually below) —</option>
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.full_name} {l.company_name ? `(${l.company_name})` : ""} — {l.stage.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Eng. Benson Kamau"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Company / Project</label>
                  <input
                    type="text"
                    value={clientCompany}
                    onChange={(e) => setClientCompany(e.target.value)}
                    placeholder="e.g. Rift Investments Ltd"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Client Email</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="client@company.com"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">WhatsApp / Phone</label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+254712345678"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-300 mb-1">Invoice / Agreement Title *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. AI CRM & Website Build — 50% Kickoff Deposit"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Agreed Amount (KES) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="1"
                    value={amountKes}
                    onChange={(e) => setAmountKes(e.target.value)}
                    placeholder="50000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Payment Milestone (Controls CRM Stage)</label>
                  <select
                    value={invoiceType}
                    onChange={(e) => setInvoiceType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C9A66B]"
                  >
                    <option value="deposit">Deposit / Kickoff → Moves to Ongoing Project</option>
                    <option value="milestone">Milestone Payment → Moves to Ongoing Project</option>
                    <option value="final_balance">Final Balance → Moves to Full Payment Made</option>
                    <option value="full_payment">Full Payment Upfront → Moves to Full Payment Made</option>
                    <option value="retainer">Monthly Retainer → Moves to Ongoing Project</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Due Date (Optional)</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-white [color-scheme:dark] focus:outline-none focus:border-[#C9A66B]"
                  />
                </div>
              </div>

              {/* Payment Options Toggle */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <p className="font-semibold text-slate-300">Payment Methods Shown on Client&apos;s Pay Now Page:</p>
                <div className="flex flex-wrap gap-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowMpesa}
                      onChange={(e) => setAllowMpesa(e.target.checked)}
                      className="accent-emerald-500 w-4 h-4"
                    />
                    <span className="text-emerald-300 font-semibold">M-Pesa (STK Push / Paystack)</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowCard}
                      onChange={(e) => setAllowCard(e.target.checked)}
                      className="accent-[#C9A66B] w-4 h-4"
                    />
                    <span className="text-[#E5C687] font-semibold">Card (Visa / Mastercard / Apple Pay — International)</span>
                  </label>
                </div>
                {Number(amountKes) > 150000 && allowMpesa && (
                  <p className="text-[11px] text-amber-300">
                    Note: Amounts over KES 150,000 exceed Safaricom&apos;s single M-Pesa limit — Card will be automatically prioritized for the client.
                  </p>
                )}
              </div>

              {/* Attach Contract / Proposal File */}
              <div className="p-4 rounded-xl bg-sky-500/[0.05] border border-sky-500/25 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-sky-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Attach Contract / Proposal Document
                  </span>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 font-bold cursor-pointer">
                    {uploadingContract ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {uploadingContract ? "Uploading..." : "Upload PDF / Doc"}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                      onChange={handleContractUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {contractUrl && (
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-950 border border-sky-500/30">
                    <span className="text-sky-200 font-semibold truncate">{contractName}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setContractUrl("")
                        setContractName("")
                      }}
                      className="text-rose-400 hover:text-rose-300 text-[11px] font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                )}

                <textarea
                  rows={2}
                  value={contractNotes}
                  onChange={(e) => setContractNotes(e.target.value)}
                  placeholder="Contract summary / key deliverables / payment terms shown alongside the Pay Now button..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-sky-400 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBillModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingInvoice}
                  className="px-5 py-2.5 rounded-xl bg-[#C9A66B] hover:bg-[#d8b77c] text-slate-950 font-extrabold flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {creatingInvoice ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Creating Invoice...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Create Invoice &amp; Get Pay Now Link
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SEND CONTRACT + PAY NOW BUTTON VIA EMAIL / WHATSAPP / SMS */}
      {sendTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-[#C9A66B]/40 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono font-bold text-[#C9A66B]">
                  {sendTarget.invoice_number} &bull; {formatKES(sendTarget.amount_kes)}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Send Contract &amp; Pay Now Link
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  To: <strong className="text-slate-200">{sendTarget.client_name}</strong>{" "}
                  ({sendTarget.client_email || sendTarget.client_phone || "Direct link"})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSendTarget(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Pay Now URL preview */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Client Checkout &amp; Contract Link</span>
                <button
                  type="button"
                  onClick={() => copyPayLink(sendTarget)}
                  className="text-[#C9A66B] font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> Copy Link
                </button>
              </div>
              <p className="font-mono text-xs text-sky-300 break-all">
                {getPayUrl(sendTarget.public_token)}
              </p>
            </div>

            {/* Optional Custom Message */}
            <div className="text-xs">
              <label className="block font-semibold text-slate-300 mb-1.5">
                Optional Personal Note (Included above the Pay Now button)
              </label>
              <textarea
                rows={3}
                value={customSendMessage}
                onChange={(e) => setCustomSendMessage(e.target.value)}
                placeholder={`Hi ${sendTarget.client_name.split(" ")[0]}, great speaking with you! Here is our agreed contract and Pay Now link so we can kick off right away.`}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:outline-none focus:border-[#C9A66B] resize-none"
              />
            </div>

            {/* 3 Channel Dispatch Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                disabled={sendingChannel !== null}
                onClick={() => handleDispatchChannel(sendTarget, "email")}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 font-bold text-xs cursor-pointer"
              >
                {sendingChannel === "email" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                Send Email
              </button>

              <button
                type="button"
                disabled={sendingChannel !== null}
                onClick={() => handleDispatchChannel(sendTarget, "whatsapp")}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold text-xs cursor-pointer"
              >
                {sendingChannel === "whatsapp" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageCircle className="w-4 h-4" />
                )}
                WhatsApp
              </button>

              <button
                type="button"
                disabled={sendingChannel !== null}
                onClick={() => handleDispatchChannel(sendTarget, "sms")}
                className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 font-bold text-xs cursor-pointer"
              >
                {sendingChannel === "sms" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <MessageSquare className="w-4 h-4" />
                )}
                Normal SMS
              </button>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <a
                href={`/pay/${sendTarget.public_token}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#C9A66B] font-semibold hover:underline inline-flex items-center gap-1"
              >
                Open Live Checkout Page <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setSendTarget(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
