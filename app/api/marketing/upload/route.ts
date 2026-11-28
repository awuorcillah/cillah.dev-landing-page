import { NextRequest, NextResponse } from 'next/server'
import { resolveMarketingAuth, getServiceRoleClient } from '@/lib/marketing-auth'
import { classifyFileKind } from '@/lib/marketing-config'
import { createR2PresignedPutUrl, isR2Configured } from '@/lib/r2-storage'

const SUPABASE_MAX_BYTES = 50 * 1024 * 1024 // 50 MB (Supabase Free tier bucket limit)
const R2_MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024 // 2 GB (Cloudflare R2 direct PUT)
const R2_MAX_OTHER_BYTES = 100 * 1024 * 1024 // 100 MB for images/PDFs/decks

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
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

function validateFileMeta(
  sizeBytes: number,
  mimeType: string,
  useR2: boolean
): { error: string; code?: string } | null {
  const isVideo = mimeType.startsWith('video/')
  const maxBytes = useR2
    ? isVideo
      ? R2_MAX_VIDEO_BYTES
      : R2_MAX_OTHER_BYTES
    : SUPABASE_MAX_BYTES

  if (sizeBytes > maxBytes) {
    if (!useR2 && isVideo) {
      return {
        error: 'Video exceeds the 50 MB Supabase limit (connect Cloudflare R2 for multi-GB videos).',
        code: 'SUPABASE_VIDEO_LIMIT',
      }
    }
    const maxLabel = useR2 ? (isVideo ? '2 GB' : '100 MB') : '50 MB'
    return { error: `File exceeds the ${maxLabel} upload limit.` }
  }

  const isAllowed =
    ALLOWED_MIME_TYPES.has(mimeType) ||
    mimeType.startsWith('image/') ||
    mimeType.startsWith('video/')

  if (!isAllowed) {
    return {
      error: `Unsupported file type (${mimeType}). Upload images, videos (MP4/MOV/WebM), PDF, Word, PowerPoint, or Markdown files.`,
    }
  }
  return null
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

    const useR2 = isR2Configured()
    const storageClient = getServiceRoleClient() || supabase
    const contentType = request.headers.get('content-type') || ''

    // Direct browser signed upload flow (Cloudflare R2 up to 2 GB, or Supabase fallback up to 50 MB)
    if (contentType.includes('application/json')) {
      const body = await request.json()
      const fileName = String(body.filename || '').trim()
      const mimeType = String(body.content_type || 'application/octet-stream').trim()
      const sizeBytes = Number(body.size_bytes || 0)

      if (!fileName || sizeBytes <= 0) {
        return NextResponse.json({ error: 'Invalid file metadata.' }, { status: 400 })
      }

      const validationErr = validateFileMeta(sizeBytes, mimeType, useR2)
      if (validationErr) {
        return NextResponse.json(
          { error: validationErr.error, code: validationErr.code, r2Configured: useR2 },
          { status: 400 }
        )
      }

      const safeName = sanitizeFileName(fileName)
      const storagePath = `marketing/${orgSlug}/${context.userId}/${Date.now()}-${safeName}`

      // Preferred path: Cloudflare R2 (supports up to 2 GB+ videos at $0 bandwidth!)
      if (useR2) {
        const { signedUrl, publicUrl } = createR2PresignedPutUrl(storagePath, 3600)
        return NextResponse.json({
          signedUrl,
          provider: 'r2',
          file: {
            name: fileName,
            url: publicUrl,
            path: storagePath,
            mime_type: mimeType,
            size_bytes: sizeBytes,
            kind: classifyFileKind(mimeType),
          },
        })
      }

      // Fallback path: Supabase Storage signed upload URL (up to 50 MB)
      const supaPath = `${orgSlug}/${context.userId}/${Date.now()}-${safeName}`
      const { data: signedData, error: signErr } = await storageClient.storage
        .from('marketing-media')
        .createSignedUploadUrl(supaPath)

      if (signErr || !signedData?.signedUrl) {
        const msg = signErr?.message || 'Could not initialize direct storage upload.'
        const bucketMissing =
          msg.toLowerCase().includes('bucket') || msg.toLowerCase().includes('not found')
        return NextResponse.json(
          {
            error: bucketMissing
              ? 'Storage bucket "marketing-media" is not initialized yet. Run supabase/marketing_hub_schema.sql in Supabase SQL Editor.'
              : msg,
            schema_pending: bucketMissing,
          },
          { status: bucketMissing ? 503 : 500 }
        )
      }

      const { data: publicUrlData } = storageClient.storage
        .from('marketing-media')
        .getPublicUrl(supaPath)

      return NextResponse.json({
        signedUrl: signedData.signedUrl,
        token: signedData.token,
        provider: 'supabase',
        file: {
          name: fileName,
          url: publicUrlData.publicUrl,
          path: supaPath,
          mime_type: mimeType,
          size_bytes: sizeBytes,
          kind: classifyFileKind(mimeType),
        },
      })
    }

    // Legacy multipart FormData fallback (for small files <= 4 MB)
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided for upload.' }, { status: 400 })
    }

    const mimeType = file.type || 'application/octet-stream'
    const validationErr = validateFileMeta(file.size, mimeType, false)
    if (validationErr) {
      return NextResponse.json({ error: validationErr.error }, { status: 400 })
    }

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
