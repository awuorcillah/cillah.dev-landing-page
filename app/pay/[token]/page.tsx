"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  FileText,
  ExternalLink,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
  Calendar,
  ArrowRight,
  RefreshCw,
  Globe,
  Lock,
} from "lucide-react"
import { toast } from "sonner"

interface PublicInvoice {
  id: string
  org_id: string
  org_slug: string
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
  created_at: string
}

interface OrgMeta {
  name: string
  slug: string
  website?: string
}

const INVOICE_TYPE_LABELS: Record<string, string> = {
  deposit: "Project Deposit (Starts Ongoing Project)",
  milestone: "Project Milestone Payment",
  final_balance: "Final Balance (Full Payment)",
  full_payment: "Full Project Payment",
  retainer: "Monthly Retainer",
}

export default function PublicInvoicePayPage() {
  const params = useParams()
  const token = String(params?.token || "")

  const [invoice, setInvoice] = useState<PublicInvoice | null>(null)
  const [org, setOrg] = useState<OrgMeta | null>(null)
  const [paystackConfigured, setPaystackConfigured] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFoundError, setNotFoundError] = useState("")

  // Payment state
  const [selectedMethod, setSelectedMethod] = useState<"mpesa" | "card">("mpesa")
  const [mpesaPhone, setMpesaPhone] = useState("")
  const [payerEmail, setPayerEmail] = useState("")
  const [mpesaPhase, setMpesaPhase] = useState<"idle" | "sending" | "waiting" | "timeout">("idle")
  const [payingCard, setPayingCard] = useState(false)
  const [payingPaystackMpesa, setPayingPaystackMpesa] = useState(false)
  const [verifyingReturn, setVerifyingReturn] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")

  const pollRef = useRef<number | null>(null)
  const pollCountRef = useRef<number>(0)

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => stopPolling()
  }, [stopPolling])

  const loadInvoice = useCallback(async () => {
    if (!token) return null
    try {
      const res = await fetch(`/api/pay/${encodeURIComponent(token)}`, { cache: "no-store" })
      const data = await res.json()
      if (!res.ok || !data.invoice) {
        setNotFoundError(data.error || "Invoice not found.")
        return null
      }
      const inv: PublicInvoice = data.invoice
      setInvoice(inv)
      setOrg(data.organization)
      setPaystackConfigured(Boolean(data.paystackConfigured))
      if (inv.client_phone && !mpesaPhone) setMpesaPhone(inv.client_phone)
      if (inv.client_email && !payerEmail) setPayerEmail(inv.client_email)

      const allowed = Array.isArray(inv.allowed_methods) && inv.allowed_methods.length > 0
        ? inv.allowed_methods
        : ["mpesa", "card"]

      // Auto-default to Card if amount > KES 150,000 or M-Pesa is not enabled
      if (!allowed.includes("mpesa") || Number(inv.amount_kes) > 150000) {
        if (allowed.includes("card")) setSelectedMethod("card")
      } else {
        setSelectedMethod("mpesa")
      }
      return inv
    } catch (err: any) {
      setNotFoundError(err?.message || "Could not load invoice.")
      return null
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadInvoice()
  }, [loadInvoice])

  // Verify Paystack return (?paystack_ref=... or ?reference=...)
  useEffect(() => {
    if (typeof window === "undefined" || !token) return
    const qs = new URLSearchParams(window.location.search)
    const ref = qs.get("paystack_ref") || qs.get("reference") || qs.get("trxref")
    if (!ref) return

    let active = true
    async function verify() {
      setVerifyingReturn(true)
      setErrorMsg("")
      try {
        const res = await fetch(
          `/api/pay/${encodeURIComponent(token)}/verify?reference=${encodeURIComponent(ref!)}`,
          { cache: "no-store" }
        )
        const data = await res.json()
        if (!active) return
        if (res.ok && data.status === "payment_made") {
          setInvoice(data.invoice)
          toast.success("Payment verified! Thank you — your project status has been updated.")
          window.history.replaceState({}, "", `/pay/${token}`)
        } else {
          setErrorMsg(data.message || data.error || "Payment was not completed yet.")
        }
      } catch (err: any) {
        if (active) setErrorMsg(err?.message || "Could not verify payment.")
      } finally {
        if (active) setVerifyingReturn(false)
      }
    }
    verify()
    return () => {
      active = false
    }
  }, [token])

  // Direct Safaricom M-Pesa STK Push
  const handleDirectMpesaStk = async () => {
    if (!invoice) return
    if (!mpesaPhone.trim()) {
      toast.error("Please enter your M-Pesa phone number.")
      return
    }
    setErrorMsg("")
    setMpesaPhase("sending")
    stopPolling()

    try {
      const res = await fetch(`/api/pay/${encodeURIComponent(token)}/mpesa-stk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mpesaPhone: mpesaPhone.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Could not send M-Pesa PIN prompt")
      }
      setMpesaPhase("waiting")
      toast.success("M-Pesa PIN prompt sent! Enter your PIN on your phone.")

      pollCountRef.current = 0
      pollRef.current = window.setInterval(async () => {
        pollCountRef.current += 1
        const latest = await loadInvoice()
        if (latest?.status === "payment_made") {
          stopPolling()
          setMpesaPhase("idle")
          toast.success("Payment confirmed! Your receipt is ready.")
          return
        }
        if (pollCountRef.current >= 50) {
          stopPolling()
          setMpesaPhase("timeout")
        }
      }, 3000)
    } catch (err: any) {
      setMpesaPhase("idle")
      setErrorMsg(err?.message || "Failed to send M-Pesa prompt")
      toast.error(err?.message || "Failed to send M-Pesa prompt")
    }
  }

  // Paystack Checkout (Card OR Paystack M-Pesa)
  const handlePaystackCheckout = async (method: "card" | "mpesa") => {
    if (!invoice) return
    const emailToUse = (payerEmail || invoice.client_email || "").trim()
    if (!emailToUse || !emailToUse.includes("@")) {
      toast.error("Please enter a valid email address for your payment receipt.")
      return
    }

    setErrorMsg("")
    if (method === "card") setPayingCard(true)
    else setPayingPaystackMpesa(true)

    try {
      const res = await fetch(`/api/pay/${encodeURIComponent(token)}/paystack-init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, email: emailToUse }),
      })
      const data = await res.json()
      if (!res.ok || !data.authorizationUrl) {
        throw new Error(data.error || "Could not start Paystack checkout")
      }
      window.location.href = data.authorizationUrl
    } catch (err: any) {
      setErrorMsg(err?.message || "Could not start payment")
      toast.error(err?.message || "Could not start payment")
      setPayingCard(false)
      setPayingPaystackMpesa(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#07070B] text-slate-100 flex items-center justify-center p-6">
        <div className="flex items-center gap-3 text-sm text-[#C9A66B]">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading your secure invoice &amp; contract...
        </div>
      </main>
    )
  }

  if (notFoundError || !invoice) {
    return (
      <main className="min-h-screen bg-[#07070B] text-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl bg-[#0D0F18] border border-slate-800 p-8 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h1 className="text-lg font-bold text-white">Invoice Link Unavailable</h1>
          <p className="text-xs text-slate-400">{notFoundError || "This payment link could not be found."}</p>
        </div>
      </main>
    )
  }

  const amountKes = Number(invoice.amount_kes) || 0
  const formattedAmount = `KES ${amountKes.toLocaleString("en-KE")}`
  const allowedMethods =
    Array.isArray(invoice.allowed_methods) && invoice.allowed_methods.length > 0
      ? invoice.allowed_methods
      : ["mpesa", "card"]
  const mpesaAllowed = allowedMethods.includes("mpesa")
  const cardAllowed = allowedMethods.includes("card")
  const exceedsMpesaLimit = amountKes > 150000
  const isPaid = invoice.status === "payment_made"

  return (
    <main className="min-h-screen bg-[#07070B] text-[#F9F7F6] py-10 px-4 sm:px-6 font-sans relative overflow-x-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[560px] h-[360px] rounded-full bg-[#C9A66B]/10 blur-[130px] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-[#C9A66B]/50 shrink-0">
              <img src="/images/cillah-emblem.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C9A66B]">
                <Building2 className="w-3.5 h-3.5" />
                {org?.name || "cillah.dev"}
              </div>
              <p className="text-xs text-slate-400">Official Client Invoice &amp; Agreement Portal</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-[11px] text-slate-300 self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5 text-[#C9A66B]" />
            <span>Encrypted Checkout</span>
          </div>
        </div>

        {/* Main Invoice Card */}
        <div className="rounded-3xl bg-[#0D0F18]/95 border border-white/10 shadow-2xl overflow-hidden">
          {/* Top Amount Banner */}
          <div className="p-6 sm:p-8 bg-gradient-to-br from-[#1C1710] via-[#12141E] to-[#0D0F18] border-b border-[#C9A66B]/30">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full bg-[#C9A66B]/15 border border-[#C9A66B]/40 text-[#E5C687] text-[11px] font-mono font-bold">
                {invoice.invoice_number}
              </span>
              {isPaid ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Payment Made
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-semibold">
                  Awaiting Payment
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {invoice.title}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {INVOICE_TYPE_LABELS[invoice.invoice_type] || "Client Engagement Invoice"}
            </p>

            <div className="mt-5 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-slate-400">
                  Agreed Amount Due
                </p>
                <p className="text-3xl sm:text-4xl font-black text-[#C9A66B] font-mono tracking-tight mt-0.5">
                  {formattedAmount}
                </p>
              </div>
              <div className="text-xs text-slate-300 space-y-1 sm:text-right">
                <p>
                  <span className="text-slate-500">Billed To:</span>{" "}
                  <strong className="text-white">{invoice.client_name}</strong>
                </p>
                {invoice.client_company && (
                  <p className="text-slate-400">{invoice.client_company}</p>
                )}
                {invoice.due_date && (
                  <p className="text-[11px] text-amber-300 inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Due {new Date(invoice.due_date).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Scope / Description */}
            {invoice.description && (
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {invoice.description}
              </div>
            )}

            {/* Attached Contract / Proposal Section */}
            {(invoice.contract_url || invoice.contract_name || invoice.contract_notes) && (
              <div className="p-4 sm:p-5 rounded-2xl bg-sky-500/[0.06] border border-sky-500/30 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-sky-300">
                        Attached Contract / Proposal
                      </p>
                      <h2 className="text-sm font-bold text-white mt-0.5">
                        {invoice.contract_name || "Service Agreement & Scope"}
                      </h2>
                      {invoice.contract_notes && (
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {invoice.contract_notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {invoice.contract_url && (
                  <a
                    href={invoice.contract_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-xs font-bold transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View / Download Contract Document
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* VERIFYING PAYSTACK RETURN */}
            {verifyingReturn && (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-center">
                <Loader2 className="w-7 h-7 animate-spin text-[#C9A66B]" />
                <p className="text-sm font-semibold text-white">Verifying your payment...</p>
                <p className="text-xs text-slate-400">
                  Confirming with Paystack and updating your project status.
                </p>
              </div>
            )}

            {/* PAID RECEIPT VIEW */}
            {!verifyingReturn && isPaid && (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Payment Verified &amp; Confirmed</h2>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Thank you, {invoice.client_name}! Your payment has been received and your project
                    has been moved to{" "}
                    <strong>
                      {invoice.invoice_type === "final_balance" ||
                      invoice.invoice_type === "full_payment"
                        ? "Full Payment Made"
                        : "Ongoing Project"}
                    </strong>
                    .
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-left space-y-1.5">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Invoice Number:</span>
                    <span className="text-white font-semibold">{invoice.invoice_number}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Amount Paid:</span>
                    <span className="text-emerald-400 font-bold">
                      KES {Number(invoice.paid_amount || invoice.amount_kes).toLocaleString("en-KE")}
                    </span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-400">Payment Method:</span>
                    <span className="text-white uppercase">
                      {invoice.payment_method?.replace(/_/g, " ") || "Verified"}
                    </span>
                  </div>
                  {invoice.payment_reference && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Receipt / Reference:</span>
                      <span className="text-[#C9A66B] font-semibold">
                        {invoice.payment_reference}
                      </span>
                    </div>
                  )}
                  {invoice.paid_at && (
                    <div className="flex justify-between gap-2">
                      <span className="text-slate-400">Paid At:</span>
                      <span className="text-slate-200">
                        {new Date(invoice.paid_at).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-white cursor-pointer"
                >
                  Print / Save Receipt as PDF
                </button>
              </div>
            )}

            {/* ACTIVE PAYMENT CHECKOUT VIEW */}
            {!verifyingReturn && !isPaid && (
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5">
                    Choose How You Want to Pay ({formattedAmount})
                  </p>

                  <div className={`grid gap-3 ${mpesaAllowed && cardAllowed ? "grid-cols-2" : "grid-cols-1"}`}>
                    {mpesaAllowed && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMethod("mpesa")
                          setErrorMsg("")
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          selectedMethod === "mpesa"
                            ? "bg-emerald-500/15 border-emerald-400/75 text-white shadow-lg shadow-emerald-500/10"
                            : "bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/25"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Smartphone className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold uppercase tracking-wider">M-Pesa</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Safaricom STK Push (up to KES 150,000)
                        </p>
                      </button>
                    )}

                    {cardAllowed && (
                      <button
                        type="button"
                        onClick={() => {
                          stopPolling()
                          setMpesaPhase("idle")
                          setSelectedMethod("card")
                          setErrorMsg("")
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                          selectedMethod === "card"
                            ? "bg-[#C9A66B]/15 border-[#C9A66B] text-white shadow-lg shadow-[#C9A66B]/15"
                            : "bg-white/[0.02] border-white/10 text-slate-400 hover:border-white/25"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <CreditCard className="w-4 h-4 text-[#C9A66B]" />
                          <span className="text-xs font-bold uppercase tracking-wider">
                            Card (Global)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Visa, Mastercard, Apple Pay &bull; International
                        </p>
                      </button>
                    )}
                  </div>
                </div>

                {/* M-PESA TAB */}
                {selectedMethod === "mpesa" && mpesaAllowed && (
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-emerald-500/35 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                        <Smartphone className="w-4 h-4" /> Pay via M-Pesa
                      </span>
                      <span className="text-[11px] text-emerald-400 inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Instant Verification
                      </span>
                    </div>

                    {exceedsMpesaLimit ? (
                      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/40 space-y-2 text-xs text-amber-200">
                        <p className="font-bold">Safaricom M-Pesa Single Transaction Limit: KES 150,000</p>
                        <p className="text-amber-200/85 leading-relaxed">
                          This invoice is <strong>{formattedAmount}</strong>, which exceeds Safaricom&apos;s
                          KES 150,000 per-transaction M-Pesa cap. Please switch to{" "}
                          <strong>Card (Visa / Mastercard)</strong> for instant full payment, or request
                          split milestone invoices.
                        </p>
                        {cardAllowed && (
                          <button
                            type="button"
                            onClick={() => setSelectedMethod("card")}
                            className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#C9A66B] text-slate-950 font-bold text-xs cursor-pointer"
                          >
                            Switch to Card Payment <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
                            M-Pesa Phone Number
                          </label>
                          <input
                            type="tel"
                            value={mpesaPhone}
                            onChange={(e) => setMpesaPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                            placeholder="0712345678"
                            disabled={mpesaPhase === "sending" || mpesaPhase === "waiting"}
                            className="w-full bg-white/[0.05] border border-white/15 rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        {mpesaPhase !== "waiting" && (
                          <div className="space-y-2.5">
                            <button
                              type="button"
                              disabled={mpesaPhase === "sending" || !mpesaPhone.trim()}
                              onClick={handleDirectMpesaStk}
                              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-45 cursor-pointer"
                            >
                              {mpesaPhase === "sending" ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Sending M-Pesa PIN Prompt...
                                </>
                              ) : (
                                <>
                                  Pay Now — {formattedAmount} via M-Pesa
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </button>

                            {paystackConfigured && (
                              <button
                                type="button"
                                disabled={payingPaystackMpesa}
                                onClick={() => handlePaystackCheckout("mpesa")}
                                className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-slate-300 text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                {payingPaystackMpesa ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                )}
                                Or Pay via Paystack M-Pesa Hosted Page
                              </button>
                            )}
                          </div>
                        )}

                        {mpesaPhase === "waiting" && (
                          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-400/40 space-y-2 text-xs">
                            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Waiting for your M-Pesa PIN confirmation...
                            </div>
                            <p className="text-slate-300 text-[11px]">
                              Check your phone and enter your M-Pesa PIN. This page will automatically
                              show your verified receipt once Safaricom confirms payment.
                            </p>
                          </div>
                        )}

                        {mpesaPhase === "timeout" && (
                          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-400/40 space-y-2 text-xs text-amber-200">
                            <p>Still waiting for M-Pesa confirmation. Click below to refresh status.</p>
                            <button
                              type="button"
                              onClick={() => loadInvoice()}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-100 font-semibold cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Re-check Payment Status
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* CARD TAB (LOCAL & INTERNATIONAL VIA PAYSTACK) */}
                {selectedMethod === "card" && cardAllowed && (
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-[#C9A66B]/45 space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#E5C687] flex items-center gap-2">
                        <CreditCard className="w-4 h-4" /> Pay with Card (Local &amp; International)
                      </span>
                      <span className="text-[11px] text-[#C9A66B] inline-flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" /> Visa / Mastercard / Apple Pay
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      Works worldwide with Kenyan and international debit/credit cards via Paystack&apos;s
                      PCI-DSS encrypted checkout. No KES 150,000 M-Pesa cap — ideal for project
                      deposits and full payments.
                    </p>

                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-slate-400 mb-1.5">
                        Email Address (For Instant Payment Receipt)
                      </label>
                      <input
                        type="email"
                        value={payerEmail}
                        onChange={(e) => setPayerEmail(e.target.value)}
                        placeholder="you@company.com"
                        className="w-full bg-white/[0.05] border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#C9A66B]"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={payingCard}
                      onClick={() => handlePaystackCheckout("card")}
                      className="w-full py-3.5 rounded-xl bg-[#C9A66B] hover:bg-[#d8b77c] text-[#07070B] font-extrabold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#C9A66B]/25 disabled:opacity-45 cursor-pointer"
                    >
                      {payingCard ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Opening Secure Paystack Card Checkout...
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          Pay Now — {formattedAmount} with Card
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-500">
          Powered by {org?.name || "cillah.dev"} Finance &bull; Verified Paystack &amp; M-Pesa Settlement
        </p>
      </div>
    </main>
  )
}
