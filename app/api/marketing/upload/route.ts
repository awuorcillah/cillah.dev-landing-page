import { NextRequest, NextResponse } from 'next/server'
import { resolveMarketingAuth, getServiceRoleClient } from '@/lib/marketing-auth'
import { classifyFileKind } from '@/lib/marketing-config'

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/markdown',
])

function sanitizeFileName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 100)
}

export async function POST(request: NextRequest) {
  try {
    const orgSlug = request.nextUrl.searchParams.get('org') || 'cillah-dev'
    const { context, supabase, error, status } = await resolveMarketingAuth(orgSlug)

    if (!context) {
      return NextResponse.json({ error: error || 'Unauthorized' }, { status: status || 401 })
    }

    if (!context.permissions.canUploadAndDraft) {
      return NextResponse.json(
        {
          error: `Your current Marketing role (${context.permissions.label}) has read-only Insights access and cannot upload files.`,
        },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided for upload.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'File exceeds the 50 MB upload limit.' },
        { status: 400 }
      )
    }

    const mimeType = file.type || 'application/octet-stream'
    const isAllowed =
      ALLOWED_MIME_TYPES.has(mimeType) ||
      mimeType.startsWith('image/') ||
      mimeType.startsWith('video/')

    if (!isAllowed) {
      return NextResponse.json(
        {
          error: `Unsupported file type (${mimeType}). Upload images, videos, PDF, Word, PowerPoint, or Markdown files.`,
        },
        { status: 400 }
      )
    }

    const storageClient = getServiceRoleClient() || supabase
    const safeName = sanitizeFileName(file.name || 'upload')
    const storagePath = `${orgSlug}/${context.userId}/${Date.now()}-${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await storageClient.storage
      .from('marketing-media')
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (uploadError) {
      const msg = uploadError.message || 'Storage upload failed'
      const bucketMissing =
        msg.toLowerCase().includes('bucket') || msg.toLowerCase().includes('not found')

      return NextResponse.json(
        {
          error: bucketMissing
            ? 'Storage bucket "marketing-media" is not initialized yet. Run supabase/marketing_hub_schema.sql in your Supabase SQL Editor.'
            : msg,
          schema_pending: bucketMissing,
        },
        { status: bucketMissing ? 503 : 500 }
      )
    }

    const { data: publicUrlData } = storageClient.storage
      .from('marketing-media')
      .getPublicUrl(storagePath)

    return NextResponse.json({
      file: {
        name: file.name,
        url: publicUrlData.publicUrl,
        path: storagePath,
        mime_type: mimeType,
        size_bytes: file.size,
        kind: classifyFileKind(mimeType),
      },
    })
  } catch (err: any) {
    console.error('[Marketing Upload Error]:', err)
    return NextResponse.json(
      { error: err?.message || 'Unexpected error during file upload.' },
      { status: 500 }
    )
  }
}
