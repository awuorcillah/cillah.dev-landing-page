import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerSupabase } from "@/lib/supabase/server"
import { isAdminAccount, isSuperAdminEmail } from "@/lib/auth-roles"
import {
  CILLAH_ORG_ID,
  ROSY_ORG_ID,
  getServiceSupabase,
} from "@/lib/finance-settlement"
import {
  generatePublicInvoiceToken,
  isPaystackConfigured,
  isPaystackLiveMode,
} from "@/lib/paystack"

const EXCLUDED_CILLAH_DEMO_EMAILS = new Set([
  "cherrylatulah@gmail.com",
  "cherrylatulah2000@gmail.com",
  "kevin@ndakala-demo.co.ke",
  "brenda@ndakala-demo.co.ke",
  "kevin@rosyrealtors.co.ke",
  "brenda@rosyrealtors.co.ke",
  "tossie@cillah.dev",
  "ador.ai815@gmail.com",
])

async function resolveFinanceAuth(requestedOrgSlug?: string | null) {
  const authClient = await createServerSupabase()
  const {
    data: { user },
  } = await authClient.auth.getUser()

  if (!user) {
    return { error: "Unauthorized", status: 401 as const }
  }

  const email = (user.email || "").toLowerCase().trim()
  const isSuper = isSuperAdminEmail(email)
  const db = getServiceSupabase()

  const [{ data: profile }, { data: staff }] = await Promise.all([
    db.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle(),
    db
      .from("staff_members")
      .select("id, full_name, role, status, org_id")
      .ilike("email", email)
      .maybeSingle(),
  ])

  const isAdmin =
    isSuper ||
    isAdminAccount(email, profile?.role) ||
    String(staff?.status || "").toLowerCase() === "admin"

  // Resolve target organization
  let targetSlug = (requestedOrgSlug || "").toLowerCase().trim()
  let org: { id: string; slug: string; name: string } | null = null

  if (!isSuper) {
    // Non-Super Admin is strictly locked to their own organization
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
    if (!targetSlug) targetSlug = "cillah-dev"
    const { data: foundOrg } = await db
      .from("organizations")
      .select("id, slug, name")
      .eq("slug", targetSlug)
      .maybeSingle()

    if (foundOrg) {
      org = foundOrg
    } else if (targetSlug === "rosy-realtors") {
      org = { id: ROSY_ORG_ID, slug: "rosy-realtors", name: "Rosy Realtors Nairobi" }
    } else {
      org = { id: CILLAH_ORG_ID, slug: "cillah-dev", name: "cillah.dev" }
    }
  }

  return {
    db,
    user,
    email,
    displayName: staff?.full_name || profile?.full_name || email.split("@")[0],
    isSuper,
    isAdmin,
    org,
  }
}

