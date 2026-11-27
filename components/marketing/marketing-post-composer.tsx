'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import {
  UploadCloud,
  FileText,
  Film,
  Image as ImageIcon,
  X,
  Check,
  Send,
  CalendarClock,
  Save,
  Lock,
  Sparkles,
  Globe,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Smartphone,
  Laptop,
  Tablet,
  Hash,
  Link2,
} from 'lucide-react'
import {
  ACTIVE_MARKETING_CHANNELS,
  FUTURE_MARKETING_CHANNELS,
  formatFileSize,
  getChannelConfig,
  slugifyTitle,
  type MarketingChannelId,
  type MarketingMediaFile,
  type MarketingPostRecord,
  type RoleTierPermissions,
} from '@/lib/marketing-config'

interface MarketingPostComposerProps {
  organizationSlug: string
  permissions: RoleTierPermissions
  posts: MarketingPostRecord[]
  loadingPosts: boolean
  selectedChannels?: MarketingChannelId[]
  onToggleChannel?: (channelId: MarketingChannelId) => void
  connectedChannels?: string[]
  onOpenConnections?: () => void
  onPostsChanged: () => void
}

export default function MarketingPostComposer({
  organizationSlug,
  permissions,
  posts,
  loadingPosts,
  selectedChannels: controlledChannels,
  onToggleChannel,
  connectedChannels = [],
  onOpenConnections,
  onPostsChanged,
}: MarketingPostComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Uploaded files (images, videos, PDFs/docs)
  const [mediaFiles, setMediaFiles] = useState<MarketingMediaFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadingLabel, setUploadingLabel] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  // Selected Channels (controlled from Channel ▾ dropdown in MarketingHub, with local fallback)
  const [localChannels, setLocalChannels] = useState<MarketingChannelId[]>([
    'instagram',
    'whatsapp_status',
  ])
  const selectedChannels = controlledChannels ?? localChannels

  // Post Copy (Website slug, read time & teaser are generated automatically!)
  const [title, setTitle] = useState('')
  const [caption, setCaption] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [websiteCategory, setWebsiteCategory] = useState('Marketing & Automation')
  const [websiteFeatured, setWebsiteFeatured] = useState(false)

  // Publish Mode & Schedule
  const [publishMode, setPublishMode] = useState<'now' | 'schedule' | 'draft'>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [queueFilter, setQueueFilter] = useState<'all' | 'published' | 'scheduled' | 'pending_approval' | 'draft'>('all')
  const [actionPostId, setActionPostId] = useState<string | null>(null)

  const includesWebsiteChannel =
    selectedChannels.includes('website_articles') ||
    selectedChannels.includes('website_use_cases')

  const tightestCharLimit = selectedChannels.reduce((min, id) => {
    const cfg = getChannelConfig(id)
    if (!cfg) return min
    return Math.min(min, cfg.supportsCaptionMax)
  }, 25000)

  const toggleChannel = (channelId: MarketingChannelId) => {
    if (onToggleChannel) {
      onToggleChannel(channelId)
    } else {
      setLocalChannels((prev) =>
        prev.includes(channelId)
          ? prev.filter((id) => id !== channelId)
          : [...prev, channelId]
      )
    }
  }

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return
    if (!permissions.canUploadAndDraft) {
      toast.error(`Your role (${permissions.label}) has read-only Insights access.`)
      return
    }

    setUploading(true)
    try {
      const uploaded: MarketingMediaFile[] = []
      for (const file of Array.from(fileList)) {
        if (file.size > 50 * 1024 * 1024) {
          toast.error(`${file.name} is ${formatFileSize(file.size)} — max upload size is 50 MB.`)
          continue
        }

        setUploadingLabel(`Uploading ${file.name} (${formatFileSize(file.size)})...`)

        // Step 1: Request a direct-to-Supabase signed upload URL (bypasses Vercel's 4.5 MB body limit!)
        const signRes = await fetch(
          `/api/marketing/upload?org=${encodeURIComponent(organizationSlug)}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: file.name,
              content_type: file.type || 'application/octet-stream',
              size_bytes: file.size,
            }),
          }
        )
        const signJson = await signRes.json().catch(() => ({}))

        if (!signRes.ok || !signJson.signedUrl || !signJson.file) {
          toast.error(signJson.error || `Failed to prepare upload for ${file.name}`)
          continue
        }

        // Step 2: PUT file directly to Supabase Storage
        const putRes = await fetch(signJson.signedUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': file.type || 'application/octet-stream',
            'x-upsert': 'true',
          },
          body: file,
        })

        if (!putRes.ok) {
          const errText = await putRes.text().catch(() => '')
          toast.error(`Storage upload failed for ${file.name}${errText ? `: ${errText.slice(0, 120)}` : ''}`)
          continue
        }

        uploaded.push(signJson.file)
      }

      if (uploaded.length > 0) {
        setMediaFiles((prev) => [...prev, ...uploaded])
        toast.success(
          `Uploaded ${uploaded.length} file${uploaded.length > 1 ? 's' : ''} ready for publishing`
        )
      }
    } catch {
      toast.error('Upload failed. Check your connection and try again.')
    } finally {
      setUploading(false)
      setUploadingLabel('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeMediaFile = (path: string) => {
    setMediaFiles((prev) => prev.filter((f) => f.path !== path))
  }

  const resetForm = () => {
    setMediaFiles([])
    setTitle('')
    setCaption('')
    setHashtags('')
    setCtaUrl('')
    setWebsiteFeatured(false)
    setScheduledAt('')
    setPublishMode('now')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!permissions.canUploadAndDraft) {
      toast.error('Your role is read-only. Ask a Marketing Admin to upgrade your tier.')
      return
    }
    if (selectedChannels.length === 0) {
      toast.error('Choose at least one channel from the Channel dropdown above.')
      return
    }
    if (!title.trim() || !caption.trim()) {
      toast.error('Please enter both a headline/title and your caption or content.')
      return
    }
    if (publishMode === 'schedule' && !scheduledAt) {
      toast.error('Pick a date and time to schedule this post.')
      return
    }
    const hasVideo = mediaFiles.some((f) => f.kind === 'video')
    const hasImageOrVideo = mediaFiles.some((f) => f.kind === 'image' || f.kind === 'video')
    if (publishMode === 'now' && selectedChannels.includes('youtube') && !hasVideo) {
      toast.error('YouTube requires a video file (MP4, MOV, or WebM) — images cannot be posted to YouTube.')
      return
    }
    if (publishMode === 'now' && selectedChannels.includes('tiktok') && !hasVideo) {
      toast.error('TikTok requires a video file (MP4 or MOV).')
      return
    }
    if (publishMode === 'now' && selectedChannels.includes('instagram') && !hasImageOrVideo) {
      toast.error('Instagram requires at least one uploaded image or video.')
      return
    }

    // Automatically compute SEO slug, teaser & read time so the user never deals with technical fields!
    const cleanCaption = caption.trim()
    const wordCount = cleanCaption.split(/\s+/).filter(Boolean).length
    const autoReadTime = `${Math.max(1, Math.ceil(wordCount / 200))} min read`
    const autoTeaser =
      cleanCaption.replace(/[#*_`>-]/g, '').replace(/\s+/g, ' ').slice(0, 155) +
      (cleanCaption.length > 155 ? '...' : '')

    setSubmitting(true)
    try {
      const res = await fetch('/api/marketing/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_slug: organizationSlug,
          title: title.trim(),
          caption: cleanCaption,
          hashtags: hashtags.trim(),
          cta_url: ctaUrl.trim(),
          channels: selectedChannels,
          media_files: mediaFiles,
          publish_mode: publishMode,
          scheduled_at: publishMode === 'schedule' ? scheduledAt : null,
          website_slug: slugifyTitle(title),
          website_teaser: autoTeaser,
          website_category: websiteCategory,
          website_read_time: autoReadTime,
          website_featured: websiteFeatured,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Could not save marketing post.')
        return
      }

      if (json.roleNotice) {
        toast.info(json.roleNotice)
      } else if (publishMode === 'now') {
        const statuses = (json.post?.channel_statuses || {}) as Record<
          string,
          { state?: string; note?: string; url?: string }
        >
        const failedEntries = Object.entries(statuses).filter(([, s]) => s?.state === 'failed')
        const liveEntries = Object.entries(statuses).filter(([, s]) => s?.state === 'live')

        if (failedEntries.length > 0 && liveEntries.length === 0) {
          const [ch, st] = failedEntries[0]
          toast.error(`${getChannelConfig(ch)?.label || ch}: ${st?.note || 'Publishing failed.'}`)
        } else if (failedEntries.length > 0) {
          const failedList = failedEntries
            .map(([ch, st]) => `${getChannelConfig(ch)?.shortLabel || ch}: ${st?.note || 'Failed'}`)
            .join(' • ')
          toast.warning(`Published to ${liveEntries.length} channel(s), but failed on: ${failedList}`)
        } else {
          toast.success(
            `Published live across ${selectedChannels.length} channel${selectedChannels.length > 1 ? 's' : ''}!`
          )
        }
      } else if (publishMode === 'schedule') {
        toast.success(
          `Scheduled for ${new Date(scheduledAt).toLocaleString()} across ${selectedChannels.length} channel${selectedChannels.length > 1 ? 's' : ''}.`
        )
      } else {
        toast.success('Saved as draft.')
      }

      resetForm()
      onPostsChanged()
    } catch {
      toast.error('Network error while saving post.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleQueueAction = async (
    postId: string,
    action: 'approve_and_publish' | 'publish_now' | 'move_to_draft'
  ) => {
    setActionPostId(postId)
    try {
      const res = await fetch(
        `/api/marketing/posts?org=${encodeURIComponent(organizationSlug)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: postId, action }),
        }
      )
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Action failed.')
        return
      }
      toast.success(
        action === 'move_to_draft' ? 'Moved back to drafts.' : 'Post published successfully!'
      )
      onPostsChanged()
    } catch {
      toast.error('Failed to update post.')
    } finally {
      setActionPostId(null)
    }
  }

  const handleDeletePost = async (postId: string) => {
    setActionPostId(postId)
    try {
      const res = await fetch(
        `/api/marketing/posts?id=${encodeURIComponent(postId)}&org=${encodeURIComponent(organizationSlug)}`,
        { method: 'DELETE' }
      )
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Could not delete post.')
        return
      }
      toast.success('Post deleted.')
      onPostsChanged()
    } catch {
      toast.error('Failed to delete post.')
    } finally {
      setActionPostId(null)
    }
  }

  const filteredQueue = posts.filter((p) =>
    queueFilter === 'all' ? true : p.status === queueFilter
  )

  const submitButtonLabel = () => {
    if (!permissions.canUploadAndDraft) return 'Insights-Only Role (Locked)'
    if (publishMode === 'draft') return 'Save Draft'
    if (!permissions.canPublishDirectly) return 'Submit for Admin Approval'
    if (publishMode === 'schedule') {
      return `Schedule to ${selectedChannels.length} Channel${selectedChannels.length === 1 ? '' : 's'}`
    }
    return `Post Now to ${selectedChannels.length} Channel${selectedChannels.length === 1 ? '' : 's'}`
  }

  return (
    <div className="space-y-8">
      {/* Read-only notice for Analysts */}
      {!permissions.canUploadAndDraft && (
        <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5 flex items-start gap-3">
          <Lock className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-purple-200">
              Posting Restricted — {permissions.label} Tier
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Your current marketing role grants read-only access to Insights. Contact your Marketing Admin if you need Publisher or Content Creator permissions.
            </p>
          </div>
        </div>
      )}

      {/* STREAMLINED COMPOSER: Selected Channels pills -> Upload Media -> Title & Caption -> Schedule or Post Now */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Compact Selected Channels Strip (managed from top Channel ▾ dropdown) */}
        {selectedChannels.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedChannels.map((chId) => {
              const cfg = getChannelConfig(chId)
              if (!cfg) return null
              return (
                <span
                  key={chId}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0F1422] border border-white/10 text-[11px] font-semibold text-slate-200"
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cfg.accentHex }}
                  />
                  {cfg.label}
                  <button
                    type="button"
                    onClick={() => toggleChannel(chId)}
                    className="text-slate-400 hover:text-white cursor-pointer"
                    aria-label={`Remove ${cfg.label}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })}
          </div>
        )}

        {/* UPLOAD MEDIA + WRITE TITLE & CAPTION RIGHT BELOW */}
        <section className="rounded-2xl bg-[#0F1422] border border-white/[0.08] p-4 sm:p-6 space-y-5 shadow-xl">
          {/* Upload Media */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white">Upload Media</h3>
              <span className="text-[11px] text-slate-500">Images, videos, PDFs (up to 50 MB)</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              disabled={!permissions.canUploadAndDraft || uploading}
              accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt,.md"
              onChange={(e) => handleUploadFiles(e.target.files)}
              className="hidden"
            />

            <div
              onClick={() => {
                if (permissions.canUploadAndDraft && !uploading) {
                  fileInputRef.current?.click()
                }
              }}
              onDragOver={(e) => {
                e.preventDefault()
                if (permissions.canUploadAndDraft) setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                if (permissions.canUploadAndDraft) {
                  handleUploadFiles(e.dataTransfer.files)
                }
              }}
              className={`rounded-xl border-2 border-dashed p-5 text-center transition-all ${
                !permissions.canUploadAndDraft
                  ? 'border-slate-800 bg-slate-950/40 opacity-50 cursor-not-allowed'
                  : isDragging
                  ? 'border-[#C9A66B] bg-[#C9A66B]/10 cursor-pointer'
                  : 'border-slate-700/80 hover:border-[#C9A66B]/60 bg-slate-950/60 hover:bg-slate-950 cursor-pointer'
              }`}
            >
              {uploading ? (
                <div className="flex flex-col items-center gap-2 text-[#C9A66B]">
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <p className="text-xs font-semibold">{uploadingLabel || 'Uploading...'}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 rounded-xl bg-[#C9A66B]/15 border border-[#C9A66B]/30 flex items-center justify-center text-[#C9A66B]">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    Tap to upload photos, videos, or documents
                  </p>
                </div>
              )}
            </div>

            {mediaFiles.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {mediaFiles.map((file) => (
                  <div
                    key={file.path}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800"
                  >
                    {file.kind === 'image' ? (
                      <img
                        src={file.url}
                        alt={file.name}
                        className="w-11 h-11 rounded-lg object-cover border border-slate-800 shrink-0"
                      />
                    ) : file.kind === 'video' ? (
                      <div className="w-11 h-11 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0">
                        <Film className="w-5 h-5" />
                      </div>
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-[#C9A66B]/15 border border-[#C9A66B]/30 flex items-center justify-center text-[#C9A66B] shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-100 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">
                        {file.kind} &bull; {formatFileSize(file.size_bytes)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeMediaFile(file.path)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      aria-label={`Remove ${file.name}`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Title / Headline & Caption directly below Upload Media */}
          <div className="space-y-3.5 pt-2 border-t border-white/[0.06]">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Title / Headline <span className="text-[#C9A66B]">*</span>
              </label>
              <input
                type="text"
                required
                disabled={!permissions.canUploadAndDraft}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Write your post title or headline..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]/70 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Caption / Content <span className="text-[#C9A66B]">*</span>
                </label>
                <span
                  className={`text-[11px] font-mono ${
                    caption.length > tightestCharLimit ? 'text-amber-400' : 'text-slate-500'
                  }`}
                >
                  {caption.length.toLocaleString()} chars
                </span>
              </div>
              <textarea
                rows={includesWebsiteChannel ? 6 : 4}
                required
                disabled={!permissions.canUploadAndDraft}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your caption or post content here..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]/70 transition-colors leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <Hash className="w-3.5 h-3.5 text-[#C9A66B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  disabled={!permissions.canUploadAndDraft}
                  value={hashtags}
                  onChange={(e) => setHashtags(e.target.value)}
                  placeholder="Hashtags (optional)"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]/70"
                />
              </div>

              <div className="relative">
                <Link2 className="w-3.5 h-3.5 text-[#C9A66B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  disabled={!permissions.canUploadAndDraft}
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="Link / CTA URL (optional)"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#C9A66B]/70"
                />
              </div>
            </div>

            {/* Effortless 1-line Website Auto-Publish Notice (No URL slug / technical fields!) */}
            {includesWebsiteChannel && (
              <div className="rounded-xl bg-[#C9A66B]/10 border border-[#C9A66B]/30 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-2 text-[#E5C992] font-medium">
                  <Globe className="w-4 h-4 shrink-0" />
                  Publishes automatically to cillah.dev (link &amp; summary auto-generated)
                </span>
                <label className="inline-flex items-center gap-1.5 text-slate-200 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={websiteFeatured}
                    onChange={(e) => setWebsiteFeatured(e.target.checked)}
                    className="rounded accent-[#C9A66B] w-3.5 h-3.5"
                  />
                  <span>Featured</span>
                </label>
              </div>
            )}
          </div>
        </section>

        {/* STEP 4: SCHEDULE OR POST NOW */}
        <section className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex items-center gap-3">
            <span className="w-7 h-7 rounded-full bg-[#C9A66B]/20 border border-[#C9A66B]/40 text-[#E5C992] text-xs font-extrabold flex items-center justify-center">
              4
            </span>
            <div>
              <h3 className="text-base font-bold text-white">Schedule or Post Now</h3>
              <p className="text-xs text-slate-400">
                {permissions.canPublishDirectly
                  ? 'Your role allows immediate publishing and scheduling across all selected platforms.'
                  : permissions.canUploadAndDraft
                  ? 'Content Creator mode: your post will be queued for Marketing Admin approval before going live.'
                  : 'Read-only Analyst role.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              disabled={!permissions.canUploadAndDraft}
              onClick={() => setPublishMode('now')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                publishMode === 'now'
                  ? 'border-[#C9A66B] bg-[#C9A66B]/15 ring-1 ring-[#C9A66B]/40'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Send className="w-4 h-4 text-[#C9A66B]" />
                <span>{permissions.canPublishDirectly ? 'Post Now' : 'Submit to Publish'}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {permissions.canPublishDirectly
                  ? 'Publish live immediately to selected platforms.'
                  : 'Send to Marketing Admin for 1-click publish.'}
              </p>
            </button>

            <button
              type="button"
              disabled={!permissions.canUploadAndDraft}
              onClick={() => setPublishMode('schedule')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                publishMode === 'schedule'
                  ? 'border-sky-500 bg-sky-500/15 ring-1 ring-sky-500/40'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <CalendarClock className="w-4 h-4 text-sky-400" />
                <span>Schedule Post</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Pick an exact Nairobi (EAT) date &amp; time slot.
              </p>
            </button>

            <button
              type="button"
              disabled={!permissions.canUploadAndDraft}
              onClick={() => setPublishMode('draft')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                publishMode === 'draft'
                  ? 'border-slate-500 bg-slate-800/70 ring-1 ring-slate-500/40'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Save className="w-4 h-4 text-slate-300" />
                <span>Save as Draft</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Store assets &amp; copy to finish later.
              </p>
            </button>
          </div>

          {publishMode === 'schedule' && (
            <div className="rounded-xl bg-slate-950 border border-sky-500/30 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-sky-300 shrink-0">
                <Clock className="w-4 h-4" />
                <span>Schedule Date &amp; Time (Nairobi EAT):</span>
              </div>
              <input
                type="datetime-local"
                required
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-800">
            <div className="text-xs text-slate-400">
              Active Tier:{' '}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${permissions.badgeClass}`}
              >
                {permissions.label}
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting || !permissions.canUploadAndDraft || selectedChannels.length === 0}
              className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                !permissions.canUploadAndDraft
                  ? 'bg-slate-800 text-slate-400'
                  : !permissions.canPublishDirectly && publishMode !== 'draft'
                  ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/20'
                  : 'bg-[#C9A66B] hover:bg-[#d8b87d] text-slate-950 shadow-lg shadow-[#C9A66B]/25'
              }`}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : !permissions.canUploadAndDraft ? (
                <Lock className="w-4 h-4" />
              ) : publishMode === 'schedule' ? (
                <CalendarClock className="w-4 h-4" />
              ) : publishMode === 'draft' ? (
                <Save className="w-4 h-4" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>{submitting ? 'Processing...' : submitButtonLabel()}</span>
            </button>
          </div>
        </section>
      </form>

      {/* PUBLISHING QUEUE & APPROVAL HISTORY */}
      <section className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Publishing Queue &amp; Post History</h3>
            <p className="text-xs text-slate-400">
              Track live website articles, scheduled campaigns, and pending creator approvals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['all', 'All'],
                ['published', 'Published'],
                ['scheduled', 'Scheduled'],
                ['pending_approval', 'Pending Approval'],
                ['draft', 'Drafts'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setQueueFilter(key)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  queueFilter === key
                    ? 'bg-[#C9A66B]/20 text-[#E5C992] border border-[#C9A66B]/40'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loadingPosts ? (
          <div className="py-12 flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin text-[#C9A66B]" /> Loading campaign queue...
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="py-12 text-center px-4">
            <ImageIcon className="w-9 h-9 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300">No posts in this view yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Use the guided composer above to upload media, choose channels, and publish or schedule.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredQueue.map((post) => {
              const busy = actionPostId === post.id
              const hasArticleLive =
                post.status === 'published' &&
                post.channels.includes('website_articles') &&
                post.website_slug
              const hasUseCaseLive =
                post.status === 'published' &&
                post.channels.includes('website_use_cases') &&
                post.website_slug

              return (
                <div
                  key={post.id}
                  className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          post.status === 'published'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : post.status === 'scheduled'
                            ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                            : post.status === 'pending_approval'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {post.status === 'published' ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : post.status === 'pending_approval' ? (
                          <AlertCircle className="w-3 h-3" />
                        ) : (
                          <Clock className="w-3 h-3" />
                        )}
                        <span className="capitalize">{post.status.replace('_', ' ')}</span>
                      </span>

                      <span className="text-[11px] text-slate-400">
                        By {post.author_name || post.author_email}
                      </span>

                      {post.scheduled_at && post.status === 'scheduled' && (
                        <span className="text-[11px] text-sky-300 font-medium">
                          Scheduled: {new Date(post.scheduled_at).toLocaleString()}
                        </span>
                      )}

                      {post.published_at && post.status === 'published' && (
                        <span className="text-[11px] text-slate-500">
                          Published: {new Date(post.published_at).toLocaleString()}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white truncate">{post.title}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2">{post.caption}</p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {post.channels.map((chId) => {
                        const cfg = getChannelConfig(chId)
                        return (
                          <span
                            key={chId}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              cfg?.badgeClass || 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {cfg?.shortLabel || chId}
                          </span>
                        )
                      })}

                      {Array.isArray(post.media_files) && post.media_files.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-950 border border-slate-800 text-slate-300">
                          {post.media_files.length} attachment{post.media_files.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Per-Channel Delivery Results (Live Links + Exact Failure Reasons) */}
                    {post.channel_statuses && Object.keys(post.channel_statuses).length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1.5">
                        {Object.entries(post.channel_statuses).map(([chId, st]) => {
                          if (!st) return null
                          const cfg = getChannelConfig(chId)
                          const label = cfg?.shortLabel || chId
                          if (st.state === 'failed') {
                            return (
                              <span
                                key={chId}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-[11px] text-red-300"
                              >
                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  <strong>{label} failed:</strong> {st.note || 'Upload error'}
                                </span>
                              </span>
                            )
                          }
                          if (st.state === 'live' && st.url) {
                            const isExternal = st.url.startsWith('http')
                            return isExternal ? (
                              <a
                                key={chId}
                                href={st.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25"
                              >
                                <ExternalLink className="w-3 h-3" /> View Live on {label}
                              </a>
                            ) : (
                              <Link
                                key={chId}
                                href={st.url}
                                target="_blank"
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#C9A66B]/15 border border-[#C9A66B]/35 text-[11px] font-bold text-[#E5C992] hover:bg-[#C9A66B]/25"
                              >
                                <ExternalLink className="w-3 h-3" /> View Live {label}
                              </Link>
                            )
                          }
                          return null
                        })}
                      </div>
                    )}

                    {(hasArticleLive || hasUseCaseLive) &&
                      !post.channel_statuses?.website_articles?.url &&
                      !post.channel_statuses?.website_use_cases?.url && (
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {hasArticleLive && (
                          <Link
                            href={`/articles/${post.website_slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#C9A66B] hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View Live Article
                          </Link>
                        )}
                        {hasUseCaseLive && (
                          <Link
                            href={`/use-cases/${post.website_slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-purple-300 hover:underline"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View Live Use Case
                          </Link>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Queue Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {post.status === 'pending_approval' && permissions.canApprove && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleQueueAction(post.id, 'approve_and_publish')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve &amp; Publish
                      </button>
                    )}

                    {(post.status === 'draft' || post.status === 'scheduled') &&
                      permissions.canPublishDirectly && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => handleQueueAction(post.id, 'publish_now')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#C9A66B]/20 hover:bg-[#C9A66B]/30 border border-[#C9A66B]/40 text-[#E5C992] text-xs font-bold cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" /> Publish Now
                        </button>
                      )}

                    {permissions.canUploadAndDraft && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
