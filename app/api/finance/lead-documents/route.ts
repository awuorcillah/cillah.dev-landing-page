import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerSupabase } from "@/lib/supabase/server"
import { getServiceSupabase } from "@/lib/finance-settlement"

export async function GET(request: NextRequest) {
  try {
    const authClient = await createServerSupabase()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const leadId = request.nextUrl.searchParams.get("leadId")?.trim()
    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 })
    }

    const db = getServiceSupabase()
    const [docsRes, invRes] = await Promise.all([
      db
        .from("lead_documents")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
      db
        .from("finance_invoices")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false }),
    ])

    return NextResponse.json({
      documents: docsRes.error ? [] : docsRes.data || [],
      invoices: invRes.error ? [] : invRes.data || [],
    })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed to load lead documents" },
      { status: 500 }
    )
  }
}
