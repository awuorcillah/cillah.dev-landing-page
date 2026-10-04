import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendWhatsAppTextMessage } from '@/lib/whatsapp'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hastygfosgyxrxzrzrur.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

/**
 * GET Handler for Meta Webhook Verification
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'cillah_whatsapp_token_2026'

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WhatsApp Webhook] Webhook verified successfully!')
    return new Response(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

/**
 * POST Handler for Meta Webhook Events (Button clicks from clients on WhatsApp)
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient(
      supabaseUrl,
      supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const body = await request.json()

    const entry = body?.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const message = value?.messages?.[0]

    if (message && message.type === 'interactive' && message.interactive?.button_reply) {
      const buttonId = message.interactive.button_reply.id // e.g. "proceed_BK-123" or "cancel_BK-123"
      const fromPhone = message.from // Client's WhatsApp number

      console.log(`[WhatsApp Webhook] Received button reply: ${buttonId} from ${fromPhone}`)

      if (buttonId.startsWith('proceed_')) {
        const bookingId = buttonId.replace('proceed_', '')

        // Update booking in Supabase
        await supabase
          .from('bookings')
          .update({
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId)

        // Send confirmation reply on WhatsApp
        await sendWhatsAppTextMessage({
          to: fromPhone,
          text: `🎉 Thank you! Your AI Automation consultation meeting has been confirmed. We look forward to speaking with you!`
        })
      } else if (buttonId.startsWith('cancel_')) {
        const bookingId = buttonId.replace('cancel_', '')

        // Update booking in Supabase
        await supabase
          .from('bookings')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
          .eq('id', bookingId)

        // Send cancellation reply on WhatsApp
        await sendWhatsAppTextMessage({
          to: fromPhone,
          text: `👍 Your appointment has been cancelled and the time slot is now opened for others. Thank you for letting us know!`
        })
      }
    }

    return NextResponse.json({ status: 'ok' }, { status: 200 })
  } catch (err: any) {
    console.error('[WhatsApp Webhook Error]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
