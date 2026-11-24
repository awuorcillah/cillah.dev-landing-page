export type MarketingChannelId =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'linkedin'
  | 'whatsapp_status'
  | 'youtube'
  | 'website_articles'
  | 'website_use_cases'
  // Future Phase 2 channels (enable with enabled: true in MARKETING_CHANNELS)
  | 'x_twitter'
  | 'email_newsletter'
  | 'bulk_sms'
  | 'google_business_profile'

export type MarketingRoleTier =
  | 'marketing_admin'
  | 'publisher'
  | 'content_creator'
  | 'analyst'

export type MarketingPostStatus =
  | 'draft'
  | 'pending_approval'
  | 'scheduled'
  | 'published'
  | 'failed'

export interface MarketingMediaFile {
  name: string
  url: string
  path: string
  mime_type: string
  size_bytes: number
  kind: 'image' | 'video' | 'document'
}

export interface ChannelDeliveryStatus {
  state: 'live' | 'scheduled' | 'queued_webhook' | 'dispatched' | 'pending_approval' | 'draft' | 'failed'
  url?: string
  note?: string
  updated_at: string
}

export interface MarketingPostRecord {
  id: string
  organization_slug: string
  author_id?: string | null
  author_email: string
  author_name?: string | null
  title: string
  caption: string
  hashtags?: string | null
  cta_url?: string | null
  channels: MarketingChannelId[]
  media_files: MarketingMediaFile[]
  status: MarketingPostStatus
  publish_mode: 'now' | 'schedule' | 'draft'
  scheduled_at?: string | null
  published_at?: string | null
  approved_by?: string | null
  approved_at?: string | null
  website_slug?: string | null
  website_teaser?: string | null
  website_category?: string | null
  website_read_time?: string | null
  website_featured?: boolean
  channel_statuses?: Record<string, ChannelDeliveryStatus>
  created_at: string
  updated_at: string
}

