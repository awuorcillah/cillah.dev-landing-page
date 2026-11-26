import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerSupabase } from "@/lib/supabase/server"
import { isSuperAdminEmail } from "@/lib/auth-roles"
import {
  CILLAH_ORG_ID,
  ROSY_ORG_ID,
  getServiceSupabase,
} from "@/lib/finance-settlement"

async function resolveOrgContext(requestedOrgSlug?: string | null) {
  const authClient = await createServerSupabase()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) return { error: "Unauthorized", status: 401 as const }

  const email = (user.email || "").toLowerCase().trim()
  const isSuper = isSuperAdminEmail(email)
  const db = getServiceSupabase()

  let org: { id: string; slug: string; name: string }

  if (!isSuper) {
    const { data: staff } = await db
      .from("staff_members")
      .select("org_id")
      .ilike("email", email)
      .maybeSingle()
    const staffOrgId = staff?.org_id || CILLAH_ORG_ID
    const { data: ownOrg } = await db
      .from("organizations")
      .select("id, slug, name")
      .eq("id", staffOrgId)
      .maybeSingle()
    org = ownOrg || {
      id: staffOrgId,
      slug: staffOrgId === ROSY_ORG_ID ? "rosy-realtors" : "cillah-dev",
      name: staffOrgId === ROSY_ORG_ID ? "Rosy Realtors Nairobi" : "cillah.dev",
    }
  } else {
    const slug = (requestedOrgSlug || "cillah-dev").toLowerCase().trim()
    const { data: found } = await db
      .from("organizations")
      .select("id, slug, name")
      .eq("slug", slug)
      .maybeSingle()
    org =
      found ||
      (slug === "rosy-realtors"
        ? { id: ROSY_ORG_ID, slug: "rosy-realtors", name: "Rosy Realtors Nairobi" }
        : { id: CILLAH_ORG_ID, slug: "cillah-dev", name: "cillah.dev" })
  }

  return { db, email, org }
}

export async function GET(request: NextRequest) {
  try {
    const orgSlug = request.nextUrl.searchParams.get("orgSlug")
    const ctx = await resolveOrgContext(orgSlug)
    if ("error" in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status })
    }

    const { db, org } = ctx
    const { data, error } = await db
      .from("finance_outflows")
      .select("*")
      .eq("org_id", org.id)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) {
      const missing =
        error.message.toLowerCase().includes("does not exist") ||
        error.message.toLowerCase().includes("schema cache")
      if (missing) {
        return NextResponse.json({ outflows: [], outflowsSchemaPending: true })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      outflows: data || [],
      outflowsSchemaPending: false,
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load outflows" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ctx = await resolveOrgContext(body.orgSlug)
    if ("error" in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status })
    }

    const { db, email, org } = ctx
    const entryType = String(body.entryType || "expense").trim()
    if (!["subscription", "salary", "expense"].includes(entryType)) {
      return NextResponse.json({ error: "Invalid entry type." }, { status: 400 })
    }

    const title = String(body.title || "").trim()
    const amountKes = Number(body.amountKes)
    if (!title || !Number.isFinite(amountKes) || amountKes < 0) {
      return NextResponse.json(
        { error: "Title and valid KES amount are required." },
        { status: 400 }
      )
    }

    const { data, error } = await db
      .from("finance_outflows")
      .insert({
        org_id: org.id,
        org_slug: org.slug,
        entry_type: entryType,
        title,
        vendor_or_person: String(body.vendorOrPerson || "").trim() || null,
        category: String(body.category || "General").trim(),
        amount_kes: amountKes,
        billing_cycle: String(
          body.billingCycle || (entryType === "subscription" || entryType === "salary" ? "monthly" : "one_time")
        ),
        status: String(body.status || (entryType === "subscription" ? "active" : "paid")),
        occurred_on: body.occurredOn || new Date().toISOString().slice(0, 10),
        payment_method: String(body.paymentMethod || "mpesa"),
        notes: String(body.notes || "").trim() || null,
        is_demo_seed: false,
        created_by_email: email,
      })
      .select("*")
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: error.message.includes("does not exist")
            ? "Run supabase/finance_outflows_schema.sql in Supabase SQL Editor first."
            : error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, outflow: data })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to save entry" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const ctx = await resolveOrgContext(body.orgSlug)
    if ("error" in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status })
    }

    const { db, org } = ctx
    const id = String(body.id || "").trim()
    if (!id) {
      return NextResponse.json({ error: "Entry id is required." }, { status: 400 })
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() }
    if (body.status) updates.status = String(body.status)
    if (body.amountKes !== undefined) updates.amount_kes = Number(body.amountKes)
    if (body.title) updates.title = String(body.title).trim()
    if (body.occurredOn) updates.occurred_on = body.occurredOn

    const { data, error } = await db
      .from("finance_outflows")
      .update(updates)
      .eq("id", id)
      .eq("org_id", org.id)
      .select("*")
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, outflow: data })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to update entry" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id")?.trim()
    const orgSlug = request.nextUrl.searchParams.get("orgSlug")
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 })
    }

    const ctx = await resolveOrgContext(orgSlug)
    if ("error" in ctx) {
      return NextResponse.json({ error: ctx.error }, { status: ctx.status })
    }

    const { db, org } = ctx
    const { error } = await db
      .from("finance_outflows")
      .delete()
      .eq("id", id)
      .eq("org_id", org.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to delete entry" },
      { status: 500 }
    )
  }
}
