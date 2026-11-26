"use client"

import { useState, useEffect, useCallback } from "react"
import {
  FileText,
  Upload,
  DollarSign,
  ExternalLink,
  Copy,
  Send,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  MessageSquare,
  Loader2,
  Plus,
} from "lucide-react"
import { toast } from "sonner"

interface LeadDocumentRow {
  id: string
  lead_id: string
  doc_type: string
  title: string
  file_name: string | null
  file_url: string
  notes: string | null
  uploaded_by_email: string
  uploaded_by_name: string | null
  created_at: string
}

interface LeadInvoiceRow {
  id: string
  invoice_number: string
  public_token: string
  title: string
  invoice_type: string
  amount_kes: number
  paid_amount: number | null
  status: string
  allowed_methods: string[]
  contract_url: string | null
  contract_name: string | null
  payment_method: string | null
  payment_reference: string | null
  paid_at: string | null
  created_at: string
}

interface LeadDocumentsAndBillingProps {
  lead: {
    id: string
    full_name: string
    email: string | null
    phone_number: string | null
    company_name: string | null
    estimated_value: number
  }
  orgId: string
  orgSlug: string
  orgName: string
  onActivityUpdated?: () => void
}

const formatKES = (n: number) =>
  `KES ${Math.round(Number(n) || 0).toLocaleString("en-KE")}`

