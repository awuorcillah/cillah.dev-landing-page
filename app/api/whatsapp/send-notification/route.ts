import { NextResponse } from 'next/server'
import { sendWhatsAppTextMessage } from '@/lib/whatsapp'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { to = '0794357912', message } = body

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message content is required' }, { status: 400 })
    }

    console.log(`[WhatsApp Notification Route] Sending alert to ${to}:`, message)

    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

    if (phoneNumberId && accessToken) {
      const res = await sendWhatsAppTextMessage({ to, text: message })
      return NextResponse.json({
        success: res.success,
        delivered: res.success,
        provider: 'meta_cloud_api',
        details: res
      })
    }

    // Fallback when WhatsApp Cloud API credentials are not yet set in production environment variables
    console.warn(`[WhatsApp Notification Route] Meta WhatsApp credentials (WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_ACCESS_TOKEN) not configured in .env. Notification logged successfully.`)

    return NextResponse.json({
      success: true,
      delivered: false,
      provider: 'simulated_logger',
      to,
      message_preview: message.substring(0, 80) + '...',
      notice: 'WhatsApp Cloud API credentials (WHATSAPP_PHONE_NUMBER_ID & WHATSAPP_ACCESS_TOKEN) need to be configured in Vercel / .env for live message transmission.'
    })
  } catch (error: any) {
    console.error('[WhatsApp Notification Route] Exception:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
