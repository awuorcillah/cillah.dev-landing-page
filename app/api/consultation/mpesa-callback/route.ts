import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createCalendarEvent } from "@/lib/google-calendar"
import { CONSULTATION_PRICE_DISPLAY } from "@/lib/consultation-price"

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

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingIdParam = searchParams.get("bookingId")

    const payload = await request.json()
    console.log(
      `[Mpesa Callback] Received callback (bookingId=${bookingIdParam || "none"}):`,
      JSON.stringify(payload)
    )

    const stkCallback = payload.Body?.stkCallback
    if (!stkCallback) {
      console.error("[Mpesa Callback] Invalid callback format, missing stkCallback")
      return NextResponse.json({ error: "Invalid payload format" }, { status: 400 })
    }

    const checkoutRequestId: string | undefined = stkCallback.CheckoutRequestID
    const resultCode: number = Number(stkCallback.ResultCode)
    const resultDesc: string = String(stkCallback.ResultDesc || "")

    const supabase = getServiceSupabase()

    // Locate the pending booking by bookingId (or fallback to checkout_request_id)
    let bookingRow: any = null
    if (bookingIdParam) {
      const { data } = await supabase
        .from("consultation_payments")
        .select("*")
        .eq("id", bookingIdParam)
        .maybeSingle()
      bookingRow = data
    }

    if (!bookingRow && checkoutRequestId) {
      const { data } = await supabase
        .from("consultation_payments")
        .select("*")
        .eq("checkout_request_id", checkoutRequestId)
        .maybeSingle()
      bookingRow = data
    }

    if (!bookingRow) {
      console.error(
        `[Mpesa Callback] No matching consultation_payments record found (bookingId=${bookingIdParam}, checkoutRequestId=${checkoutRequestId})`
      )
      return NextResponse.json({ ResponseCode: "0", ResponseDesc: "Accepted" })
    }

    // Payment failed or cancelled by customer
    if (resultCode !== 0) {
      const failStatus = resultCode === 1032 ? "cancelled" : "failed"
      console.warn(
        `[Mpesa Callback] Payment ${failStatus} for booking ${bookingRow.id}. Code=${resultCode}, Desc=${resultDesc}`
      )

      await supabase
        .from("consultation_payments")
        .update({
          status: failStatus,
          mpesa_result_code: resultCode,
          mpesa_result_desc: resultDesc || "Payment was not completed.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingRow.id)
        .eq("status", "pending_payment")

      return NextResponse.json({ ResponseCode: "0", ResponseDesc: "Accepted" })
    }

    // Payment succeeded (ResultCode === 0): extract receipt & paid amount
    let mpesaReceipt = ""
    let paidPhone = ""
    let paidAmount: number | null = null

    const metadataItems = stkCallback.CallbackMetadata?.Item
    if (Array.isArray(metadataItems)) {
      for (const item of metadataItems) {
        if (item.Name === "MpesaReceiptNumber") {
          mpesaReceipt = item.Value?.toString() || ""
        } else if (item.Name === "PhoneNumber") {
          paidPhone = item.Value?.toString() || ""
        } else if (item.Name === "Amount") {
          const parsedAmt = Number(item.Value)
          if (!Number.isNaN(parsedAmt)) paidAmount = parsedAmt
        }
      }
    }

    // Atomic idempotency guard: only transition pending_payment -> paid ONCE
    const paidAtIso = new Date().toISOString()
    const { data: claimedRow, error: claimErr } = await supabase
      .from("consultation_payments")
      .update({
        status: "paid",
        mpesa_receipt: mpesaReceipt || null,
        mpesa_result_code: 0,
        mpesa_result_desc: resultDesc || "The service request is processed successfully.",
        paid_at: paidAtIso,
        updated_at: paidAtIso,
      })
      .eq("id", bookingRow.id)
      .eq("status", "pending_payment")
      .select("*")
      .maybeSingle()

    if (claimErr) {
      console.error("[Mpesa Callback] Failed to claim booking as paid:", claimErr)
      return NextResponse.json({ ResponseCode: "0", ResponseDesc: "Accepted" })
    }

    if (!claimedRow) {
      console.log(`[Mpesa Callback] Booking ${bookingRow.id} was already processed; skipping duplicate work.`)
      return NextResponse.json({ ResponseCode: "0", ResponseDesc: "Already processed" })
    }

    console.log(
      `[Mpesa Callback] Payment VERIFIED for booking ${claimedRow.id}! Receipt=${mpesaReceipt}, Amount=${paidAmount ?? claimedRow.amount_kes}`
    )

    const assignedAgentEmail = "atulah@cillah.dev"
    const cleanEmail = claimedRow.email
    const cleanPhone = claimedRow.phone || paidPhone || claimedRow.mpesa_phone
    const fullName = claimedRow.full_name
    const agencyName = claimedRow.agency_name || ""
    const websiteUrl = claimedRow.website_url || "N/A"
    const bottlenecks = claimedRow.bottlenecks || ""
    const scheduledAt = claimedRow.scheduled_at
    const priceLabel = `KES ${Number(claimedRow.amount_kes).toLocaleString("en-US")} / $${Number(claimedRow.amount_usd).toLocaleString("en-US")} USD`

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
            `Payment: M-PESA VERIFIED (${priceLabel})`,
            `M-Pesa Receipt: ${mpesaReceipt || "N/A"}`,
            `Assigned Advisor: Atulah (${assignedAgentEmail})`,
            `Booking confirmed via cillah.dev`,
          ].join("\n"),
          startDateTime: scheduledAt,
          guestEmail: cleanEmail,
        })
        calendarEventUrl = calResult.htmlLink
        googleMeetUrl = calResult.hangoutLink
      } catch (calErr: any) {
        console.error("[Mpesa Callback] Google Calendar error:", calErr.message)
      }
    }

    if (!calendarEventUrl) {
      const eventTitle = encodeURIComponent(`1-on-1 AI Strategy & Architecture Call — ${fullName} (Cillah)`)
      const eventDesc = encodeURIComponent(
        `Client: ${fullName}\nPhone: ${cleanPhone}\nEmail: ${cleanEmail}\nAgency: ${agencyName}\nM-Pesa Receipt: ${mpesaReceipt}\nMeeting Platform: Google Meet`
      )
      const startDt = new Date(scheduledAt)
      const endDt = new Date(startDt.getTime() + 60 * 60 * 1000)
      const formatCalDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
      calendarEventUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${formatCalDate(startDt)}/${formatCalDate(endDt)}&details=${eventDesc}&add=${encodeURIComponent(cleanEmail)}&add=${encodeURIComponent(assignedAgentEmail)}`
    }

    if (!googleMeetUrl) {
      googleMeetUrl = process.env.GOOGLE_MEET_URL || "https://meet.google.com/nic-uekp-fwh"
    }

    // 2. Record CRM hot lead, appointment, and legacy booking in Supabase
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
        `Payment Method: MPESA (PAID — Receipt: ${mpesaReceipt || "N/A"})`,
        `Scheduled For: ${new Date(scheduledAt).toLocaleString("en-US", { timeZone: "Africa/Nairobi" })} EAT`,
      ].join(" | ")

      const { data: lead } = await supabase
        .from("sales_leads")
        .insert({
          full_name: fullName,
          email: cleanEmail,
          phone_number: cleanPhone,
          company_name: agencyName || null,
          source: "website_appointment",
          stage: "hot_lead",
          assigned_agent_email: assignedAgentEmail,
          assigned_agent_id: assignedAgentId,
          is_qualified: true,
          estimated_value: claimedRow.amount_kes,
          notes: notesContent,
          created_at: paidAtIso,
          updated_at: paidAtIso,
        })
        .select("id")
        .single()

      if (lead?.id) {
        leadId = lead.id
        await supabase.from("appointments").insert({
          lead_id: leadId,
          assigned_agent_email: assignedAgentEmail,
          title: `1-on-1 AI Strategy Call: ${fullName}`,
          description: `Agency: ${agencyName} | Receipt: ${mpesaReceipt} | Focus: ${bottlenecks}`,
          scheduled_at: scheduledAt,
          duration_minutes: 60,
          meeting_link: googleMeetUrl,
          status: "upcoming",
        })
      }

      const { data: existingProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", cleanEmail)
        .limit(1)
      const userId = existingProfiles?.[0]?.id || null

      await supabase.from("bookings").insert({
        user_id: userId,
        scheduled_at: scheduledAt,
        status: "confirmed",
        payment_status: "paid",
        notes: notesContent,
      })
    } catch (crmErr: any) {
      console.error("[Mpesa Callback] CRM record notice:", crmErr.message)
    }

    // 3. Fire confirmed-payment webhook (supports BOOKING_CONFIRMED_WEBHOOK_URL or websiteWEBHOOKBOOKING_CONFIRMED_URL)
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
        paymentMethod: "mpesa",
        paymentStatus: "paid",
        mpesaReceipt,
        amountKes: paidAmount ?? claimedRow.amount_kes,
        amountUsd: claimedRow.amount_usd,
        priceDisplay: priceLabel,
        paidAt: paidAtIso,
        client: {
          fullName,
          email: cleanEmail,
          phone: cleanPhone,
          mpesaPhone: paidPhone || claimedRow.mpesa_phone,
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
        console.log(`[Mpesa Callback] Firing confirmed-payment webhook to ${webhookUrl}`)
        const whRes = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webhookPayload),
        })
        webhookSent = whRes.ok
        if (!whRes.ok) {
          const whBody = await whRes.text().catch(() => "")
          console.error(`[Mpesa Callback] Webhook returned HTTP ${whRes.status}:`, whBody)
        } else {
          console.log("[Mpesa Callback] Webhook delivered successfully!")
        }
      } catch (whErr: any) {
        console.error("[Mpesa Callback] Webhook request failed:", whErr.message)
      }
    } else {
      console.warn("[Mpesa Callback] No BOOKING_CONFIRMED_WEBHOOK_URL configured; skipping webhook.")
    }

    // 4. Save finalized links and webhook delivery flag onto consultation_payments
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

    return NextResponse.json({
      ResponseCode: "0",
      ResponseDesc: "Callback processed successfully",
    })
  } catch (error) {
    console.error("[Mpesa Callback] Exception in callback route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
