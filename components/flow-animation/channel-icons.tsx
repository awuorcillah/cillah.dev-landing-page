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

export function ChannelBrandLogo({
  id,
  className = "h-9 w-9",
}: {
  id: ChannelId
  className?: string
}) {
  switch (id) {
    case "whatsapp":
      return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
          <circle cx="20" cy="20" r="20" fill="#25D366" />
          <path
            fill="#FFFFFF"
            d="M20 9.5c-5.7 0-10.3 4.6-10.3 10.3 0 1.9.5 3.7 1.4 5.2L9.6 30.5l5.7-1.5c1.5.8 3.1 1.2 4.7 1.2 5.7 0 10.3-4.6 10.3-10.3S25.7 9.5 20 9.5Zm0 18.8c-1.5 0-3-.4-4.3-1.2l-.3-.2-3.4.9.9-3.3-.2-.3c-.8-1.3-1.3-2.9-1.3-4.5 0-4.7 3.8-8.5 8.5-8.5s8.5 3.8 8.5 8.5-3.7 8.6-8.4 8.6Zm4.7-6.4c-.3-.1-1.5-.8-1.8-.9-.2-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.1.2-.3.2-.6.1-.3-.1-1.1-.4-2.1-1.3-.8-.7-1.3-1.6-1.5-1.8-.1-.3 0-.4.1-.5.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4.1-.2 0-.3 0-.5-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.3s1 2.7 1.1 2.9c.1.2 2 3.1 4.8 4.3.7.3 1.2.5 1.6.6.7.2 1.3.2 1.8.1.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.5-.3Z"
          />
        </svg>
      )
    case "linkedin":
      return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
          <rect width="40" height="40" rx="9" fill="#0A66C2" />
          <path
            fill="#FFFFFF"
            d="M12.5 16.5h3.8v12.2h-3.8V16.5Zm1.9-6.1c1.2 0 2.2 1 2.2 2.2s-1 2.2-2.2 2.2a2.2 2.2 0 1 1 0-4.4Zm4.7 6.1h3.6v1.7h.1c.5-1 1.7-2 3.6-2 3.8 0 4.5 2.5 4.5 5.8v6.7h-3.8v-5.9c0-1.4 0-3.2-2-3.2s-2.3 1.5-2.3 3.1v6h-3.7V16.5Z"
          />
        </svg>
      )
    case "instagram":
      return (
        <span
          className={`inline-flex items-center justify-center rounded-[25%] ${className}`}
          style={{
            background:
              "linear-gradient(45deg, #FCAF45 0%, #F77737 32%, #E1306C 64%, #833AB4 100%)",
          }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 40 40" className="h-full w-full" aria-hidden="true">
            <rect
              x="9.5"
              y="9.5"
              width="21"
              height="21"
              rx="6"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.3"
            />
            <circle
              cx="20"
              cy="20"
              r="4.8"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.3"
            />
            <circle cx="26.1" cy="13.9" r="1.4" fill="#FFFFFF" />
          </svg>
        </span>
      )
    case "tiktok":
      return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
          <rect
            width="40"
            height="40"
            rx="10"
            fill="#0F0F12"
            stroke="#FFFFFF"
            strokeOpacity="0.16"
            strokeWidth="1"
          />
          {/* Cyan offset layer */}
          <path
            fill="#25F4EE"
            d="M21.2 10.2h2.9c.3 2.4 1.8 4.2 4.3 4.6v2.9c-1.6 0-3.1-.5-4.3-1.4v6.7a5.8 5.8 0 1 1-5-5.7v3a2.9 2.9 0 1 0 2.1 2.8V10.2Z"
            transform="translate(-1.1 -0.9)"
          />
          {/* Pink/Red offset layer */}
          <path
            fill="#FE2C55"
            d="M21.2 10.2h2.9c.3 2.4 1.8 4.2 4.3 4.6v2.9c-1.6 0-3.1-.5-4.3-1.4v6.7a5.8 5.8 0 1 1-5-5.7v3a2.9 2.9 0 1 0 2.1 2.8V10.2Z"
            transform="translate(1.1 0.9)"
          />
          {/* Crisp white foreground glyph */}
          <path
            fill="#FFFFFF"
            d="M21.2 10.2h2.9c.3 2.4 1.8 4.2 4.3 4.6v2.9c-1.6 0-3.1-.5-4.3-1.4v6.7a5.8 5.8 0 1 1-5-5.7v3a2.9 2.9 0 1 0 2.1 2.8V10.2Z"
          />
        </svg>
      )
    case "facebook":
      return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
          <circle cx="20" cy="20" r="20" fill="#1877F2" />
          <path
            fill="#FFFFFF"
            d="M22.4 31.8V21.3h3.5l.6-4.1h-4.1v-2.6c0-1.2.3-2 2-2h2.2V9c-.4-.1-1.7-.2-3.2-.2-3.2 0-5.3 1.9-5.3 5.5v3h-3.6v4.1h3.6v10.4h4.3Z"
          />
        </svg>
      )
  }
}
