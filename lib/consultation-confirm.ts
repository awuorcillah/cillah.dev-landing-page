import { createClient } from "@supabase/supabase-js"
import { createCalendarEvent } from "@/lib/google-calendar"
import { CONSULTATION_PRICE_DISPLAY } from "@/lib/consultation-price"
import { sendMetaCapiEvent } from "@/lib/meta-capi"

function getServiceSupabase() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "")
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Missing Supabase service role credentials")
  }
  return createClient(supabaseUrl, serviceKey)
}

export interface FinalizeConsultationParams {
  bookingId: string
  paymentProvider: "mpesa" | "paystack_card"
  receipt: string
  paidAmountKes?: number | null
  paidPhone?: string | null
  resultDesc?: string
  paystackChannel?: string | null
}

export interface FinalizeConsultationResult {
  alreadyProcessed: boolean
  bookingId: string
  status: string
  receipt: string
  googleMeetUrl: string
  calendarEventUrl: string
  fullName?: string
  scheduledAt?: string
}

/**
 * Atomic, idempotent confirmation pipeline shared by BOTH Safaricom Daraja M-Pesa callback
 * and Paystack Card verification/webhook. Transitions pending_payment -> paid ONCE, creates
 * Google Calendar event + Meet link, inserts CRM lead under atulah@cillah.dev, fires webhook & Meta CAPI.
 */
