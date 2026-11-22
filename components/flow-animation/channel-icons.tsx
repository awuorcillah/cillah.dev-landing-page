"use client"

export type ChannelId = "whatsapp" | "linkedin" | "instagram" | "tiktok" | "facebook"
export type SourceIconId = ChannelId | "website"

export const CHANNEL_META: { id: ChannelId; name: string }[] = [
  { id: "whatsapp", name: "WhatsApp" },
  { id: "linkedin", name: "LinkedIn" },
  { id: "instagram", name: "Instagram" },
  { id: "tiktok", name: "TikTok" },
  { id: "facebook", name: "Facebook" },
]

export function ChannelOutlineIcon({
  id,
  className,
}: {
  id: SourceIconId
  className?: string
}) {
  const sharedProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true as const,
  }

  switch (id) {
    case "whatsapp":
      return (
        <svg {...sharedProps}>
          <path d="M20 11.5a8 8 0 0 1-11.7 7.1L4 20l1.4-4.1A8 8 0 1 1 20 11.5Z" />
          <path d="M9.5 9.2c.2-.5.5-.5.8-.5h.5c.2 0 .4.1.5.4l.7 1.6c.1.2 0 .5-.1.6l-.5.6c-.1.1-.1.3 0 .5.4.8 1.2 1.5 2 1.9.2.1.4.1.5 0l.6-.5c.2-.1.4-.2.6-.1l1.5.7c.3.1.4.3.4.5v.5c0 .3-.1.6-.5.8-.6.3-1.7.4-3.3-.3-1.8-.8-3.3-2.3-4.1-4.1-.7-1.6-.6-2.7-.3-3.3Z" />
        </svg>
      )
    case "linkedin":
      return (
        <svg {...sharedProps}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M8 11v5" />
          <circle cx="8" cy="8" r="0.7" fill="currentColor" stroke="none" />
          <path d="M12 16v-5" />
          <path d="M12 13a2.2 2.2 0 0 1 4.4 0v3" />
        </svg>
      )
    case "instagram":
      return (
        <svg {...sharedProps}>
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
        </svg>
      )
    case "tiktok":
      return (
        <svg {...sharedProps}>
          <path d="M14 4v10.5a3.5 3.5 0 1 1-2.5-3.35" />
          <path d="M14 4c.7 2.4 2.4 4 5 4.3" />
        </svg>
      )
    case "facebook":
      return (
        <svg {...sharedProps}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M14.8 8H13a2 2 0 0 0-2 2v11" />
          <path d="M9 13h5.2" />
        </svg>
      )
    case "website":
      return (
        <svg {...sharedProps}>
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M3 9h18" />
          <path d="M7 13h5" />
          <path d="M7 16h10" />
        </svg>
      )
  }
}
