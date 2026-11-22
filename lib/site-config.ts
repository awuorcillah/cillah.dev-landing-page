export const SITE_URL = "https://www.cillah.dev" as const
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/cillah-emblem.png` as const

export function absoluteUrl(path = ""): string {
  if (!path || path === "/") return SITE_URL
  if (path.startsWith("http://") || path.startsWith("https://")) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}
