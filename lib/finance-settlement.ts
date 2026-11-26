import { createClient } from "@supabase/supabase-js"

export const CILLAH_ORG_ID = "a1b2c3d4-e5f6-7890-abcd-222222222222"
export const ROSY_ORG_ID = "a1b2c3d4-e5f6-7890-abcd-555555555555"

export function getServiceSupabase() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "")
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase service role credentials")
  }
  return createClient(supabaseUrl, serviceKey)
}

export interface SettleInvoiceParams {
  invoiceId: string
  paymentMethod: "mpesa" | "card" | "paystack_mpesa" | "paystack_card"
  paymentReference: string
  paidAmount?: number | null
}

/**
 * Atomically marks a finance invoice as `payment_made`, advances the linked CRM lead
 * to `ongoing_project` (or `full_payment_made` for final_balance / full_payment),
 * updates the lead's KES deal value (which updates Won Deals in KES!), and logs
 * both a lead note and an agent activity entry strictly scoped to the invoice's org.
 */
export async function settleInvoiceAndAdvancePipeline(params: SettleInvoiceParams) {
  const supabase = getServiceSupabase()
  const nowIso = new Date().toISOString()

  // Fetch invoice first so we know its amount and lead link
  const { data: existingInvoice, error: fetchErr } = await supabase
    .from("finance_invoices")
    .select("*")
    .eq("id", params.invoiceId)
    .maybeSingle()

  if (fetchErr || !existingInvoice) {
    console.error("[Finance Settlement] Invoice not found:", params.invoiceId, fetchErr)
    return { ok: false, alreadyPaid: false, invoice: null }
  }

  if (existingInvoice.status === "payment_made") {
    return { ok: true, alreadyPaid: true, invoice: existingInvoice }
  }

  const resolvedPaidAmount =
    params.paidAmount && Number(params.paidAmount) > 0
      ? Number(params.paidAmount)
      : Number(existingInvoice.amount_kes)

  // Atomic idempotent transition: only mark payment_made ONCE
  const { data: paidInvoice, error: updateErr } = await supabase
    .from("finance_invoices")
    .update({
      status: "payment_made",
      payment_method: params.paymentMethod,
      payment_reference: params.paymentReference,
      paid_amount: resolvedPaidAmount,
      paid_at: nowIso,
      updated_at: nowIso,
    })
    .eq("id", params.invoiceId)
    .neq("status", "payment_made")
    .select("*")
    .maybeSingle()

  if (updateErr || !paidInvoice) {
    // Another webhook/request won the race
    return { ok: true, alreadyPaid: true, invoice: existingInvoice }
  }

  // Advance linked CRM lead & update Won Deals KES amount (scoped to the invoice's own organization!)
  if (paidInvoice.lead_id) {
    try {
      const { data: lead } = await supabase
        .from("sales_leads")
        .select("*")
        .eq("id", paidInvoice.lead_id)
        .maybeSingle()

      if (lead) {
        // Compute total confirmed paid KES across all paid invoices for this lead
        const { data: leadPaidInvoices } = await supabase
          .from("finance_invoices")
          .select("paid_amount, amount_kes")
          .eq("lead_id", lead.id)
          .eq("status", "payment_made")

        const totalPaidForLead = (leadPaidInvoices || []).reduce(
          (sum, row: any) => sum + (Number(row.paid_amount) || Number(row.amount_kes) || 0),
          0
        )

        // Decide next pipeline column:
        // - Final Balance / Full Payment (or already Done & Delivered) -> 'full_payment_made'
        // - Deposit / Milestone / Retainer -> 'ongoing_project'
        const isFinalPayment =
          paidInvoice.invoice_type === "final_balance" ||
          paidInvoice.invoice_type === "full_payment" ||
          lead.stage === "done_delivered"

        const nextStage = isFinalPayment ? "full_payment_made" : "ongoing_project"
        const nextStageLabel = isFinalPayment ? "Full Payment Made" : "Ongoing Project"

        // Update estimated_value to reflect confirmed KES paid (keeps Won Deals accurate in KES!)
        const updatedValue = Math.max(Number(lead.estimated_value) || 0, totalPaidForLead)

        await supabase
          .from("sales_leads")
          .update({
            stage: nextStage,
            estimated_value: updatedValue,
            last_interaction_at: nowIso,
            updated_at: nowIso,
          })
          .eq("id", lead.id)

        const methodPretty =
          params.paymentMethod === "card" || params.paymentMethod === "paystack_card"
            ? "Card (Paystack)"
            : params.paymentMethod === "paystack_mpesa"
            ? "M-Pesa (Paystack)"
            : "M-Pesa Express"

        const agentEmail =
          paidInvoice.org_id === CILLAH_ORG_ID
            ? "atulah@cillah.dev"
            : lead.assigned_agent_email || paidInvoice.created_by_email

        const noteText = [
          `PAYMENT MADE — Invoice ${paidInvoice.invoice_number}`,
          `Amount Received: KES ${resolvedPaidAmount.toLocaleString("en-KE")}`,
          `Payment Method: ${methodPretty}`,
          `Reference / Receipt: ${params.paymentReference}`,
          `Pipeline Updated: Automatically moved to "${nextStageLabel}"`,
          paidInvoice.contract_name ? `Contract Attached: ${paidInvoice.contract_name}` : null,
        ]
          .filter(Boolean)
          .join("\n")

        await Promise.allSettled([
          supabase.from("lead_notes").insert({
            lead_id: lead.id,
            author_email: agentEmail,
            author_name: "Finance Billing System",
            source: "payment_received",
            note_text: noteText,
          }),
          supabase.from("lead_activities").insert({
            lead_id: lead.id,
            org_id: paidInvoice.org_id,
            agent_email: agentEmail,
            agent_name: agentEmail === "atulah@cillah.dev" ? "Atulah" : agentEmail.split("@")[0],
            lead_name: lead.full_name,
            activity_type: "payment_received",
            summary: `Payment made by ${lead.full_name} — KES ${resolvedPaidAmount.toLocaleString(
              "en-KE"
            )} via ${methodPretty} (${paidInvoice.invoice_number}). Moved to ${nextStageLabel}.`,
            metadata: {
              invoice_id: paidInvoice.id,
              invoice_number: paidInvoice.invoice_number,
              amount_kes: resolvedPaidAmount,
              payment_method: params.paymentMethod,
              payment_reference: params.paymentReference,
              new_stage: nextStage,
            },
            created_at: nowIso,
          }),
        ])
      }
    } catch (leadErr: any) {
      console.error("[Finance Settlement] Failed to advance lead pipeline:", leadErr.message)
    }
  }

  return { ok: true, alreadyPaid: false, invoice: paidInvoice }
}
