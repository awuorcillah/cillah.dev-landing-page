"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ChevronDown, LogIn, Menu, UserPlus, X } from "lucide-react"

export function Navbar() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [portalMenuOpen, setPortalMenuOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchUser() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, avatar_url")
            .eq("id", user.id)
            .single()

          const email = user.email?.toLowerCase() || ""
          const isAdmin =
            profile?.role === "admin" ||
            email.includes("cillah") ||
            email.includes("admin") ||
            email === "awuorcillah@gmail.com"

          if (isAdmin) setRole("admin")
          else if (profile) setRole(profile.role)
        }
      } catch {
        // Ignore transient network errors in public navbar
      }
    }
    fetchUser()
  }, [])

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false)
      }
      if (portalRef.current && !portalRef.current.contains(e.target as Node)) {
        setPortalMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems: { name: string; href: string; highlight?: boolean }[] = [
    { name: "Home", href: "/" },
    { name: "Software Services", href: "/our-services" },
    { name: "Book Consultation", href: "/book-consultation", highlight: true },
    { name: "Use Cases", href: "/use-cases" },
    { name: "Articles", href: "/articles" },
    { name: "FAQs", href: "/#faq" },
  ]

  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false
    return pathname === path
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1C1C1C]/90 backdrop-blur-md border-b border-[#F4E7E7]/10">
      <div className="container mx-auto max-w-7xl px-6 md:px-10 h-20 flex items-center justify-between gap-4">
        {/* LOGO */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative h-11 w-11 rounded-full overflow-hidden border border-[#C9A66B]/30 group-hover:border-[#C9A66B] transition-colors duration-300">
            <img
              src="/images/cillah-emblem.png"
              alt="Cillah Logo"
              className="object-cover h-full w-full"
            />
          </div>
          <span className="font-heading font-semibold text-xl tracking-tight text-[#F9F7F6] group-hover:text-[#F4E7E7] transition-colors duration-300">
            Cillah
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden lg:flex items-center gap-3.5 xl:gap-6">
          {navItems.map((item) =>
            item.highlight ? (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center justify-center bg-[#C9A66B] text-[#1C1C1C] hover:bg-[#d6b67d] font-heading font-semibold rounded-[12px] px-4 py-2 text-[13px] xl:text-[14px] tracking-wide whitespace-nowrap transition-all duration-300 shadow-[0_0_18px_rgba(201,166,107,0.3)] hover:shadow-[0_0_24px_rgba(201,166,107,0.45)]"
              >
                {item.name}
              </Link>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[13px] xl:text-[14px] font-medium tracking-wide whitespace-nowrap transition-all duration-300 ${
                  isActive(item.href)
                    ? "text-[#C9A66B]"
                    : "text-[#F9F7F6]/75 hover:text-[#F4E7E7]"
                }`}
              >
                {item.name}
              </Link>
            )
          )}

          {/* Profile Avatar Dropdown - ONLY SHOWN WHEN ACTIVELY LOGGED IN */}
          {user && (
            <div className="relative" ref={profileRef}>
              <button
                className="flex items-center gap-2 text-[#F9F7F6] hover:text-[#C9A66B] focus:outline-none cursor-pointer"
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              >
                <img
                  src={user?.user_metadata?.avatar_url || "/placeholder-avatar.png"}
                  alt="Avatar"
                  className="h-8 w-8 xl:h-9 xl:w-9 rounded-full border-2 border-[#C9A66B]/50 object-cover"
                />
                {role === "admin" && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A66B]">
                    Admin
                  </span>
                )}
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#1C1C1C] border border-[#F4E7E7]/15 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5">
                  <div className="px-4 py-2.5 bg-black/40">
                    <p className="text-xs font-semibold text-white truncate">
                      {user.email?.split("@")[0]}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/user/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#F9F7F6] hover:bg-[#C9A66B]/20 transition-colors"
                    >
                      Profile
                    </Link>
                    <Link
                      href={role === "admin" ? "/admin/dashboard" : "/user/dashboard"}
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#F9F7F6] hover:bg-[#C9A66B]/20 transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href={role === "admin" ? "/admin/pipeline" : "/user/dashboard"}
                      onClick={() => setProfileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-xs text-[#C9A66B] hover:bg-[#C9A66B]/20 transition-colors font-semibold"
                    >
                      Sales Pipeline
                    </Link>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={async () => {
                        setProfileMenuOpen(false)
                        await supabase.auth.signOut()
                        window.location.href = "/login"
                      }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* DESKTOP RIGHT ACTION: Dashboard (when logged in) OR Client Portal dropdown */}
        <div className="hidden lg:flex items-center shrink-0">
          {user ? (
            <Link
              href={role === "admin" ? "/admin/dashboard" : "/user/dashboard"}
              className="inline-flex items-center justify-center border border-[#C9A66B]/50 text-[#C9A66B] hover:bg-[#C9A66B]/10 font-heading font-semibold rounded-[12px] px-4 py-2 text-[13px] xl:text-[14px] tracking-wide whitespace-nowrap transition-all duration-300"
            >
              Client Portal
            </Link>
          ) : (
            <div className="relative" ref={portalRef}>
              <button
                type="button"
                onClick={() => setPortalMenuOpen((prev) => !prev)}
                aria-expanded={portalMenuOpen}
                aria-haspopup="menu"
                className="inline-flex items-center justify-center gap-1.5 border border-[#C9A66B]/45 bg-white/[0.03] text-[#F9F7F6] hover:border-[#C9A66B] hover:text-[#C9A66B] font-heading font-medium rounded-[12px] px-4 py-2 text-[13px] xl:text-[14px] tracking-wide whitespace-nowrap transition-all duration-300 cursor-pointer"
              >
                <span>Client Portal</span>
                <ChevronDown
                  className={`h-4 w-4 text-[#C9A66B] transition-transform duration-200 ${
                    portalMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {portalMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-52 bg-[#1C1C1C] border border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden p-1.5 space-y-1"
                >
                  <Link
                    href="/login"
                    rel="nofollow"
                    role="menuitem"
                    onClick={() => setPortalMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[13px] font-heading font-medium text-[#F9F7F6] hover:bg-[#C9A66B]/15 hover:text-[#C9A66B] transition-colors"
                  >
                    <LogIn className="h-4 w-4 text-[#C9A66B]" />
                    <span>Log In</span>
                  </Link>
                  <Link
                    href="/signup"
                    rel="nofollow"
                    role="menuitem"
                    onClick={() => setPortalMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-[13px] font-heading font-medium text-[#F9F7F6] hover:bg-[#C9A66B]/15 hover:text-[#C9A66B] transition-colors"
                  >
                    <UserPlus className="h-4 w-4 text-[#C9A66B]" />
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MOBILE MENU BUTTON (visible below lg breakpoint) */}
        <button
          className="lg:hidden text-[#F9F7F6] p-2 hover:bg-[#F4E7E7]/5 rounded-lg transition-colors cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* MOBILE NAV OVERLAY */}
      {isOpen && (
        <div className="lg:hidden absolute top-20 left-0 right-0 bg-[#1C1C1C] border-b border-[#F4E7E7]/10 px-6 py-6 flex flex-col gap-5 shadow-2xl animate-in fade-in slide-in-from-top-5 duration-200 z-50">
          <nav className="flex flex-col gap-2.5">
            {navItems.map((item) =>
              item.highlight ? (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="my-1 w-full text-center bg-[#C9A66B] text-[#1C1C1C] hover:bg-[#d6b67d] font-heading font-semibold rounded-[14px] py-3 text-[15px] tracking-wide transition-all duration-300 shadow-[0_0_18px_rgba(201,166,107,0.25)]"
                >
                  {item.name}
                </Link>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`text-base font-medium tracking-wide py-2 border-b border-[#F4E7E7]/5 ${
                    isActive(item.href) ? "text-[#C9A66B]" : "text-[#F9F7F6]/80"
                  }`}
                >
                  {item.name}
                </Link>
              )
            )}
          </nav>

          <div className="flex flex-col gap-2.5 pt-2 border-t border-white/10">
            <span className="text-[11px] font-heading font-medium uppercase tracking-[0.2em] text-[#C9A66B]">
              Client Portal
            </span>
            {user ? (
              <>
                <Link
                  href={role === "admin" ? "/admin/dashboard" : "/user/dashboard"}
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center border border-[#C9A66B]/45 text-[#C9A66B] font-heading font-semibold rounded-[14px] py-3 text-[15px] tracking-wide"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={async () => {
                    setIsOpen(false)
                    await supabase.auth.signOut()
                    window.location.href = "/login"
                  }}
                  className="w-full text-center border border-red-500/30 text-red-400 font-heading font-medium rounded-[14px] py-2.5 text-sm"
                >
                  Log Out ({user.email})
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  rel="nofollow"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center border border-[#C9A66B]/35 text-[#F9F7F6] hover:border-[#C9A66B] hover:text-[#C9A66B] font-heading font-medium rounded-[14px] py-3 text-[14px] tracking-wide transition-all duration-300"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  rel="nofollow"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center bg-white/5 border border-white/15 text-[#F9F7F6] hover:border-[#C9A66B] hover:text-[#C9A66B] font-heading font-medium rounded-[14px] py-3 text-[14px] tracking-wide transition-all duration-300"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
