import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerSupabase } from "@/lib/supabase/server"
import { CILLAH_ORG_ID, ROSY_ORG_ID, getServiceSupabase } from "@/lib/finance-settlement"

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024 // 25 MB

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 100)
}

export async function POST(request: NextRequest) {
  try {
    const authClient = await createServerSupabase()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const leadId = String(formData.get("leadId") || "").trim() || null
    const orgIdParam = String(formData.get("orgId") || "").trim()
    const orgSlug = String(formData.get("orgSlug") || "cillah-dev").trim().toLowerCase()
    const docType = String(formData.get("docType") || "contract").trim()
    const title = String(formData.get("title") || "").trim()
    const notes = String(formData.get("notes") || "").trim() || null

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Document exceeds the 25 MB limit." },
        { status: 400 }
      )
    }

    const db = getServiceSupabase()
    const orgId =
      orgIdParam || (orgSlug === "rosy-realtors" ? ROSY_ORG_ID : CILLAH_ORG_ID)
    const callerEmail = (user.email || "").toLowerCase().trim()
    const safeName = sanitizeFileName(file.name || "document.pdf")
    const storagePath = `${orgSlug}/${leadId || "general"}/${Date.now()}-${safeName}`
    const mimeType = file.type || "application/octet-stream"
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload to client-documents bucket (auto-fallback to marketing-media if bucket not yet created)
    let activeBucket = "client-documents"
    let uploadErr = (
      await db.storage.from(activeBucket).upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      })
    ).error

    if (uploadErr && uploadErr.message?.toLowerCase().includes("bucket")) {
      activeBucket = "marketing-media"
      uploadErr = (
        await db.storage.from(activeBucket).upload(`client-docs/${storagePath}`, buffer, {
          contentType: mimeType,
          upsert: true,
        })
      ).error
    }

    if (uploadErr) {
      return NextResponse.json(
        {
          error:
            uploadErr.message ||
            "Could not upload document. Run supabase/finance_paystack_and_documents_schema.sql in Supabase SQL Editor.",
        },
        { status: 500 }
      )
    }

    const finalPath = activeBucket === "client-documents" ? storagePath : `client-docs/${storagePath}`
    const { data: pubUrl } = db.storage.from(activeBucket).getPublicUrl(finalPath)
    const fileUrl = pubUrl.publicUrl

    let savedDoc: any = null
    if (leadId) {
      const { data: docRow } = await db
        .from("lead_documents")
        .insert({
          lead_id: leadId,
          org_id: orgId,
          doc_type: docType,
          title: title || file.name,
          file_name: file.name,
          file_url: fileUrl,
          file_size_bytes: file.size,
          mime_type: mimeType,
          notes,
          uploaded_by_email: callerEmail,
          uploaded_by_name: callerEmail.split("@")[0],
        })
        .select("*")
        .single()

      savedDoc = docRow

      await Promise.allSettled([
        db.from("lead_notes").insert({
          lead_id: leadId,
          author_email: callerEmail,
          author_name: callerEmail.split("@")[0],
          source: "document_uploaded",
          note_text: `Uploaded ${docType.toUpperCase()}: "${title || file.name}"\nLink: ${fileUrl}${
            notes ? `\nNotes: ${notes}` : ""
          }`,
        }),
        db.from("lead_activities").insert({
          lead_id: leadId,
          org_id: orgId,
          agent_email: orgId === CILLAH_ORG_ID ? "atulah@cillah.dev" : callerEmail,
          agent_name: orgId === CILLAH_ORG_ID ? "Atulah" : callerEmail.split("@")[0],
          activity_type: "document_uploaded",
          summary: `Uploaded ${docType} "${title || file.name}" to client drawer`,
        }),
      ])
    }

    return NextResponse.json({
      success: true,
      file: {
        name: file.name,
        title: title || file.name,
        url: fileUrl,
        size_bytes: file.size,
        mime_type: mimeType,
      },
      document: savedDoc,
    })
  } catch (err: any) {
    console.error("[Finance Upload Document] Error:", err)
    return NextResponse.json(
      { error: err?.message || "Document upload failed" },
      { status: 500 }
    )
  }
}
