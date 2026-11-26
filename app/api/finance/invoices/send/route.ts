import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerSupabase } from "@/lib/supabase/server"
import { CILLAH_ORG_ID, getServiceSupabase } from "@/lib/finance-settlement"
import { sendWhatsAppTextMessage } from "@/lib/whatsapp"

function buildBrandedEmailHtml(params: {
  orgName: string
  clientName: string
  invoiceNumber: string
  title: string
  amountFormatted: string
  payUrl: string
  contractUrl?: string | null
  contractName?: string | null
  contractNotes?: string | null
  customMessage?: string | null
  methodsText: string
}) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#07070B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#F9F7F6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#07070B;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#0E131F;border:1px solid #262C3D;border-radius:18px;overflow:hidden;">
          <tr>
            <td style="padding:28px 32px;background:linear-gradient(135deg,#19150E 0%,#0E131F 100%);border-bottom:1px solid rgba(201,166,107,0.35);">
              <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C9A66B;margin-bottom:6px;">
                ${params.orgName} &bull; Official Invoice &amp; Agreement
              </div>
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#FFFFFF;">
                ${params.title}
              </h1>
              <p style="margin:6px 0 0;font-size:12px;color:#94A3B8;">
                Invoice Reference: <strong style="color:#E5C687;">${params.invoiceNumber}</strong>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:#E2E8F0;">
                Hi ${params.clientName},
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#CBD5E1;">
                ${
                  params.customMessage ||
                  `We are excited to get started together! Please review your agreement and complete the agreed payment below using ${params.methodsText}.`
                }
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="background:#070A12;border:1px solid rgba(201,166,107,0.35);border-radius:14px;margin-bottom:22px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.2px;color:#94A3B8;">Agreed Amount Due</div>
                    <div style="font-size:28px;font-weight:800;color:#C9A66B;margin-top:4px;">${params.amountFormatted}</div>
                    <div style="font-size:12px;color:#94A3B8;margin-top:6px;">Accepted Methods: <strong style="color:#E2E8F0;">${params.methodsText}</strong></div>
                  </td>
                </tr>
              </table>

              ${
                params.contractUrl
                  ? `<div style="background:#111827;border:1px solid #1F2937;border-radius:12px;padding:14px 16px;margin-bottom:22px;">
                      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#38BDF8;font-weight:700;margin-bottom:6px;">Attached Contract / Proposal</div>
                      <div style="font-size:13px;color:#F8FAFC;font-weight:600;margin-bottom:8px;">${params.contractName || "Client Agreement Document"}</div>
                      ${params.contractNotes ? `<div style="font-size:12px;color:#94A3B8;margin-bottom:10px;">${params.contractNotes}</div>` : ""}
                      <a href="${params.contractUrl}" target="_blank" style="display:inline-block;padding:8px 14px;background:#1E293B;border:1px solid #334155;border-radius:8px;color:#38BDF8;text-decoration:none;font-size:12px;font-weight:600;">
                        View / Download Contract &rarr;
                      </a>
                    </div>`
                  : ""
              }

              <div style="text-align:center;margin:26px 0 18px;">
                <a href="${params.payUrl}" target="_blank" style="display:inline-block;padding:16px 38px;background:#C9A66B;color:#07070B;font-size:15px;font-weight:800;text-decoration:none;border-radius:12px;letter-spacing:0.4px;">
                  PAY NOW &mdash; ${params.amountFormatted}
                </a>
              </div>

              <p style="margin:0;font-size:12px;color:#94A3B8;text-align:center;">
                Or open your secure checkout link directly:<br/>
                <a href="${params.payUrl}" style="color:#C9A66B;word-break:break-all;">${params.payUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#080B13;border-top:1px solid #1E293B;font-size:11px;color:#64748B;text-align:center;">
              Sent securely via ${params.orgName} Finance Department. Once payment is completed, your project status updates automatically.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createServerSupabase()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { invoiceId, channel, customMessage } = body as {
      invoiceId?: string
      channel?: "email" | "whatsapp" | "sms"
      customMessage?: string
    }

    if (!invoiceId || !channel) {
      return NextResponse.json(
        { error: "invoiceId and channel (email | whatsapp | sms) are required." },
        { status: 400 }
      )
    }

    const db = getServiceSupabase()
    const { data: invoice, error: invErr } = await db
      .from("finance_invoices")
      .select("*")
      .eq("id", invoiceId)
      .maybeSingle()

    if (invErr || !invoice) {
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 })
    }

    const { data: orgRow } = await db
      .from("organizations")
      .select("name, slug")
      .eq("id", invoice.org_id)
      .maybeSingle()

    const orgName = orgRow?.name || (invoice.org_slug === "rosy-realtors" ? "Rosy Realtors Nairobi" : "cillah.dev")
    const protocol = request.headers.get("x-forwarded-proto") || "https"
    const host = request.headers.get("host") || "www.cillah.dev"
    const payUrl = `${protocol}://${host}/pay/${invoice.public_token}`
    const amountFormatted = `KES ${Number(invoice.amount_kes).toLocaleString("en-KE")}`
    const methodsText = (invoice.allowed_methods || ["mpesa", "card"])
      .map((m: string) => (m === "mpesa" ? "M-Pesa" : "Card (Visa/Mastercard)"))
      .join(" or ")

    const firstName = String(invoice.client_name || "there").trim().split(" ")[0]
    const plainMessage = [
      `Hi ${firstName},`,
      ``,
      customMessage?.trim() ||
        `We're excited to work together on ${invoice.title}! Here is your official invoice (${invoice.invoice_number}) for ${amountFormatted}.`,
      invoice.contract_url ? `` : null,
      invoice.contract_url ? `Contract / Proposal: ${invoice.contract_url}` : null,
      ``,
      `Click below to review & Pay Now (${methodsText}):`,
      payUrl,
      ``,
      `— ${orgName} Finance`,
    ]
      .filter((line) => line !== null)
      .join("\n")

    let deliveredDirectly = false
    let deliveryNote = ""

    // 1. Direct API delivery when server credentials are configured
    if (channel === "email" && invoice.client_email) {
      const html = buildBrandedEmailHtml({
        orgName,
        clientName: invoice.client_name,
        invoiceNumber: invoice.invoice_number,
        title: invoice.title,
        amountFormatted,
        payUrl,
        contractUrl: invoice.contract_url,
        contractName: invoice.contract_name,
        contractNotes: invoice.contract_notes,
        customMessage,
        methodsText,
      })

      const resendKey = process.env.RESEND_API_KEY
      const emailWebhook = process.env.FINANCE_EMAIL_WEBHOOK_URL

      if (resendKey) {
        const fromAddr =
          process.env.RESEND_FROM_EMAIL || `${orgName} Finance <atulah@cillah.dev>`
        const res = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromAddr,
            reply_to: "atulah@cillah.dev",
            to: [invoice.client_email],
            subject: `${orgName} Invoice ${invoice.invoice_number} — ${amountFormatted} (Pay Now)`,
            html,
          }),
        })
        if (res.ok) {
          deliveredDirectly = true
          deliveryNote = `Branded Pay Now email sent directly to ${invoice.client_email}.`
        }
      } else if (emailWebhook) {
        const res = await fetch(emailWebhook, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: invoice.client_email,
            subject: `${orgName} Invoice ${invoice.invoice_number} — ${amountFormatted} (Pay Now)`,
            html,
            text: plainMessage,
            payUrl,
            contractUrl: invoice.contract_url,
            invoiceNumber: invoice.invoice_number,
          }),
        })
        if (res.ok) {
          deliveredDirectly = true
          deliveryNote = `Email dispatched via webhook to ${invoice.client_email}.`
        }
      }
    } else if (channel === "whatsapp" && invoice.client_phone) {
      if (process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN) {
        const waRes = await sendWhatsAppTextMessage({
          to: invoice.client_phone,
          text: plainMessage,
        })
        if (waRes.success) {
          deliveredDirectly = true
          deliveryNote = `WhatsApp Pay Now message sent directly to ${invoice.client_phone}.`
        }
      }
    }

    // 2. Build universal 1-click launch URLs (always work even without external email/SMS APIs)
    let cleanPhone = String(invoice.client_phone || "").replace(/\D/g, "")
    if (cleanPhone.startsWith("0") && cleanPhone.length === 10) {
      cleanPhone = "254" + cleanPhone.slice(1)
    }

    const whatsappUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(plainMessage)}`
      : `https://wa.me/?text=${encodeURIComponent(plainMessage)}`

    const smsUrl = cleanPhone
      ? `sms:+${cleanPhone}?body=${encodeURIComponent(plainMessage)}`
      : `sms:?body=${encodeURIComponent(plainMessage)}`

    const gmailParams = new URLSearchParams({
      view: "cm",
      fs: "1",
      to: invoice.client_email || "",
      su: `${orgName} — ${invoice.title} (${amountFormatted} • Pay Now)`,
      body: plainMessage,
    })
    if (user.email) gmailParams.set("authuser", user.email)
    const gmailComposeUrl = `https://mail.google.com/mail/?${gmailParams.toString()}`

    // 3. Auto-link CRM lead (if not yet linked) + move lead to "Invoice" stage + log activity
    const existingSentVia: string[] = Array.isArray(invoice.sent_via) ? invoice.sent_via : []
    const nextSentVia = Array.from(new Set([...existingSentVia, channel]))
    const nextStatus = invoice.status === "payment_made" ? "payment_made" : "sent"
    const nowIso = new Date().toISOString()

    let resolvedLeadId: string | null = invoice.lead_id || null
    if (!resolvedLeadId) {
      const { data: candidateLeads } = await db
        .from("sales_leads")
        .select("id, full_name, email, phone_number, stage")
        .neq("stage", "trash")
        .order("updated_at", { ascending: false })
        .limit(250)

      const emailLower = String(invoice.client_email || "").toLowerCase().trim()
      const phoneTail = String(invoice.client_phone || "").replace(/\D/g, "").slice(-9)
      const nameLower = String(invoice.client_name || "").toLowerCase().trim()

      const matched =
        (emailLower
          ? (candidateLeads || []).find(
              (l: any) => String(l.email || "").toLowerCase().trim() === emailLower
            )
          : null) ||
        (phoneTail.length >= 9
          ? (candidateLeads || []).find(
              (l: any) => String(l.phone_number || "").replace(/\D/g, "").slice(-9) === phoneTail
            )
          : null) ||
        (candidateLeads || []).find(
          (l: any) => String(l.full_name || "").toLowerCase().trim() === nameLower
        )

      if (matched) resolvedLeadId = matched.id
    }

    await db
      .from("finance_invoices")
      .update({
        status: nextStatus,
        sent_via: nextSentVia,
        sent_at: nowIso,
        lead_id: resolvedLeadId,
        updated_at: nowIso,
      })
      .eq("id", invoice.id)

    if (resolvedLeadId) {
      const callerEmail = (user.email || "").toLowerCase()
      const agentEmail = invoice.org_id === CILLAH_ORG_ID ? "atulah@cillah.dev" : callerEmail

      // Move lead to "invoice" stage unless already paid / ongoing / won
      const { data: currentLead } = await db
        .from("sales_leads")
        .select("stage")
        .eq("id", resolvedLeadId)
        .maybeSingle()

      const postPaymentStages = new Set([
        "closed_won",
        "ongoing_project",
        "done_delivered",
        "full_payment_made",
      ])

      const exactDateTime = new Intl.DateTimeFormat("en-KE", {
        timeZone: "Africa/Nairobi",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }).format(new Date(nowIso))

      const sendTasks: Promise<any>[] = [
        Promise.resolve(
          db.from("lead_notes").insert({
            lead_id: resolvedLeadId,
            author_email: callerEmail,
            author_name: callerEmail.split("@")[0],
            source: "invoice_sent",
            note_text: [
              `INVOICE SENT — ${invoice.invoice_number} (${amountFormatted})`,
              `Date & Time: ${exactDateTime} EAT`,
              `Channel: ${channel.toUpperCase()}`,
              `Pay Now Link: ${payUrl}`,
            ].join("\n"),
          })
        ),
        Promise.resolve(
          db.from("lead_activities").insert({
            lead_id: resolvedLeadId,
            org_id: invoice.org_id,
            agent_email: agentEmail,
            agent_name: agentEmail === "atulah@cillah.dev" ? "Atulah" : agentEmail.split("@")[0],
            lead_name: invoice.client_name,
            activity_type: "invoice_sent",
            summary: `Sent Pay Now link (${invoice.invoice_number} • ${amountFormatted}) via ${channel.toUpperCase()} on ${exactDateTime} EAT`,
            created_at: nowIso,
          })
        ),
      ]

      if (!currentLead?.stage || !postPaymentStages.has(currentLead.stage)) {
        sendTasks.push(
          Promise.resolve(
            db
              .from("sales_leads")
              .update({
                stage: "invoice",
                last_interaction_at: nowIso,
                updated_at: nowIso,
              })
              .eq("id", resolvedLeadId)
          )
        )
      }

      await Promise.allSettled(sendTasks)
    }

    return NextResponse.json({
      success: true,
      deliveredDirectly,
      deliveryNote,
      payUrl,
      plainMessage,
      whatsappUrl,
      smsUrl,
      gmailComposeUrl,
    })
  } catch (err: any) {
    console.error("[Finance Invoice Send] Error:", err)
    return NextResponse.json(
      { error: err?.message || "Failed to send invoice" },
      { status: 500 }
    )
  }
}
