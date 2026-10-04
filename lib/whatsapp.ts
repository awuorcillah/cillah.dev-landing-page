export interface SendWhatsAppOptions {
  to: string
  bodyText: string
  bookingId: string
}

/**
 * Sends an interactive WhatsApp message via Meta WhatsApp Cloud API with Proceed & Cancel buttons.
 */
export async function sendWhatsAppInteractiveButtons({
  to,
  bodyText,
  bookingId
}: SendWhatsAppOptions) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    console.warn('[WhatsApp API] Missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN in env')
    return {
      success: false,
      error: 'Meta WhatsApp Cloud API credentials not configured on server (.env)'
    }
  }

  // Format phone number to international format without + (e.g. 254712345678)
  let cleanPhone = to.trim().replace(/\D/g, '')
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '254' + cleanPhone.substring(1)
  } else if (!cleanPhone.startsWith('254') && cleanPhone.length === 9) {
    cleanPhone = '254' + cleanPhone
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: {
        text: bodyText
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: `proceed_${bookingId}`,
              title: 'Proceed'
            }
          },
          {
            type: 'reply',
            reply: {
              id: `cancel_${bookingId}`,
              title: 'Cancel'
            }
          }
        ]
      }
    }
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    if (!res.ok) {
      console.error('[WhatsApp API] Meta Error:', data)
      return { success: false, error: data.error?.message || 'Meta API request failed', data }
    }

    return { success: true, data }
  } catch (err: any) {
    console.error('[WhatsApp API] Exception:', err)
    return { success: false, error: err.message || 'Network exception sending WhatsApp message' }
  }
}

/**
 * Sends a standard text message via Meta WhatsApp Cloud API.
 */
export async function sendWhatsAppTextMessage({
  to,
  text
}: {
  to: string
  text: string
}) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    console.warn('[WhatsApp API] Missing WHATSAPP credentials in env')
    return { success: false, error: 'WhatsApp API credentials missing' }
  }

  let cleanPhone = to.trim().replace(/\D/g, '')
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '254' + cleanPhone.substring(1)
  } else if (!cleanPhone.startsWith('254') && cleanPhone.length === 9) {
    cleanPhone = '254' + cleanPhone
  }

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'text',
    text: {
      body: text
    }
  }

  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    return { success: res.ok, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
