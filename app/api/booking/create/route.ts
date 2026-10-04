import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
      fullName,
      email,
      phone,
      sessionTypeId,
      sessionTitle,
      reason,
      hasBusiness,
      websiteUrl,
      scheduledAt,
      isPaid,
      amount
    } = body

    if (!fullName || !email || !phone) {
      return NextResponse.json({ error: 'Name, email, and phone number are required' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()
    const website = hasBusiness === 'yes' ? (websiteUrl || 'N/A') : 'N/A'

    // 1. Find or create profile
    let userId: string | null = null
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', cleanEmail)

    if (existingProfiles && existingProfiles.length > 0) {
      const profile = existingProfiles[0]
      userId = profile.id

      // Update profile name, phone, and promote role to 'client' if paid!
      const updateData: any = {
        full_name: fullName,
        phone: phone,
        updated_at: new Date().toISOString()
      }

      if (isPaid) {
        updateData.role = 'client'
        updateData.client_type = 'consultation'
      }

      await supabase.from('profiles').update(updateData).eq('id', userId)
    } else {
      // Create new profile with service role
      const role = isPaid ? 'client' : 'user'
      const clientType = isPaid ? 'consultation' : 'none'

      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          email: cleanEmail,
          full_name: fullName,
          phone: phone,
          role,
          client_type: clientType,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (newProfile) {
        userId = newProfile.id
      }
    }

    // 2. Create Booking record
    const bookingStatus = isPaid ? 'confirmed' : 'pending'
    const paymentStatus = isPaid ? 'paid' : 'free'
    const bookingDate = scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString()

    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .insert({
        user_id: userId,
        session_type_id: sessionTypeId || null,
        scheduled_at: bookingDate,
        status: bookingStatus,
        payment_status: paymentStatus,
        notes: `Reason: ${reason || 'N/A'} | Business Website: ${website}`,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (bErr) {
      console.error('Error inserting booking:', bErr)
      return NextResponse.json({ error: bErr.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      booking,
      userId,
      message: isPaid
        ? 'Booking confirmed and client account activated!'
        : 'Free audit booking request submitted successfully!'
    })
  } catch (err: any) {
    console.error('Booking creation error:', err)
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 })
  }
}
