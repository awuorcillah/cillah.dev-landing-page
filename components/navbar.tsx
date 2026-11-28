"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { isAdminAccount } from "@/lib/auth-roles"
import { LogIn, Menu, UserPlus, X } from "lucide-react"

export function Navbar() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

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
          const isAdmin = isAdminAccount(email, profile?.role)

          if (isAdmin) setRole("admin")
          else if (profile) setRole(profile.role)
        }
      } catch {
        // Ignore transient network errors in public navbar
      }
    }
    fetchUser()
  }, [])

  // Close drawer when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  // Close drawer automatically on route change
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const primaryItems: { name: string; href: string; highlight?: boolean }[] = [
    { name: "Home", href: "/" },
    { name: "Services", href: "/our-services" },
    { name: "Consultation", href: "/book-consultation", highlight: true },
  ]

  const secondaryItems: { name: string; href: string }[] = [
    { name: "Use Cases", href: "/use-cases" },
    { name: "Articles", href: "/articles" },
    { name: "FAQs", href: "/#faq" },
  ]

  const isActive = (path: string) => {
    if (path === "/" && pathname !== "/") return false
    return pathname === path
  }

  return (
    <header
      ref={menuRef}
      className="fixed top-0 left-0 right-0 z-50 bg-[#141418]/90 backdrop-blur-md border-b border-[#F4E7E7]/10"
    >
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 md:px-10 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Spacer on desktop to keep the 3 core page links visually centered */}
        <div className="hidden sm:block w-10 shrink-0" aria-hidden="true" />

        {/* CLEAN 3-PAGE PRIMARY NAVIGATION */}
        <nav
          aria-label="Primary navigation"
          className="flex items-center justify-center gap-2 sm:gap-6 md:gap-8"
        >
          {primaryItems.map((item) => {
            const active = isActive(item.href)
            if (item.highlight) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  className={`inline-flex items-center justify-center font-heading font-semibold rounded-[12px] px-3.5 sm:px-5 py-1.5 sm:py-2 text-[13px] sm:text-[14px] tracking-wide whitespace-nowrap transition-all duration-200 ${
                    active
                      ? "bg-[#d6b67d] text-[#141418] ring-2 ring-[#C9A66B]/60 shadow-[0_0_24px_rgba(201,166,107,0.5)]"
                      : "bg-[#C9A66B] text-[#141418] hover:bg-[#d6b67d] shadow-[0_0_16px_rgba(201,166,107,0.28)] hover:shadow-[0_0_22px_rgba(201,166,107,0.45)]"
                  }`}
                >
                  {item.name}
                </Link>
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`relative px-2.5 sm:px-3 py-1.5 text-[13px] sm:text-[14px] font-heading font-medium tracking-wide whitespace-nowrap transition-colors duration-200 ${
                  active
                    ? "text-[#C9A66B]"
                    : "text-[#F9F7F6]/80 hover:text-[#F9F7F6]"
                }`}
              >
                {item.name}
                {active && (
                  <span className="absolute left-2.5 right-2.5 -bottom-0.5 h-[2px] rounded-full bg-[#C9A66B]" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* UNIVERSAL THREE-LINE MENU BUTTON (Desktop & Mobile) */}
        <button
          type="button"
          className="inline-flex items-center justify-center h-10 w-10 rounded-xl border border-white/10 bg-white/[0.03] text-[#F9F7F6] hover:border-[#C9A66B]/50 hover:text-[#C9A66B] transition-colors cursor-pointer shrink-0"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label="Toggle navigation menu"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* THREE-LINE DROPDOWN MENU (Solid black background for maximum clarity on Desktop & Mobile) */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 top-16 sm:top-20 bg-black/75 z-40"
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-16 sm:top-20 right-0 left-0 sm:left-auto sm:right-6 md:right-10 sm:w-80 bg-[#000000] border-b sm:border border-[#C9A66B]/30 sm:rounded-2xl px-6 py-6 flex flex-col gap-5 shadow-[0_24px_60px_rgba(0,0,0,0.95)] z-50">
            <nav className="flex flex-col gap-1.5" aria-label="Secondary navigation">
              <span className="text-[10px] font-heading font-semibold uppercase tracking-[0.22em] text-[#C9A66B] px-3 pb-1.5">
                Explore
              </span>
              {secondaryItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`px-3 py-3 rounded-xl text-[15px] font-medium tracking-wide transition-colors ${
                    isActive(item.href)
                      ? "bg-[#C9A66B]/20 text-[#C9A66B]"
                      : "text-white hover:bg-white/10 hover:text-[#C9A66B]"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-3 pt-4 border-t border-white/15">
              <span className="text-[10px] font-heading font-semibold uppercase tracking-[0.22em] text-[#C9A66B] px-3">
                Client Portal
              </span>
              {user ? (
                <div className="flex flex-col gap-1.5">
                  <div className="px-3 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 mb-1">
                    <p className="text-xs font-semibold text-white truncate">
                      {user.email?.split("@")[0]}
                    </p>
                    <p className="text-[11px] text-white/60 truncate">{user.email}</p>
                  </div>
                  <Link
                    href={role === "admin" ? "/admin" : "/user/dashboard"}
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-3 rounded-xl text-[14px] font-semibold bg-[#C9A66B]/15 border border-[#C9A66B]/40 text-[#E5C687] hover:bg-[#C9A66B]/25 text-center transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      setIsOpen(false)
                      try {
                        await Promise.race([
                          supabase.auth.signOut({ scope: "local" }),
                          new Promise((resolve) => setTimeout(resolve, 1200)),
                        ])
                      } catch {}
                      window.location.replace("/")
                    }}
                    className="mt-1 w-full text-center border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 font-heading font-medium rounded-xl py-2.5 text-xs transition-colors cursor-pointer"
                  >
                    Log Out
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    href="/login"
                    rel="nofollow"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 border border-[#C9A66B]/50 bg-white/[0.04] text-white hover:border-[#C9A66B] hover:text-[#C9A66B] font-heading font-medium rounded-xl py-3 text-[13px] tracking-wide transition-colors"
                  >
                    <LogIn className="h-3.5 w-3.5 text-[#C9A66B]" />
                    <span>Log In</span>
                  </Link>
                  <Link
                    href="/signup"
                    rel="nofollow"
                    onClick={() => setIsOpen(false)}
                    className="inline-flex items-center justify-center gap-1.5 bg-[#C9A66B]/15 border border-[#C9A66B]/40 text-white hover:border-[#C9A66B] hover:text-[#C9A66B] font-heading font-medium rounded-xl py-3 text-[13px] tracking-wide transition-colors"
                  >
                    <UserPlus className="h-3.5 w-3.5 text-[#C9A66B]" />
                    <span>Sign Up</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  )
}