export interface MarketingRoleAssignment {
  id: string
  organization_slug: string
  user_email: string
  full_name?: string | null
  marketing_role: MarketingRoleTier
  allowed_channels: MarketingChannelId[]
  is_active: boolean
  assigned_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface MarketingChannelConfig {
  id: MarketingChannelId
  label: string
  shortLabel: string
  category: 'social' | 'video' | 'messaging' | 'website' | 'outbound'
  description: string
  accentHex: string
  badgeClass: string
  selectedCardClass: string
  supportsCaptionMax: number
  acceptedMediaHint: string
  /** Flip enabled: true on any future channel to immediately expose it across Composer & Insights */
  enabled: boolean
}

export const MARKETING_CHANNELS: MarketingChannelConfig[] = [
  {
    id: 'instagram',
    label: 'Instagram',
    shortLabel: 'Instagram',
    category: 'social',
    description: 'Feed posts, Reels & Carousels',
    accentHex: '#E1306C',
    badgeClass: 'bg-pink-500/15 text-pink-300 border-pink-500/30',
    selectedCardClass: 'border-pink-500/70 bg-pink-500/10 ring-1 ring-pink-500/40',
    supportsCaptionMax: 2200,
    acceptedMediaHint: 'JPG, PNG, MP4 Reels',
    enabled: true,
  },
  {
    id: 'facebook',
    label: 'Facebook',
    shortLabel: 'Facebook',
    category: 'social',
    description: 'Page posts, Stories & Lead Ads',
    accentHex: '#1877F2',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    selectedCardClass: 'border-blue-500/70 bg-blue-500/10 ring-1 ring-blue-500/40',
    supportsCaptionMax: 5000,
    acceptedMediaHint: 'Images, Videos, Brochures',
    enabled: true,
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    shortLabel: 'TikTok',
    category: 'video',
    description: 'Short-form vertical video & trends',
    accentHex: '#25F4EE',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    selectedCardClass: 'border-cyan-400/70 bg-cyan-500/10 ring-1 ring-cyan-400/40',
    supportsCaptionMax: 2200,
    acceptedMediaHint: 'MP4 / MOV Vertical Video',
    enabled: true,
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    shortLabel: 'LinkedIn',
    category: 'social',
    description: 'B2B posts, PDFs & executive decks',
    accentHex: '#0A66C2',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    selectedCardClass: 'border-sky-500/70 bg-sky-500/10 ring-1 ring-sky-500/40',
    supportsCaptionMax: 3000,
    acceptedMediaHint: 'Images, PDFs, Decks, Video',
    enabled: true,
  },
  {
    id: 'whatsapp_status',
    label: 'WhatsApp Status',
    shortLabel: 'WA Status',
    category: 'messaging',
    description: '24h Status updates & Nairobi broadcasts',
    accentHex: '#25D366',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    selectedCardClass: 'border-emerald-500/70 bg-emerald-500/10 ring-1 ring-emerald-500/40',
    supportsCaptionMax: 700,
    acceptedMediaHint: 'Flyers, Photos, Short Clips',
    enabled: true,
  },
  {
    id: 'youtube',
    label: 'YouTube',
    shortLabel: 'YouTube',
    category: 'video',
    description: 'YouTube Shorts & full video descriptions',
    accentHex: '#FF0000',
    badgeClass: 'bg-red-500/15 text-red-300 border-red-500/30',
    selectedCardClass: 'border-red-500/70 bg-red-500/10 ring-1 ring-red-500/40',
    supportsCaptionMax: 5000,
    acceptedMediaHint: 'MP4 / MOV Video + Thumbnail',
    enabled: true,
  },
  {
    id: 'website_articles',
    label: 'Website Articles',
    shortLabel: 'Articles',
    category: 'website',
    description: 'Publishes live to cillah.dev/articles',
    accentHex: '#C9A66B',
    badgeClass: 'bg-[#C9A66B]/15 text-[#E5C992] border-[#C9A66B]/40',
    selectedCardClass: 'border-[#C9A66B] bg-[#C9A66B]/15 ring-1 ring-[#C9A66B]/50',
    supportsCaptionMax: 25000,
    acceptedMediaHint: 'Cover Image, Markdown / PDF',
    enabled: true,
  },
  {
    id: 'website_use_cases',
    label: 'Website Use Cases',
    shortLabel: 'Use Cases',
    category: 'website',
    description: 'Publishes live to cillah.dev/use-cases',
    accentHex: '#A855F7',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    selectedCardClass: 'border-purple-500/70 bg-purple-500/10 ring-1 ring-purple-500/40',
    supportsCaptionMax: 25000,
    acceptedMediaHint: 'Case Study Cover, PDF / Deck',
    enabled: true,
  },
  // ── Extensible Phase 2 Channels (flip enabled: true to activate) ──
  {
    id: 'x_twitter',
    label: 'X (Twitter)',
    shortLabel: 'X',
    category: 'social',
    description: 'Threads & real-time Kenya updates',
    accentHex: '#94A3B8',
    badgeClass: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
    selectedCardClass: 'border-slate-400/70 bg-slate-500/10 ring-1 ring-slate-400/40',
    supportsCaptionMax: 280,
    acceptedMediaHint: 'Images, Short Videos',
    enabled: false,
  },
  {
    id: 'email_newsletter',
    label: 'Email Newsletter',
    shortLabel: 'Email',
    category: 'outbound',
    description: 'Subscriber campaigns & digests',
    accentHex: '#F59E0B',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    selectedCardClass: 'border-amber-500/70 bg-amber-500/10 ring-1 ring-amber-500/40',
    supportsCaptionMax: 15000,
    acceptedMediaHint: 'Banners, PDFs',
    enabled: false,
  },
  {
    id: 'bulk_sms',
    label: 'Bulk SMS (Kenya)',
    shortLabel: 'SMS',
    category: 'outbound',
    description: "Africa's Talking / Celcom alerts",
    accentHex: '#10B981',
    badgeClass: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
    selectedCardClass: 'border-teal-500/70 bg-teal-500/10 ring-1 ring-teal-500/40',
    supportsCaptionMax: 160,
    acceptedMediaHint: 'Text Only',
    enabled: false,
  },
  {
    id: 'google_business_profile',
    label: 'Google Business Profile',
    shortLabel: 'Google Maps',
    category: 'website',
    description: 'Google Maps updates & Nairobi SEO',
    accentHex: '#34A853',
    badgeClass: 'bg-green-500/15 text-green-300 border-green-500/30',
    selectedCardClass: 'border-green-500/70 bg-green-500/10 ring-1 ring-green-500/40',
    supportsCaptionMax: 1500,
    acceptedMediaHint: 'Photos, Offer Graphics',
    enabled: false,
  },
]

export const ACTIVE_MARKETING_CHANNELS = MARKETING_CHANNELS.filter((c) => c.enabled)

export const FUTURE_MARKETING_CHANNELS = MARKETING_CHANNELS.filter((c) => !c.enabled)

export function getChannelConfig(id: string): MarketingChannelConfig | undefined {
  return MARKETING_CHANNELS.find((c) => c.id === id)
}

export interface RoleTierPermissions {
  tier: MarketingRoleTier
  label: string
  shortLabel: string
  description: string
  badgeClass: string
  canViewInsights: boolean
  canUploadAndDraft: boolean
  canPublishDirectly: boolean
  canSchedule: boolean
  canApprove: boolean
  canManageRoles: boolean
}

export const MARKETING_ROLE_TIERS: Record<MarketingRoleTier, RoleTierPermissions> = {
  marketing_admin: {
    tier: 'marketing_admin',
    label: 'Marketing Admin',
    shortLabel: 'Admin',
    description: 'Full access: publish now, schedule, approve drafts, manage team roles & view all insights.',
    badgeClass: 'bg-[#C9A66B]/20 text-[#E5C992] border-[#C9A66B]/40',
    canViewInsights: true,
    canUploadAndDraft: true,
    canPublishDirectly: true,
    canSchedule: true,
    canApprove: true,
    canManageRoles: true,
  },
  publisher: {
    tier: 'publisher',
    label: 'Publisher',
    shortLabel: 'Publisher',
    description: 'Can upload assets, publish directly to channels, schedule posts, and analyze insights.',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
    canViewInsights: true,
    canUploadAndDraft: true,
    canPublishDirectly: true,
    canSchedule: true,
    canApprove: false,
    canManageRoles: false,
  },
  content_creator: {
    tier: 'content_creator',
    label: 'Content Creator',
    shortLabel: 'Creator',
    description: 'Can upload media/documents, write captions, and submit posts for Marketing Admin approval.',
    badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
    canViewInsights: true,
    canUploadAndDraft: true,
    canPublishDirectly: false,
    canSchedule: false,
    canApprove: false,
    canManageRoles: false,
  },
  analyst: {
    tier: 'analyst',
    label: 'Analyst',
    shortLabel: 'Analyst',
    description: 'Read-only access to combined and per-channel marketing insights and ROI reports.',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/35',
    canViewInsights: true,
    canUploadAndDraft: false,
    canPublishDirectly: false,
    canSchedule: false,
    canApprove: false,
    canManageRoles: false,
  },
}

export function getRolePermissions(tier?: string | null): RoleTierPermissions {
  const clean = (tier || '').toLowerCase().trim() as MarketingRoleTier
  if (clean in MARKETING_ROLE_TIERS) {
    return MARKETING_ROLE_TIERS[clean]
  }
  return MARKETING_ROLE_TIERS.content_creator
}

export function slugifyTitle(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || `post-${Date.now()}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function classifyFileKind(mimeType: string): 'image' | 'video' | 'document' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  return 'document'
}

export function normalizeLeadSourceToChannel(source?: string | null): MarketingChannelId | null {
  const s = (source || '').toLowerCase()
  if (s.includes('instagram') || s.includes('ig')) return 'instagram'
  if (s.includes('facebook') || s.includes('fb') || s.includes('meta')) return 'facebook'
  if (s.includes('tiktok')) return 'tiktok'
  if (s.includes('linkedin')) return 'linkedin'
  if (s.includes('whatsapp') || s.includes('wa')) return 'whatsapp_status'
  if (s.includes('youtube') || s.includes('yt')) return 'youtube'
  if (s.includes('use_case') || s.includes('case_study')) return 'website_use_cases'
  if (s.includes('website') || s.includes('article') || s.includes('blog') || s.includes('seo')) {
    return 'website_articles'
  }
  return null
}