export default function LeadDocumentsAndBilling({
  lead,
  orgId,
  orgSlug,
  orgName,
  onActivityUpdated,
}: LeadDocumentsAndBillingProps) {
  const [documents, setDocuments] = useState<LeadDocumentRow[]>([])
  const [invoices, setInvoices] = useState<LeadInvoiceRow[]>([])
  const [loading, setLoading] = useState(true)

  // Upload document state
  const [docType, setDocType] = useState<"contract" | "proposal" | "agreement" | "other">("contract")
  const [docTitle, setDocTitle] = useState("")
  const [uploadingDoc, setUploadingDoc] = useState(false)

  // Quick Bill Client inline form state
  const [showBillForm, setShowBillForm] = useState(false)
  const [billTitle, setBillTitle] = useState(
    lead.company_name ? `${lead.company_name} — Project Agreement` : `Project Agreement — ${lead.full_name}`
  )
  const [billAmount, setBillAmount] = useState(
    lead.estimated_value > 0 ? String(lead.estimated_value) : ""
  )
  const [billType, setBillType] = useState("deposit")
  const [allowMpesa, setAllowMpesa] = useState(true)
  const [allowCard, setAllowCard] = useState(true)
  const [billContractUrl, setBillContractUrl] = useState("")
  const [billContractName, setBillContractName] = useState("")
  const [billContractNotes, setBillContractNotes] = useState("")
  const [creatingBill, setCreatingBill] = useState(false)
  const [sendingKey, setSendingKey] = useState<string | null>(null)

  const loadLeadFinance = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/finance/lead-documents?leadId=${encodeURIComponent(lead.id)}`,
        { cache: "no-store" }
      )
      if (res.ok) {
        const data = await res.json()
        setDocuments(data.documents || [])
        setInvoices(data.invoices || [])
      }
    } catch {
      // Non-fatal if tables not migrated yet
    } finally {
      setLoading(false)
    }
  }, [lead.id])

  useEffect(() => {
    loadLeadFinance()
    setShowBillForm(false)
    setBillTitle(
      lead.company_name ? `${lead.company_name} — Project Agreement` : `Project Agreement — ${lead.full_name}`
    )
    setBillAmount(lead.estimated_value > 0 ? String(lead.estimated_value) : "")
    setBillContractUrl("")
    setBillContractName("")
    setBillContractNotes("")
  }, [lead.id, lead.company_name, lead.full_name, lead.estimated_value, loadLeadFinance])

  const handleUploadLeadDoc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingDoc(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      fd.append("leadId", lead.id)
      fd.append("orgId", orgId)
      fd.append("orgSlug", orgSlug)
      fd.append("docType", docType)
      fd.append("title", docTitle.trim() || file.name)

      const res = await fetch("/api/finance/upload-document", {
        method: "POST",
        body: fd,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")

      toast.success(`Saved "${data.file?.title || file.name}" to ${lead.full_name}'s drawer!`)
      setDocTitle("")
      if (showBillForm && !billContractUrl && data.file?.url) {
        setBillContractUrl(data.file.url)
        setBillContractName(data.file.name)
      }
      await loadLeadFinance()
      onActivityUpdated?.()
    } catch (err: any) {
      toast.error(err?.message || "Could not upload document")
    } finally {
      setUploadingDoc(false)
      e.target.value = ""
    }
  }

  const handleQuickCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    const allowedMethods = [
      ...(allowMpesa ? ["mpesa"] : []),
      ...(allowCard ? ["card"] : []),
    ]
    if (allowedMethods.length === 0) {
      toast.error("Select at least one payment option (M-Pesa or Card).")
      return
    }
    setCreatingBill(true)
    try {
      const res = await fetch("/api/finance/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgSlug,
          leadId: lead.id,
          clientName: lead.full_name,
          clientEmail: lead.email,
          clientPhone: lead.phone_number,
          clientCompany: lead.company_name,
          title: billTitle.trim() || `Project Invoice — ${lead.full_name}`,
          invoiceType: billType,
          amountKes: Number(billAmount),
          allowedMethods,
          contractUrl: billContractUrl || null,
          contractName: billContractName || null,
          contractNotes: billContractNotes.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.invoice) {
        throw new Error(data.error || "Failed to create invoice")
      }
      toast.success(
        `Invoice ${data.invoice.invoice_number} created! Send the Pay Now link below via Email, WhatsApp, or SMS.`
      )
      setShowBillForm(false)
      await loadLeadFinance()
      onActivityUpdated?.()
    } catch (err: any) {
      toast.error(err?.message || "Failed to create invoice")
    } finally {
      setCreatingBill(false)
    }
  }

  const handleSendInvoice = async (
    inv: LeadInvoiceRow,
    channel: "email" | "whatsapp" | "sms"
  ) => {
    const key = `${inv.id}-${channel}`
    setSendingKey(key)
    try {
      const res = await fetch("/api/finance/invoices/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: inv.id, channel }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Could not prepare send link")

      if (data.deliveredDirectly) {
        toast.success(data.deliveryNote || `Sent via ${channel.toUpperCase()}!`)
      } else if (channel === "whatsapp") {
        window.open(data.whatsappUrl, "_blank", "noopener,noreferrer")
        toast.success("WhatsApp opened with Contract & Pay Now link!")
      } else if (channel === "email") {
        window.open(data.gmailComposeUrl, "_blank", "noopener,noreferrer")
        toast.success("Email composer opened with Contract & Pay Now link!")
      } else {
        await navigator.clipboard.writeText(data.plainMessage).catch(() => {})
        window.location.href = data.smsUrl
        toast.success("SMS opened & Pay Now message copied!")
      }
      onActivityUpdated?.()
    } catch (err: any) {
      toast.error(err?.message || "Failed to send")
    } finally {
      setSendingKey(null)
    }
  }

  const copyPayUrl = async (inv: LeadInvoiceRow) => {
    const url = `${window.location.origin}/pay/${inv.public_token}`
    await navigator.clipboard.writeText(url)
    toast.success(`Copied Pay Now link for ${inv.invoice_number}!`)
  }

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            Documents, Contracts &amp; Client Billing
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Contracts/proposals sent to {lead.full_name} &amp; live Pay Now links ({orgName}).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowBillForm((p) => !p)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#C9A66B] hover:bg-[#d8b77c] text-slate-950 font-extrabold text-xs transition-colors cursor-pointer"
        >
          <DollarSign className="w-3.5 h-3.5" />
          {showBillForm ? "Close Billing Form" : "Bill Client"}
        </button>
      </div>

      {/* INLINE BILL CLIENT FORM */}
      {showBillForm && (
        <form
          onSubmit={handleQuickCreateInvoice}
          className="p-4 rounded-xl bg-slate-950 border border-[#C9A66B]/40 space-y-3 text-xs"
        >
          <p className="font-bold text-[#E5C687] uppercase tracking-wider text-[10px]">
            Create Invoice + Pay Now Link (M-Pesa / Card)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <label className="text-slate-400 block mb-1">Invoice / Scope Title *</label>
              <input
                type="text"
                required
                value={billTitle}
                onChange={(e) => setBillTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A66B]"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Amount (KES) *</label>
              <input
                type="number"
                required
                min="1"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                placeholder="50000"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono font-bold focus:outline-none focus:border-[#C9A66B]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-slate-400 block mb-1">Milestone Stage After Payment</label>
              <select
                value={billType}
                onChange={(e) => setBillType(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A66B]"
              >
                <option value="deposit">Deposit → Ongoing Project</option>
                <option value="milestone">Milestone → Ongoing Project</option>
                <option value="final_balance">Final Balance → Full Payment Made</option>
                <option value="full_payment">Full Payment → Full Payment Made</option>
              </select>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Link Existing Contract (Optional)</label>
              <select
                value={billContractUrl}
                onChange={(e) => {
                  setBillContractUrl(e.target.value)
                  const match = documents.find((d) => d.file_url === e.target.value)
                  setBillContractName(match?.title || match?.file_name || "")
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A66B]"
              >
                <option value="">No contract attached (or upload below)</option>
                {documents
                  .filter((d) => d.doc_type !== "invoice")
                  .map((d) => (
                    <option key={d.id} value={d.file_url}>
                      {d.title}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-emerald-300 font-semibold">
              <input
                type="checkbox"
                checked={allowMpesa}
                onChange={(e) => setAllowMpesa(e.target.checked)}
                className="accent-emerald-500"
              />
              M-Pesa
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer text-[#E5C687] font-semibold">
              <input
                type="checkbox"
                checked={allowCard}
                onChange={(e) => setAllowCard(e.target.checked)}
                className="accent-[#C9A66B]"
              />
              Card (Local &amp; International)
            </label>
          </div>

          <input
            type="text"
            value={billContractNotes}
            onChange={(e) => setBillContractNotes(e.target.value)}
            placeholder="Short contract / scope summary (optional)"
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#C9A66B]"
          />

          <button
            type="submit"
            disabled={creatingBill}
            className="w-full py-2.5 rounded-xl bg-[#C9A66B] hover:bg-[#d8b77c] text-slate-950 font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {creatingBill ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            {creatingBill ? "Creating Invoice..." : "Generate Pay Now Invoice"}
          </button>
        </form>
      )}

      {/* UPLOAD CONTRACT / PROPOSAL BAR */}
      <div className="flex flex-col sm:flex-row gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value as any)}
          className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-white focus:outline-none"
        >
          <option value="contract">Contract</option>
          <option value="proposal">Proposal</option>
          <option value="agreement">Agreement</option>
          <option value="other">Other Doc</option>
        </select>
        <input
          type="text"
          value={docTitle}
          onChange={(e) => setDocTitle(e.target.value)}
          placeholder="Document title (e.g. Signed Contract v1)..."
          className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sky-400"
        />
        <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 font-bold cursor-pointer shrink-0">
          {uploadingDoc ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {uploadingDoc ? "Uploading..." : "Upload File"}
          <input
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.ppt,.pptx"
            onChange={handleUploadLeadDoc}
            className="hidden"
          />
        </label>
      </div>

      {/* INVOICES LIST FOR THIS LEAD */}
      {invoices.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Client Invoices &amp; Pay Now Links ({invoices.length})
          </p>
          {invoices.map((inv) => {
            const isPaid = inv.status === "payment_made"
            return (
              <div
                key={inv.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#E5C687]">{inv.invoice_number}</span>
                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Payment Made
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[10px] font-bold">
                          <Clock className="w-3 h-3" /> Unpaid
                        </span>
                      )}
                    </div>
                    <p className="text-slate-200 font-semibold mt-0.5 truncate">{inv.title}</p>
                    {inv.payment_reference && (
                      <p className="text-[10px] font-mono text-emerald-400">
                        Ref: {inv.payment_reference}
                      </p>
                    )}
                  </div>
                  <span className="font-mono font-black text-white shrink-0">
                    {formatKES(inv.paid_amount || inv.amount_kes)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-900">
                  <button
                    type="button"
                    disabled={sendingKey !== null}
                    onClick={() => handleSendInvoice(inv, "whatsapp")}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold cursor-pointer"
                  >
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </button>
                  <button
                    type="button"
                    disabled={sendingKey !== null}
                    onClick={() => handleSendInvoice(inv, "email")}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[11px] font-semibold cursor-pointer"
                  >
                    <Mail className="w-3 h-3" /> Email
                  </button>
                  <button
                    type="button"
                    disabled={sendingKey !== null}
                    onClick={() => handleSendInvoice(inv, "sms")}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[11px] font-semibold cursor-pointer"
                  >
                    <MessageSquare className="w-3 h-3" /> SMS
                  </button>
                  <button
                    type="button"
                    onClick={() => copyPayUrl(inv)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-semibold cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Copy Link
                  </button>
                  <a
                    href={`/pay/${inv.public_token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto inline-flex items-center gap-1 text-[#C9A66B] hover:underline text-[11px] font-semibold"
                  >
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* SENT CONTRACTS & PROPOSALS LIST */}
      <div className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Sent Contracts, Proposals &amp; Files ({documents.length})
        </p>

        {loading ? (
          <div className="text-xs text-slate-500 flex items-center gap-2 py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading saved documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="text-xs text-slate-500 italic py-1">
            No contracts or proposals uploaded for {lead.full_name} yet. Upload one above or attach it when billing.
          </div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 flex items-center justify-between gap-2.5 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-500/30 text-sky-300 text-[9px] font-bold uppercase shrink-0">
                      {doc.doc_type}
                    </span>
                    <span className="font-semibold text-slate-100 truncate">{doc.title}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                    {new Date(doc.created_at).toLocaleDateString()} &bull; by{" "}
                    {doc.uploaded_by_name || doc.uploaded_by_email}
                    {doc.notes ? ` — ${doc.notes}` : ""}
                  </p>
                </div>
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-300 text-[11px] font-semibold shrink-0"
                >
                  Open <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
