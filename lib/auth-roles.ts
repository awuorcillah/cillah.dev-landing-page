export type UserWorkspaceRole = "sales" | "marketing"

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
 * Parses comma-separated staff roles (e.g. "sales,marketing") into supported user workspaces.
 */
export function parseAssignedWorkspaces(
  staffRole?: string | null
): UserWorkspaceRole[] {
  const raw = (staffRole || "")
    .toLowerCase()
    .split(/[,|/]/)
    .map((r) => r.trim())
    .filter(Boolean)

  const workspaces: UserWorkspaceRole[] = []
  if (raw.includes("sales") || raw.includes("ceo") || raw.length === 0) {
    workspaces.push("sales")
  }
  if (raw.includes("marketing")) {
    workspaces.push("marketing")
  }

  return workspaces.length > 0 ? workspaces : ["sales"]
}
