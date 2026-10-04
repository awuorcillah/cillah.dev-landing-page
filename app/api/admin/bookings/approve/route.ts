import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsAppInteractiveButtons } from '@/lib/whatsapp'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hastygfosgyxrxzrzrur.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const body = await request.json()
    const {
      bookingId,
      phone,
      meetingDate,
      meetingTime,
      customMessage,
      newStatus = 'confirmed'
    } = body

    if (!bookingId || !phone) {
      return NextResponse.json({ error: 'Booking ID and Phone number are required' }, { status: 400 })
    }

    // 1. Update Booking status and date in Supabase
    let scheduledAtIso: string | undefined = undefined
    if (meetingDate) {
      try {
        const timeStr = meetingTime || '10:00 AM'
        scheduledAtIso = new Date(`${meetingDate} ${timeStr}`).toISOString()
      } catch (e) {
        scheduledAtIso = new Date(meetingDate).toISOString()
      }
    }

    const updatePayload: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }
    if (scheduledAtIso) {
      updatePayload.scheduled_at = scheduledAtIso
    }

    await supabase.from('bookings').update(updatePayload).eq('id', bookingId)

    // 2. Format WhatsApp Body Text
    const dateTimeFormatted = `${meetingDate || 'the requested date'} at ${meetingTime || 'your requested time'}`
    const defaultText = `Your AI automation status is approved and the meeting is set for ${dateTimeFormatted}. If you would like to proceed with the meeting please press Proceed below, if not please Cancel the appointment to open slots for others.`

    const messageText = customMessage?.trim() || defaultText

    // 3. Send WhatsApp Interactive Message with Proceed & Cancel Buttons
    const waResult = await sendWhatsAppInteractiveButtons({
      to: phone,
      bodyText: messageText,
      bookingId
    })

    return NextResponse.json({
      success: true,
      whatsappSent: waResult.success,
      whatsappResponse: waResult,
      message: waResult.success
        ? 'Booking approved and WhatsApp interactive message sent to client!'
        : `Booking status updated to ${newStatus}, but WhatsApp API message could not be sent: ${waResult.error}`
    })
  } catch (err: any) {
    console.error('Error approving booking & sending WhatsApp message:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