export async function GET(request: NextRequest) {
  try {
    const orgSlugParam = request.nextUrl.searchParams.get("orgSlug")
    const auth = await resolveFinanceAuth(orgSlugParam)
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { db, org } = auth

    // Fetch invoices strictly for this org, plus staff & leads strictly for this org
    const [invoicesRes, staffRes, leadsRes, docsRes] = await Promise.all([
      db
        .from("finance_invoices")
        .select("*")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false }),
      db
        .from("staff_members")
        .select("email, full_name, org_id")
        .eq("org_id", org.id)
        .eq("is_active", true),
      db
        .from("sales_leads")
        .select("id, full_name, email, phone_number, company_name, stage, estimated_value, assigned_agent_email")
        .neq("stage", "trash")
        .order("updated_at", { ascending: false }),
      db
        .from("lead_documents")
        .select("*")
        .eq("org_id", org.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ])

    const schemaPending = Boolean(
      invoicesRes.error?.message?.toLowerCase().includes("does not exist") ||
        invoicesRes.error?.message?.toLowerCase().includes("schema cache")
    )

    const invoices = schemaPending ? [] : invoicesRes.data || []
    const documents = docsRes.error ? [] : docsRes.data || []

    const orgEmails = new Set(
      (staffRes.data || []).map((s: any) => String(s.email || "").toLowerCase())
    )
    if (org.id === CILLAH_ORG_ID) {
      orgEmails.add("atulah@cillah.dev")
      orgEmails.add("awuorcillah@gmail.com")
    }

    const orgLeads = (leadsRes.data || []).filter((l: any) => {
      const assigned = String(l.assigned_agent_email || "").toLowerCase()
      if (org.id === CILLAH_ORG_ID) {
        if (EXCLUDED_CILLAH_DEMO_EMAILS.has(assigned)) return false
        return orgEmails.has(assigned)
      }
      if (assigned === "atulah@cillah.dev" || assigned === "awuorcillah@gmail.com") {
        return false
      }
      return orgEmails.has(assigned)
    })

    // Compute live KPIs strictly for this org
    let totalCollectedKes = 0
    let pendingAmountKes = 0
    let paidCount = 0
    let unpaidCount = 0
    let mpesaCollectedKes = 0
    let cardCollectedKes = 0

    for (const inv of invoices) {
      const amt = Number(inv.paid_amount || inv.amount_kes) || 0
      if (inv.status === "payment_made") {
        totalCollectedKes += amt
        paidCount += 1
        if (String(inv.payment_method || "").includes("card")) {
          cardCollectedKes += amt
        } else {
          mpesaCollectedKes += amt
        }
      } else if (inv.status !== "cancelled") {
        pendingAmountKes += Number(inv.amount_kes) || 0
        unpaidCount += 1
      }
    }

    return NextResponse.json({
      org,
      schemaPending,
      paystackConfigured: isPaystackConfigured(),
      paystackLiveMode: isPaystackLiveMode(),
      kpis: {
        totalCollectedKes,
        pendingAmountKes,
        paidCount,
        unpaidCount,
        mpesaCollectedKes,
        cardCollectedKes,
        totalInvoices: invoices.length,
      },
      invoices,
      leads: orgLeads,
      documents,
    })
  } catch (err: any) {
    console.error("[Finance Invoices GET] Error:", err)
    return NextResponse.json(
      { error: err?.message || "Failed to load finance data" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const auth = await resolveFinanceAuth(body.orgSlug)
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { db, email, displayName, org } = auth

    const clientName = String(body.clientName || "").trim()
    const clientEmail = String(body.clientEmail || "").trim().toLowerCase() || null
    const clientPhone = String(body.clientPhone || "").trim() || null
    const clientCompany = String(body.clientCompany || "").trim() || null
    const title = String(body.title || "").trim()
    const description = String(body.description || "").trim() || null
    const invoiceType = String(body.invoiceType || "deposit").trim()
    const amountKes = Number(body.amountKes)
    const leadId = body.leadId ? String(body.leadId).trim() : null
    const allowedMethods: string[] =
      Array.isArray(body.allowedMethods) && body.allowedMethods.length > 0
        ? body.allowedMethods.filter((m: string) => m === "mpesa" || m === "card")
        : ["mpesa", "card"]
    const contractUrl = body.contractUrl ? String(body.contractUrl).trim() : null
    const contractName = body.contractName ? String(body.contractName).trim() : null
    const contractNotes = body.contractNotes ? String(body.contractNotes).trim() : null
    const dueDate = body.dueDate ? new Date(body.dueDate).toISOString() : null

    if (!clientName) {
      return NextResponse.json({ error: "Client name is required." }, { status: 400 })
    }
    if (!title) {
      return NextResponse.json({ error: "Invoice / Project title is required." }, { status: 400 })
    }
    if (!Number.isFinite(amountKes) || amountKes <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid agreed amount greater than 0 KES." },
        { status: 400 }
      )
    }

    const prefix = org.slug === "rosy-realtors" ? "ROSY" : "CIL"
    const year = new Date().getFullYear()
    const randNum = Math.floor(1000 + Math.random() * 9000)
    const invoiceNumber = `${prefix}-${year}-${randNum}`
    const publicToken = generatePublicInvoiceToken()

    const { data: invoice, error: insertErr } = await db
      .from("finance_invoices")
      .insert({
        org_id: org.id,
        org_slug: org.slug,
        lead_id: leadId,
        invoice_number: invoiceNumber,
        public_token: publicToken,
        client_name: clientName,
        client_email: clientEmail,
        client_phone: clientPhone,
        client_company: clientCompany,
        title,
        description,
        invoice_type: invoiceType,
        amount_kes: amountKes,
        currency: "KES",
        allowed_methods: allowedMethods.length > 0 ? allowedMethods : ["mpesa", "card"],
        contract_url: contractUrl,
        contract_name: contractName,
        contract_notes: contractNotes,
        status: "unpaid",
        due_date: dueDate,
        is_demo_seed: false,
        created_by_email: email,
      })
      .select("*")
      .single()

    if (insertErr || !invoice) {
      console.error("[Finance Invoices POST] Insert error:", insertErr)
      return NextResponse.json(
        {
          error:
            insertErr?.message?.includes("does not exist")
              ? "Finance tables are not initialized yet. Please run supabase/finance_paystack_and_documents_schema.sql in your Supabase SQL Editor."
              : insertErr?.message || "Failed to create invoice",
        },
        { status: 500 }
      )
    }

    const protocol = request.headers.get("x-forwarded-proto") || "https"
    const host = request.headers.get("host") || "www.cillah.dev"
    const payUrl = `${protocol}://${host}/pay/${invoice.public_token}`

    // Auto-record attached contract & invoice inside the lead's drawer documents + notes + activity log
    if (leadId) {
      const nowIso = new Date().toISOString()
      const tasks: Promise<any>[] = []

      if (contractUrl) {
        tasks.push(
          Promise.resolve(
            db.from("lead_documents").insert({
              lead_id: leadId,
              org_id: org.id,
              invoice_id: invoice.id,
              doc_type: "contract",
              title: contractName || `Contract — ${title}`,
              file_name: contractName || "Contract.pdf",
              file_url: contractUrl,
              notes:
                contractNotes ||
                `Attached to Invoice ${invoiceNumber} (KES ${amountKes.toLocaleString("en-KE")})`,
              uploaded_by_email: email,
              uploaded_by_name: displayName,
            })
          )
        )
      }

      tasks.push(
        Promise.resolve(
          db.from("lead_documents").insert({
            lead_id: leadId,
            org_id: org.id,
            invoice_id: invoice.id,
            doc_type: "invoice",
            title: `Invoice ${invoiceNumber} — ${title} (KES ${amountKes.toLocaleString("en-KE")})`,
            file_name: `${invoiceNumber}.html`,
            file_url: payUrl,
            notes: `Pay Now link (${allowedMethods.join(" / ").toUpperCase()})`,
            uploaded_by_email: email,
            uploaded_by_name: displayName,
          })
        ),
        Promise.resolve(
          db.from("lead_notes").insert({
            lead_id: leadId,
            author_email: email,
            author_name: displayName,
            source: "invoice_created",
            note_text: [
              `INVOICE CREATED — ${invoiceNumber}`,
              `Item: ${title}`,
              `Agreed Amount: KES ${amountKes.toLocaleString("en-KE")}`,
              `Allowed Payment Options: ${allowedMethods.map((m) => m.toUpperCase()).join(" & ")}`,
              contractName ? `Contract Attached: ${contractName}` : null,
              `Pay Now Link: ${payUrl}`,
            ]
              .filter(Boolean)
              .join("\n"),
          })
        ),
        Promise.resolve(
          db.from("lead_activities").insert({
            lead_id: leadId,
            org_id: org.id,
            agent_email: org.id === CILLAH_ORG_ID ? "atulah@cillah.dev" : email,
            agent_name: org.id === CILLAH_ORG_ID ? "Atulah" : displayName,
            lead_name: clientName,
            activity_type: "invoice_created",
            summary: `Created invoice ${invoiceNumber} for ${clientName} — KES ${amountKes.toLocaleString(
              "en-KE"
            )}`,
            created_at: nowIso,
          })
        )
      )

      await Promise.allSettled(tasks)
    }

    return NextResponse.json({
      success: true,
      invoice,
      payUrl,
    })
  } catch (err: any) {
    console.error("[Finance Invoices POST] Exception:", err)
    return NextResponse.json(
      { error: err?.message || "Failed to create invoice" },
      { status: 500 }
    )
  }
}