export async function finalizeConfirmedConsultation(
  params: FinalizeConsultationParams
): Promise<FinalizeConsultationResult | null> {
  const supabase = getServiceSupabase()
  const paidAtIso = new Date().toISOString()

  const updateFields: Record<string, any> = {
    status: "paid",
    payment_provider: params.paymentProvider,
    mpesa_receipt: params.receipt || null,
    mpesa_result_code: 0,
    mpesa_result_desc:
      params.resultDesc ||
      (params.paymentProvider === "paystack_card"
        ? "Card payment verified via Paystack."
        : "The service request is processed successfully."),
    paid_at: paidAtIso,
    updated_at: paidAtIso,
  }

  if (params.paystackChannel) {
    updateFields.paystack_channel = params.paystackChannel
  }

  // Atomic idempotency guard: only transition pending_payment -> paid ONCE
  const { data: claimedRow, error: claimErr } = await supabase
    .from("consultation_payments")
    .update(updateFields)
    .eq("id", params.bookingId)
    .eq("status", "pending_payment")
    .select("*")
    .maybeSingle()

  if (claimErr) {
    console.error("[Consultation Confirm] Failed to claim booking as paid:", claimErr)
    return null
  }

  if (!claimedRow) {
    // Already processed — fetch existing confirmed row so callers get the links
    const { data: existing } = await supabase
      .from("consultation_payments")
      .select("id, status, mpesa_receipt, google_meet_url, calendar_event_url, full_name, scheduled_at")
      .eq("id", params.bookingId)
      .maybeSingle()

    if (!existing) return null
    return {
      alreadyProcessed: true,
      bookingId: existing.id,
      status: existing.status,
      receipt: existing.mpesa_receipt || params.receipt || "",
      googleMeetUrl: existing.google_meet_url || "",
      calendarEventUrl: existing.calendar_event_url || "",
      fullName: existing.full_name,
      scheduledAt: existing.scheduled_at,
    }
  }

  const assignedAgentEmail = "atulah@cillah.dev"
  const cleanEmail = claimedRow.email
  const cleanPhone = claimedRow.phone || params.paidPhone || claimedRow.mpesa_phone
  const fullName = claimedRow.full_name
  const agencyName = claimedRow.agency_name || ""
  const websiteUrl = claimedRow.website_url || "N/A"
  const bottlenecks = claimedRow.bottlenecks || ""
  const scheduledAt = claimedRow.scheduled_at
  const receipt = params.receipt || claimedRow.paystack_reference || ""
  const methodLabel =
    params.paymentProvider === "paystack_card" ? "CARD (PAYSTACK VERIFIED)" : "M-PESA VERIFIED"
  const priceLabel = `KES ${Number(claimedRow.amount_kes).toLocaleString("en-US")} / $${Number(
    claimedRow.amount_usd
  ).toLocaleString("en-US")} USD`

  // 1. Create Google Calendar event on atulah@cillah.dev
  let calendarEventUrl = ""
  let googleMeetUrl = ""

  if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    try {
      const calResult = await createCalendarEvent({
        summary: `1-on-1 AI Strategy & Architecture Call — ${fullName} (${agencyName || "Cillah"})`,
        description: [
          `Client: ${fullName}`,
          `Email: ${cleanEmail}`,
          `Phone: ${cleanPhone}`,
          `Agency: ${agencyName || "N/A"}`,
          `Website: ${websiteUrl}`,
          `Primary Bottlenecks: ${bottlenecks || "N/A"}`,
          ``,
          `Payment: ${methodLabel} (${priceLabel})`,
          `Payment Receipt / Ref: ${receipt || "N/A"}`,
          `Assigned Advisor: Atulah (${assignedAgentEmail})`,
          `Booking confirmed via cillah.dev`,
        ].join("\n"),
        startDateTime: scheduledAt,
        guestEmail: cleanEmail,
      })
      calendarEventUrl = calResult.htmlLink
      googleMeetUrl = calResult.hangoutLink
    } catch (calErr: any) {
      console.error("[Consultation Confirm] Google Calendar error:", calErr.message)
    }
  }

  if (!calendarEventUrl) {
    const eventTitle = encodeURIComponent(
      `1-on-1 AI Strategy & Architecture Call — ${fullName} (Cillah)`
    )
    const eventDesc = encodeURIComponent(
      `Client: ${fullName}\nPhone: ${cleanPhone}\nEmail: ${cleanEmail}\nAgency: ${agencyName}\nReceipt: ${receipt}\nMeeting Platform: Google Meet`
    )
    const startDt = new Date(scheduledAt)
    const endDt = new Date(startDt.getTime() + 60 * 60 * 1000)
    const formatCalDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    calendarEventUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${formatCalDate(
      startDt
    )}/${formatCalDate(endDt)}&details=${eventDesc}&add=${encodeURIComponent(
      cleanEmail
    )}&add=${encodeURIComponent(assignedAgentEmail)}`
  }

  if (!googleMeetUrl) {
    googleMeetUrl = process.env.GOOGLE_MEET_URL || "https://meet.google.com/nic-uekp-fwh"
  }

  // 2. Record CRM lead, note, appointment & booking in Supabase (strictly under atulah@cillah.dev)
  let leadId: string | null = null
  try {
    let assignedAgentId: string | null = null
    const { data: staff } = await supabase
      .from("staff_members")
      .select("id")
      .eq("email", assignedAgentEmail)
      .maybeSingle()
    if (staff) assignedAgentId = staff.id

    const notesContent = [
      `Session: 1-on-1 AI Strategy & Architecture Call (${priceLabel || CONSULTATION_PRICE_DISPLAY})`,
      `Agency / Business: ${agencyName || "N/A"}`,
      `Website / Social: ${websiteUrl}`,
      `Primary Bottlenecks & Goals: ${bottlenecks || "N/A"}`,
      `Payment Method: ${methodLabel} (PAID — Ref: ${receipt || "N/A"})`,
      `Scheduled For: ${new Date(scheduledAt).toLocaleString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Nairobi",
      })} EAT`,
    ].join("\n")

    const { data: lead, error: leadErr } = await supabase
      .from("sales_leads")
      .insert({
        full_name: fullName,
        email: cleanEmail,
        phone_number: cleanPhone,
        company_name: agencyName || null,
        source: "website_appointment",
        stage: "viewing",
        assigned_agent_email: assignedAgentEmail,
        assigned_agent_id: assignedAgentId,
        is_qualified: true,
        estimated_value: claimedRow.amount_kes,
        initial_note: notesContent,
        viewing_date: scheduledAt,
        followup_status: "active",
        next_followup_at: scheduledAt,
        followup_title: "Booked Consultation Reminder",
        created_at: paidAtIso,
        updated_at: paidAtIso,
      })
      .select("id")
      .single()

    if (leadErr) {
      console.error("[Consultation Confirm] sales_leads insert error:", leadErr)
    }

    if (lead?.id) {
      leadId = lead.id
      await Promise.allSettled([
        supabase.from("lead_notes").insert({
          lead_id: leadId,
          author_email: assignedAgentEmail,
          author_name: "Cillah Booking System",
          source: "website_appointment",
          note_text: notesContent,
        }),
        supabase.from("appointments").insert({
          lead_id: leadId,
          assigned_agent_email: assignedAgentEmail,
          title: `1-on-1 AI Strategy Call: ${fullName}`,
          description: `Agency: ${agencyName || "N/A"} | Ref: ${receipt} | Focus: ${bottlenecks || "N/A"}`,
          scheduled_at: scheduledAt,
          duration_minutes: 60,
          meeting_link: googleMeetUrl,
          status: "upcoming",
        }),
        supabase.from("lead_activities").insert({
          lead_id: leadId,
          org_id: "a1b2c3d4-e5f6-7890-abcd-222222222222",
          agent_email: assignedAgentEmail,
          agent_name: "Atulah",
          lead_name: fullName,
          activity_type: "consultation_paid",
          summary: `Paid consultation booked via ${
            params.paymentProvider === "paystack_card" ? "Card (Paystack)" : "M-Pesa"
          } (${priceLabel}) — Ref ${receipt}`,
          created_at: paidAtIso,
        }),
      ])
    }

    const { data: existingProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", cleanEmail)
      .limit(1)
    const userId = existingProfiles?.[0]?.id || null

    await supabase.from("bookings").insert({
      slug: `consultation-${String(claimedRow.id).slice(0, 8)}`,
      user_id: userId,
      scheduled_at: scheduledAt,
      status: "confirmed",
      payment_status: "paid",
      mpesa_checkout_request_id: claimedRow.checkout_request_id || claimedRow.paystack_reference || null,
      mpesa_receipt_number: receipt || null,
    })
  } catch (crmErr: any) {
    console.error("[Consultation Confirm] CRM record notice:", crmErr.message)
  }

  // 3. Fire confirmed-payment webhook if configured
  const webhookUrl =
    process.env.BOOKING_CONFIRMED_WEBHOOK_URL ||
    process.env.websiteWEBHOOKBOOKING_CONFIRMED_URL ||
    ""

  let webhookSent = false
  if (webhookUrl) {
    const scheduledAtEat = new Date(scheduledAt).toLocaleString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Africa/Nairobi",
    })

    const webhookPayload = {
      event: "consultation.paid_and_confirmed",
      bookingId: claimedRow.id,
      paymentMethod: params.paymentProvider === "paystack_card" ? "card_paystack" : "mpesa",
      paymentStatus: "paid",
      mpesaReceipt: receipt,
      amountKes: params.paidAmountKes ?? claimedRow.amount_kes,
      amountUsd: claimedRow.amount_usd,
      priceDisplay: priceLabel,
      paidAt: paidAtIso,
      client: {
        fullName,
        email: cleanEmail,
        phone: cleanPhone,
        mpesaPhone: params.paidPhone || claimedRow.mpesa_phone,
        agencyName,
        websiteUrl,
        bottlenecks,
      },
      appointment: {
        scheduledAt,
        scheduledAtEat: `${scheduledAtEat} EAT`,
        durationMinutes: 60,
        advisorEmail: assignedAgentEmail,
        googleMeetUrl,
        calendarEventUrl,
      },
      crm: {
        leadId,
      },
    }

    try {
      const whRes = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      })
      webhookSent = whRes.ok
    } catch (whErr: any) {
      console.error("[Consultation Confirm] Webhook request failed:", whErr.message)
    }
  }

  // 4. Meta CAPI server-side conversion events
  const usdVal = Number(claimedRow.amount_usd) || 1
  await Promise.allSettled([
    sendMetaCapiEvent({
      eventName: "Schedule",
      eventId: `consult-schedule-${claimedRow.id}`,
      eventSourceUrl: "https://www.cillah.dev/book-consultation",
      email: cleanEmail,
      phone: cleanPhone,
      fullName,
      externalId: claimedRow.id,
      customData: {
        content_name: "60-Minute Deep Dive Consultation",
        value: usdVal,
        currency: "USD",
      },
    }),
    sendMetaCapiEvent({
      eventName: "Purchase",
      eventId: `consult-purchase-${claimedRow.id}`,
      eventSourceUrl: "https://www.cillah.dev/book-consultation",
      email: cleanEmail,
      phone: cleanPhone,
      fullName,
      externalId: claimedRow.id,
      customData: {
        content_name: "60-Minute Deep Dive Consultation",
        value: usdVal,
        currency: "USD",
      },
    }),
  ])

  // 5. Save finalized links onto consultation_payments
  await supabase
    .from("consultation_payments")
    .update({
      google_meet_url: googleMeetUrl,
      calendar_event_url: calendarEventUrl,
      lead_id: leadId,
      webhook_sent: webhookSent,
      webhook_sent_at: webhookSent ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", claimedRow.id)

  return {
    alreadyProcessed: false,
    bookingId: claimedRow.id,
    status: "paid",
    receipt,
    googleMeetUrl,
    calendarEventUrl,
    fullName,
    scheduledAt,
  }
}
