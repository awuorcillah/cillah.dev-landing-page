import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createCalendarEvent } from '@/lib/google-calendar'
import { sendWhatsAppTextMessage } from '@/lib/whatsapp'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hastygfosgyxrxzrzrur.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(request: Request) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await request.json()
    const {
      fullName,
      email,
      phone,
      agencyName = '',
      websiteUrl = 'N/A',
      bottlenecks = '',
      scheduledAt,
      paymentMethod = 'mpesa',
      paymentStatus = 'paid',
      amount = 5000
    } = body

    if (!fullName || !email || !phone || !scheduledAt) {
      return NextResponse.json(
        { error: 'Full name, email, phone number, and scheduled appointment time are required' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    const cleanPhone = phone.trim()
    const assignedAgentEmail = 'atulah@cillah.dev'

    // 1. Find or create profile in profiles table
    let userId: string | null = null
    try {
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', cleanEmail)

      if (existingProfiles && existingProfiles.length > 0) {
        userId = existingProfiles[0].id
        await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            phone: cleanPhone,
            role: 'client',
            client_type: 'consultation',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)
      } else {
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({
            email: cleanEmail,
            full_name: fullName,
            phone: cleanPhone,
            role: 'client',
            client_type: 'consultation',
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (newProfile) {
          userId = newProfile.id
        }
      }
    } catch (profileErr) {
      console.warn('[Booking Create] Profile management notice:', profileErr)
    }

    // 2. Fetch assigned agent staff record (Atulah)
    let assignedAgentId: string | null = null
    try {
      const { data: staff } = await supabase
        .from('staff_members')
        .select('id, email')
        .eq('email', assignedAgentEmail)
        .single()

      if (staff) {
        assignedAgentId = staff.id
      }
    } catch (staffErr) {
      console.warn('[Booking Create] Staff fetch notice:', staffErr)
    }

    // 3. Ingest into sales_leads as HOT LEAD
    const notesContent = [
      `Session: 1-on-1 AI Strategy & Architecture Call (KES 5,000 / $40 USD)`,
      `Agency / Business: ${agencyName || 'N/A'}`,
      `Website / Social: ${websiteUrl || 'N/A'}`,
      `Primary Bottlenecks & Goals: ${bottlenecks || 'N/A'}`,
      `Payment Method: ${paymentMethod.toUpperCase()} (${paymentStatus.toUpperCase()})`,
      `Scheduled For: ${new Date(scheduledAt).toLocaleString('en-US', { timeZone: 'Africa/Nairobi' })} EAT`
    ].join(' | ')

    let leadId: string | null = null
    try {
      const { data: lead, error: leadErr } = await supabase
        .from('sales_leads')
        .insert({
          full_name: fullName,
          email: cleanEmail,
          phone_number: cleanPhone,
          company_name: agencyName || null,
          source: 'website_appointment',
          stage: 'hot_lead',
          assigned_agent_email: assignedAgentEmail,
          assigned_agent_id: assignedAgentId,
          is_qualified: true,
          estimated_value: amount,
          notes: notesContent,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (leadErr) {
        console.error('[Booking Create] sales_leads insert error:', leadErr)
      } else if (lead) {
        leadId = lead.id
      }
    } catch (leadEx) {
      console.error('[Booking Create] sales_leads exception:', leadEx)
    }

    // 4. Create Google Calendar event with Google Meet
    let calendarEventUrl = ''
    let googleMeetUrl = ''

    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      try {
        const calResult = await createCalendarEvent({
          summary: `1-on-1 AI Strategy & Architecture Call — ${fullName} (${agencyName || 'cillah.dev'})`,
          description: [
            `Client: ${fullName}`,
            `Email: ${cleanEmail}`,
            `Phone: ${cleanPhone}`,
            `Agency: ${agencyName || 'N/A'}`,
            `Website: ${websiteUrl || 'N/A'}`,
            `Primary Bottlenecks: ${bottlenecks || 'N/A'}`,
            ``,
            `Payment: ${paymentMethod.toUpperCase()} (Status: ${paymentStatus.toUpperCase()})`,
            `Assigned Advisor: Atulah (${assignedAgentEmail})`,
            `Booking confirmed via cillah.dev`
          ].join('\n'),
          startDateTime: scheduledAt,
          guestEmail: cleanEmail
        })

        calendarEventUrl = calResult.htmlLink
        googleMeetUrl = calResult.hangoutLink
      } catch (calErr: any) {
        console.warn('[Booking Create] Google Calendar API notice:', calErr.message)
      }
    }

    // Fallback Google Calendar Add-to-Calendar Template Link
    if (!calendarEventUrl) {
      const eventTitle = encodeURIComponent(`1-on-1 AI Strategy & Architecture Call — ${fullName} (cillah.dev)`)
      const eventDesc = encodeURIComponent(
        `Client: ${fullName}\nPhone: ${cleanPhone}\nEmail: ${cleanEmail}\nAgency: ${agencyName}\nWebsite: ${websiteUrl}\nGoals: ${bottlenecks}\nMeeting Platform: Google Meet`
      )
      const startDt = new Date(scheduledAt)
      const endDt = new Date(startDt.getTime() + 60 * 60 * 1000)
      const formatCalDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      const datesParam = `${formatCalDate(startDt)}/${formatCalDate(endDt)}`
      calendarEventUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${datesParam}&details=${eventDesc}&add=${encodeURIComponent(cleanEmail)}&add=${encodeURIComponent(assignedAgentEmail)}`
    }

    // Fallback Google Meet link if not returned
    if (!googleMeetUrl) {
      googleMeetUrl = process.env.GOOGLE_MEET_URL || "https://meet.google.com/qmv-oxsm-vvg"
    }

    // 5. Create Appointment in public.appointments
    if (leadId) {
      try {
        await supabase.from('appointments').insert({
          lead_id: leadId,
          assigned_agent_email: assignedAgentEmail,
          title: `1-on-1 AI Strategy Call: ${fullName}`,
          description: `Agency: ${agencyName} | Focus: ${bottlenecks}`,
          scheduled_at: new Date(scheduledAt).toISOString(),
          duration_minutes: 60,
          meeting_link: googleMeetUrl,
          status: 'upcoming'
        })
      } catch (aptErr) {
        console.warn('[Booking Create] appointments insert notice:', aptErr)
      }
    }

    // 6. Create record in legacy bookings table
    let bookingRecord = null
    try {
      const { data: bData } = await supabase
        .from('bookings')
        .insert({
          user_id: userId,
          scheduled_at: new Date(scheduledAt).toISOString(),
          status: 'confirmed',
          payment_status: paymentStatus,
          notes: notesContent
        })
        .select()
        .single()

      bookingRecord = bData
    } catch (bErr) {
      console.warn('[Booking Create] Legacy bookings insert notice:', bErr)
    }

    // 7. Instant WhatsApp Alert to Host (0794357912) from configured sender (0764357912)
    const hostPhoneNumber = '0794357912'
    const formattedDate = new Date(scheduledAt).toLocaleString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Nairobi'
    })

    const hostAlertMessage = [
      `🔥 *NEW HOT LEAD BOOKED — 1-on-1 AI Strategy Call*`,
      ``,
      `👤 *Client:* ${fullName}`,
      `📞 *Phone / WhatsApp:* ${cleanPhone}`,
      `✉️ *Email:* ${cleanEmail}`,
      `🏢 *Agency / Company:* ${agencyName || 'N/A'}`,
      `🌐 *Website / Social:* ${websiteUrl || 'N/A'}`,
      `📅 *Date & Time:* ${formattedDate} EAT`,
      `💰 *Payment:* ${paymentMethod.toUpperCase()} (${paymentStatus.toUpperCase()}) — KES 5,000 / $40 USD`,
      `🎯 *Bottlenecks:* ${bottlenecks || 'N/A'}`,
      ``,
      `🔗 *Google Meet:* ${googleMeetUrl}`,
      ``,
      `_Lead automatically assigned to atulah@cillah.dev under Hot Leads._`
    ].join('\n')

    try {
      console.log(`[WhatsApp Alert] Sending booking notification to host ${hostPhoneNumber}...`)
      await sendWhatsAppTextMessage({
        to: hostPhoneNumber,
        text: hostAlertMessage
      })
    } catch (waErr) {
      console.error('[Booking Create] WhatsApp host alert error:', waErr)
    }

    // Also send instant WhatsApp confirmation to client
    const clientConfirmationMessage = [
      `👋 Hi ${fullName.split(' ')[0]}, your 1-on-1 AI Strategy & Architecture Call with *Cillah.dev* is confirmed!`,
      ``,
      `📅 *Date & Time:* ${formattedDate} EAT`,
      `⏱️ *Duration:* 60 Minutes`,
      `🔗 *Join via Google Meet:* ${googleMeetUrl}`,
      ``,
      `We've also sent the Google Calendar invitation to your email (${cleanEmail}).`,
      `We will send you a reminder 24 hours and 1 hour before our session. See you soon!`
    ].join('\n')

    try {
      console.log(`[WhatsApp Alert] Sending booking confirmation to client ${cleanPhone}...`)
      await sendWhatsAppTextMessage({
        to: cleanPhone,
        text: clientConfirmationMessage
      })
    } catch (clientWaErr) {
      console.error('[Booking Create] WhatsApp client confirmation notice:', clientWaErr)
    }

    return NextResponse.json({
      success: true,
      message: 'Booking confirmed and hot lead recorded successfully!',
      booking: bookingRecord,
      leadId,
      googleMeetUrl,
      calendarEventUrl
    })
  } catch (err: any) {
    console.error('[Booking Create] Fatal error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
