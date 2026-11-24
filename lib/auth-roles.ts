export type UserWorkspaceRole = "sales" | "marketing" | "finance"

export const SUPER_ADMIN_EMAILS = ["awuorcillah@gmail.com"] as const

export function isSuperAdminEmail(email?: string | null): boolean {
  if (!email) return false
  const clean = email.toLowerCase().trim()
  return (SUPER_ADMIN_EMAILS as readonly string[]).includes(clean)
}

/**
 * Determines whether an account has Admin privileges.
 * Strictly trusts the database `profiles.role === "admin"` or explicit Super Admin email.
 * Never infers admin access from domain substrings like "cillah" or "atula".
 */
export function isAdminAccount(
  email?: string | null,
  profileRole?: string | null
): boolean {
  if (isSuperAdminEmail(email)) return true
  return (profileRole || "").toLowerCase().trim() === "admin"
}

/**
 * Parses comma-separated staff roles (e.g. "sales,marketing,finance") into supported user workspaces.
 */
export function parseAssignedWorkspaces(
  staffRole?: string | null,
  email?: string | null
): UserWorkspaceRole[] {
  const cleanEmail = (email || "").toLowerCase().trim()
  const raw = (staffRole || "")
    .toLowerCase()
    .split(/[,|/]/)
    .map((r) => r.trim())
    .filter(Boolean)

  // Organization owner / primary Cillah team member gets full department selector (Sales, Marketing, Finance)
  if (raw.includes("ceo") || cleanEmail === "atulah@cillah.dev") {
    return ["sales", "marketing", "finance"]
  }

  const workspaces: UserWorkspaceRole[] = []
  if (raw.includes("sales") || raw.length === 0) {
    workspaces.push("sales")
  }
  if (raw.includes("marketing")) {
    workspaces.push("marketing")
  }
  if (raw.includes("finance")) {
    workspaces.push("finance")
  }

  return workspaces.length > 0 ? workspaces : ["sales"]
}
